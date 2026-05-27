# SBON Knowledge Base Design

## 目的

SBONの日本語説明・レビュー観点・確認優先度判定を、単純な辞書から知識ベースへ発展させる。

説明辞書を増やすだけでは、パッケージ名の揺れ、エコシステム差、根拠情報、更新履歴、組織ごとの判断を扱いきれない。SBONでは、OSSコンポーネントを「名前」ではなく「正規化されたソフトウェア部品」として扱い、説明・確認優先度・参照情報を紐づける。

## 基本方針

- パッケージ名だけで判定しない
- PURL、CPE、SPDXID、distro package name、supplierを使って同定精度を上げる
- 日本語説明と確認優先度判定ルールを分離する
- 根拠URL、最終確認日、信頼度を保持する
- 静的JSONから始め、SQLiteへ自然に移行できる構造にする
- AI支援を入れる場合も、根拠となる知識ベース項目を必ず参照する

## 対象データ

知識ベースで扱う情報:

- OSSコンポーネントの正規名称
- 識別子、パッケージ名、PURL、CPE
- エコシステム
- 用途カテゴリ
- 日本語説明
- 非エンジニア向けの重要性説明
- レビュー時の確認質問
- 確認優先度判定に使うシグナル
- 公式情報や標準への参照
- 最終確認日
- 信頼度

## データモデル

### packages

正規化されたOSSコンポーネントを表す。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| canonical_name | string | 正規名称 |
| display_name | string | 表示名 |
| homepage_url | string | 公式サイト |
| source_url | string | ソースコードURL |
| description_en | string | 英語の短い説明 |
| created_at | string | 作成日時 |
| updated_at | string | 更新日時 |

例:

```json
{
  "id": "pkg.openssl",
  "canonical_name": "openssl",
  "display_name": "OpenSSL",
  "homepage_url": "https://www.openssl.org/",
  "source_url": "https://github.com/openssl/openssl"
}
```

### package_identifiers

同じOSSを指す可能性があるPURL、CPE、エコシステム名、ディストリビューション名、別名、正規表現を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | `packages.id` |
| identifier_type | string | `purl`, `purl-name`, `cpe`, `ecosystem-name`, `distro-name`, `spdx`, `alias`, `regex` |
| value | string | 識別子、別名、またはパターン |
| ecosystem | string | npm, pypi, debian, rpm, genericなど |
| confidence | string | high, medium, low |

例:

```json
{
  "package_id": "pkg.openssl",
  "identifier_type": "regex",
  "value": "^(openssl|libssl|openssl-libs)$",
  "ecosystem": "generic",
  "confidence": "medium"
}
```

### knowledge_entries

非エンジニア向けの説明を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | `packages.id` |
| language | string | `ja`, `en` |
| summary | string | 一文説明 |
| what_it_does | string | 何をする部品か |
| why_it_matters | string | なぜ確認が必要か |
| operational_impact | string | 業務・運用上の影響 |
| review_note | string | レビュー時の補足 |
| last_reviewed_at | string | 最終確認日 |
| confidence | string | high, medium, low |

例:

```json
{
  "package_id": "pkg.openssl",
  "language": "ja",
  "summary": "通信の暗号化や証明書検証に使われる暗号ライブラリです。",
  "what_it_does": "TLS通信、証明書検証、暗号処理を提供します。",
  "why_it_matters": "外部通信や更新機構で使われる場合、脆弱性の影響が大きくなります。",
  "operational_impact": "古い系列が残っている場合、更新計画やベンダーの保守方針を確認する必要があります。",
  "confidence": "high"
}
```

### categories

レビュー観点の分類を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | `crypto`, `network`, `auth`, `os`, `update`, `database`, `runtime`など |
| label_ja | string | 日本語表示名 |
| description_ja | string | 説明 |

### package_categories

パッケージとカテゴリの多対多対応。

| field | type | description |
| --- | --- | --- |
| package_id | string | `packages.id` |
| category_id | string | `categories.id` |
| confidence | string | high, medium, low |

### review_questions

レビュー時に確認すべき質問を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | `packages.id` |
| category_id | string | 関連カテゴリ |
| question_ja | string | 日本語の確認質問 |
| priority | string | high, medium, low |

例:

```json
{
  "package_id": "pkg.openssl",
  "category_id": "crypto",
  "question_ja": "このコンポーネントは外部通信、リモート管理、ソフトウェア更新で使われていますか。",
  "priority": "high"
}
```

### review_priority_rules

確認優先度判定のルールを管理する。説明文とは分離する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | 対象パッケージ。汎用ルールの場合はnull |
| rule_type | string | `version`, `vulnerability`, `license`, `metadata`, `category` |
| expression | string | ルール表現 |
| severity | string | high, medium, low |
| finding_ja | string | 表示する指摘 |
| source_id | string | 根拠 |
| enabled | boolean | 有効/無効 |

