(function () {
  function exportCsv(components) {
    const csv = buildCsv(components);
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sbon-review-${todayString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function buildCsv(components) {
    const headers = [
      "component_id",
      "name",
      "version",
      "type",
      "purl",
      "review_priority",
      "category",
      "package_id",
      "match_method",
      "match_value",
      "match_confidence",
      "licenses",
      "vulnerability_ids",
      "vulnerability_severities",
      "findings",
      "explanation_ja",
    ];
    const rows = components.map((component) => [
      component.id,
      component.name,
      component.version,
      component.type,
      component.purl,
      reviewPriorityLabel(component.reviewPriority),
      component.categoryLabel,
      component.packageId || "",
      component.matchMethod || "",
      component.matchValue || "",
      component.matchConfidence || "",
      component.licenses.join("; "),
      component.vulnerabilities.map((item) => item.id).join("; "),
      component.vulnerabilities.map((item) => severityLabel(item.severity)).join("; "),
      component.findings.join("; "),
      component.explanation,
    ]);
    return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  }

  function csvCell(value) {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  function reviewPriorityLabel(reviewPriority) {
    return { high: "高", medium: "中", low: "低" }[reviewPriority] || "不明";
  }

  function severityLabel(severity) {
    return { critical: "緊急", high: "高", medium: "中", low: "低", unknown: "不明" }[severity] || "不明";
  }

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  window.SBON_EXPORT = {
    buildCsv,
    exportCsv,
  };
})();
