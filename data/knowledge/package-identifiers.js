window.SBON_KNOWLEDGE_PACKAGE_IDENTIFIERS = [
  {
    packageId: "pkg.openssl",
    identifierType: "regex",
    value: "^(openssl|libssl|openssl-libs)$",
    ecosystem: "generic",
    confidence: "medium",
  },
  {
    packageId: "pkg.openssl",
    identifierType: "purl-name",
    value: "openssl",
    ecosystem: "generic",
    confidence: "high",
  },
  {
    packageId: "pkg.busybox",
    identifierType: "regex",
    value: "^busybox$",
    ecosystem: "generic",
    confidence: "high",
  },
  {
    packageId: "pkg.glibc",
    identifierType: "regex",
    value: "^(glibc|libc6|libc-bin)$",
    ecosystem: "generic",
    confidence: "medium",
  },
  {
    packageId: "pkg.linux-kernel",
    identifierType: "regex",
    value: "^(linux|linux-kernel|kernel)$",
    ecosystem: "generic",
    confidence: "medium",
  },
];