例:

```json
{
  "package_id": "pkg.openssl",
  "rule_type": "version",
  "expression": "version starts_with 1.0 or 1.1",
  "severity": "high",
  "finding_ja": "古いOpenSSL系列が使われている可能性があります。サポート状況と更新計画を確認してください。",
  "enabled": true
}
```

### references

根拠情報を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | 関連パッケージ |
| title | string | タイトル |
| url | string | URL |
| source_type | string | official, standard, advisory, database, vendor |
| retrieved_at | string | 取得日 |

### source_mappings

外部DBとの対応を管理する。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | `packages.id` |
| source | string | osv, nvd, github_advisory, endoflife_date, clearlydefined |
| external_id | string | 外部ID |
| external_url | string | 外部URL |

### organization_overrides

組織や利用環境ごとの補正を管理する。初期MVPでは未実装でよい。

| field | type | description |
| --- | --- | --- |
| id | string | 内部ID |
| package_id | string | `packages.id` |
| organization_id | string | 組織ID |
| override_type | string | category, review_priority, note, approved_version |
| value | string | 補正値 |
| reason | string | 理由 |

## 照合フロー

SBOMコンポーネントを知識ベースへ照合する順番:

1. PURL完全一致
2. CPE完全一致
3. SPDXIDまたは外部参照
4. ecosystem + package name
5. supplier + package name
6. alias exact match
7. alias regex
8. 名前のみの弱い一致
9. 不明コンポーネントとして扱う

一致結果には `match_confidence` を付与する。

```json
{
  "component_id": "pkg:generic/openssl@1.1.1w",
  "package_id": "pkg.openssl",
  "match_method": "purl-name",
  "match_value": "openssl",
  "match_confidence": "high"
}
```

## 静的JSONでの初期実装

バックエンドDBを導入する前に、以下の構成で始める。

```text
data/
  knowledge/
    packages.json
    package-identifiers.json
    categories.json
    package-categories.json
    entries.ja.json
    review-questions.ja.json
    review-priority-rules.json
    references.json
```

利点:

- Gitでレビューできる
- 静的HTMLのまま使える
- SQLite移行時にほぼそのままテーブル化できる
- テストデータとして扱いやすい

## SQLite移行案

静的JSONが大きくなったらSQLiteへ移行する。

初期テーブル:

```sql
create table packages (
  id text primary key,
  canonical_name text not null,
  display_name text not null,
  homepage_url text,
  source_url text,
  description_en text,
  created_at text,
  updated_at text
);

create table package_identifiers (
  id text primary key,
  package_id text not null,
  identifier_type text not null,
  value text not null,
  ecosystem text,
  confidence text not null,
  foreign key (package_id) references packages(id)
);

create table knowledge_entries (
  id text primary key,
  package_id text not null,
  language text not null,
  summary text not null,
  what_it_does text,
  why_it_matters text,
  operational_impact text,
  review_note text,
  last_reviewed_at text,
  confidence text not null,
  foreign key (package_id) references packages(id)
);

create table review_priority_rules (
  id text primary key,
  package_id text,
  rule_type text not null,
  expression text not null,
  severity text not null,
  finding_ja text not null,
  source_id text,
  enabled integer not null default 1
);
```

## 更新・品質管理

知識ベースの各項目には以下を求める。

- 根拠URLがある
- 最終確認日がある
- 信頼度がある
- 変更履歴がGitで追える
- 自動テストで照合結果と確認優先度判定を確認する

レビュー基準:

- 公式情報を優先する
- 推測と事実を混ぜない
- 日本語説明は非エンジニアが読める文体にする
- 確認優先度判定は説明文ではなくルールで決める

## AI支援との関係

AIは知識ベースの代替ではなく、説明補助として使う。

AIに任せてもよいもの:

- 既存の知識ベース項目から要約文を作る
- レビュー質問を自然な日本語に整える
- レポート文面を読みやすくする

AIに任せないもの:

- 根拠なしのEOL判定
- 根拠なしの脆弱性有無判定
- ライセンス上の最終判断
- 組織としての承認判断

## 次にやること

1. `data/knowledge/` の分割JSを暫定的な静的知識ベース実装として扱う
2. OpenSSL、BusyBox、Linux kernel、glibcの4件だけを新形式へ移す
3. 照合ロジックを `name regex` から `identifier based matching` に置き換える
4. テストで一致精度と確認優先度判定を固定する
5. 将来のSQLite移行時に、分割JSを同名テーブルへ移す
6. その後に対象OSSを増やす
