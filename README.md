# SBON

SBONは、調達・品質保証・セキュリティ管理・規制対応など、非エンジニアのSBOM利用者を想定した日本語ファーストのSBOM Viewerです。

## 使い方

`index.html` をブラウザで開きます。

- CycloneDX JSON / SPDX JSON の読み込み
- コンポーネント一覧、依存関係、詳細説明の表示
- 暗号、ネットワーク、認証、OS基盤、更新機構の観点で分類
- 脆弱性、保守確認、ライセンス未確認などに基づく確認優先度の表示
- PDF出力はブラウザの印刷機能を使用
- CSV出力はExcelで開けるUTF-8 BOM付きCSV

## テスト

```sh
npm test
```

## ファイル

- `index.html`: 画面構造
- `styles.css`: UIスタイル
- `app.js`: アプリ起動処理
- `js/`: SBOM解析、確認優先度判定、表示、出力処理
- `data/knowledge/`: 説明・識別子・カテゴリ・確認優先度ルールの知識ベース
- `samples/`: サンプルSBOM
- `tests/`: パーサと確認優先度判定のテスト
- `mvp.md`: MVPコンセプト
- `plan.md`: 開発計画
- `knowledge-base-design.md`: 説明・確認優先度知識ベースの設計
