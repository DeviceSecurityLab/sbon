window.SBON_KNOWLEDGE_ENTRIES_JA = [
  {
    packageId: "pkg.openssl",
    summary: "通信の暗号化や証明書検証に使われる暗号ライブラリです。",
    whatItDoes: "TLS通信、証明書検証、暗号処理を提供します。",
    whyItMatters:
      "外部通信や更新機構で使われる場合、脆弱性やサポート終了の影響が製品全体に及ぶ可能性があります。",
    operationalImpact:
      "古い系列が残っている場合、更新計画、ベンダーの保守方針、影響範囲を確認する必要があります。",
    confidence: "high",
    lastReviewedAt: "2026-05-27",
  },
  {
    packageId: "pkg.busybox",
    summary: "組み込みLinuxで基本コマンドを提供する軽量ツール群です。",
    whatItDoes: "シェル、ファイル操作、ネットワーク関連など、多数の基本コマンドをまとめて提供します。",
    whyItMatters:
      "組み込み製品で広く使われ、権限管理、保守作業、診断機能に関係する可能性があります。",
    operationalImpact: "古い版が使われている場合、保守手順や更新可能性を確認する必要があります。",
    confidence: "high",
    lastReviewedAt: "2026-05-27",
  },
  {
    packageId: "pkg.glibc",
    summary: "多くのソフトウェアが依存するC標準ライブラリです。",
    whatItDoes: "Linux上のプログラムに基本的なシステム機能を提供します。",
    whyItMatters:
      "依存範囲が広いため、脆弱性や互換性問題が複数のアプリケーションに影響する可能性があります。",
    operationalImpact: "更新にはOSやファームウェア全体の検証が必要になる場合があります。",
    confidence: "high",
    lastReviewedAt: "2026-05-27",
  },
  {
    packageId: "pkg.linux-kernel",
    summary: "機器やシステムの中核となるOSカーネルです。",
    whatItDoes: "ハードウェア制御、プロセス管理、ネットワーク、ファイルシステムなどを担います。",
    whyItMatters:
      "影響範囲が非常に広く、長期運用される製品ではサポート期間と更新方針の確認が重要です。",
    operationalImpact: "更新にはドライバ、ミドルウェア、製品検証への影響確認が必要です。",
    confidence: "high",
    lastReviewedAt: "2026-05-27",
  },
];
