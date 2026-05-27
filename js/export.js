(function () {
  function exportCsv(components) {
    const headers = [
      "name",
      "version",
      "risk",
      "category",
      "package_id",
      "match_method",
      "match_confidence",
      "licenses",
      "vulnerabilities",
      "findings",
    ];
    const rows = components.map((component) => [
      component.name,
      component.version,
      riskLabel(component.risk),
      component.categoryLabel,
      component.packageId || "",
      component.matchMethod || "",
      component.matchConfidence || "",
      component.licenses.join("; "),
      component.vulnerabilities.map((item) => item.id).join("; "),
      component.findings.join("; "),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sbom-review.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  function riskLabel(risk) {
    return { high: "高", medium: "中", low: "低" }[risk] || "不明";
  }

  window.SBON_EXPORT = {
    exportCsv,
  };
})();
