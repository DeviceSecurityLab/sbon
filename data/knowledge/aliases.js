window.SBON_KNOWLEDGE_ALIASES = [
  {
    packageId: "pkg.openssl",
    aliasType: "regex",
    value: "^(openssl|libssl|openssl-libs)$",
    ecosystem: "generic",
    confidence: "medium",
  },
  {
    packageId: "pkg.openssl",
    aliasType: "purl-name",
    value: "openssl",
    ecosystem: "generic",
    confidence: "high",
  },
  {
    packageId: "pkg.busybox",
    aliasType: "regex",
    value: "^busybox$",
    ecosystem: "generic",
    confidence: "high",
  },
  {
    packageId: "pkg.glibc",
    aliasType: "regex",
    value: "^(glibc|libc6|libc-bin)$",
    ecosystem: "generic",
    confidence: "medium",
  },
  {
    packageId: "pkg.linux-kernel",
    aliasType: "regex",
    value: "^(linux|linux-kernel|kernel)$",
    ecosystem: "generic",
    confidence: "medium",
  },
];
