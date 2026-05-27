const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function loadCore() {
  const context = {
    window: {},
    console,
  };
  context.window.window = context.window;

  for (const file of [
    "data/knowledge/packages.js",
    "data/knowledge/aliases.js",
    "data/knowledge/categories.js",
    "data/knowledge/package-categories.js",
    "data/knowledge/entries-ja.js",
    "data/knowledge/risk-rules.js",
    "data/knowledge-base.js",
    "samples/sample-cyclonedx.js",
    "js/risk.js",
    "js/parser.js",
  ]) {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }

  return context.window;
}

function testCycloneDxSample() {
  const window = loadCore();
  const normalized = window.SBON_PARSER.normalizeSbom(window.SBON_SAMPLE_SBOM);

  assert.strictEqual(normalized.format, "CycloneDX 1.5");
  assert.strictEqual(normalized.components.length, 4);
  assert.strictEqual(normalized.dependencies.size, 3);

  const openssl = normalized.components.find((component) => component.name === "openssl");
  assert.ok(openssl);
  assert.strictEqual(openssl.packageId, "pkg.openssl");
  assert.strictEqual(openssl.matchMethod, "purl-name");
  assert.strictEqual(openssl.matchConfidence, "high");
  assert.strictEqual(openssl.risk, "high");
  assert.strictEqual(openssl.category, "crypto");
  assert.deepStrictEqual(Array.from(openssl.vulnerabilities, (vulnerability) => vulnerability.id), [
    "CVE-2023-0286",
  ]);
}

function testSpdxBasicPackage() {
  const window = loadCore();
  const normalized = window.SBON_PARSER.normalizeSbom({
    spdxVersion: "SPDX-2.3",
    packages: [
      {
        SPDXID: "SPDXRef-Package-curl",
        name: "curl",
        versionInfo: "8.7.1",
        licenseConcluded: "curl",
        externalRefs: [
          {
            referenceCategory: "PACKAGE-MANAGER",
            referenceType: "purl",
            referenceLocator: "pkg:generic/curl@8.7.1",
          },
        ],
      },
      {
        SPDXID: "SPDXRef-Package-zlib",
        name: "zlib",
        versionInfo: "1.3.1",
        licenseDeclared: "Zlib",
      },
    ],
    relationships: [
      {
        spdxElementId: "SPDXRef-Package-curl",
        relationshipType: "DEPENDS_ON",
        relatedSpdxElement: "SPDXRef-Package-zlib",
      },
    ],
  });

  assert.strictEqual(normalized.format, "SPDX-2.3");
  assert.strictEqual(normalized.components.length, 2);
  assert.deepStrictEqual(Array.from(normalized.dependencies.get("SPDXRef-Package-curl")), [
    "SPDXRef-Package-zlib",
  ]);

  const curl = normalized.components.find((component) => component.name === "curl");
  assert.ok(curl);
  assert.strictEqual(curl.packageId, null);
  assert.strictEqual(curl.category, "unknown");
  assert.strictEqual(curl.risk, "medium");
}

function testAliasMatching() {
  const window = loadCore();
  const normalized = window.SBON_PARSER.normalizeSbom({
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    components: [
      {
        type: "library",
        name: "libssl",
        version: "3.2.0",
        bomRef: "pkg:deb/debian/libssl@3.2.0",
        licenses: [{ license: { id: "Apache-2.0" } }],
        purl: "pkg:deb/debian/libssl@3.2.0",
      },
    ],
  });

  const libssl = normalized.components[0];
  assert.strictEqual(libssl.packageId, "pkg.openssl");
  assert.strictEqual(libssl.matchMethod, "regex");
  assert.strictEqual(libssl.category, "crypto");
  assert.strictEqual(libssl.risk, "low");
}

function testUnknownSbomError() {
  const window = loadCore();
  assert.throws(
    () => window.SBON_PARSER.normalizeSbom({ name: "not an sbom" }),
    /CycloneDX JSON または SPDX JSON/,
  );
}

function run() {
  testCycloneDxSample();
  testSpdxBasicPackage();
  testAliasMatching();
  testUnknownSbomError();
  console.log("All tests passed");
}

run();
