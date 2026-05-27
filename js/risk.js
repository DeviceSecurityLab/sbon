(function () {
  function enrichComponent(component) {
    const match = matchPackage(component);
    const knowledge = buildKnowledge(match);
    const findings = buildFindings(component, match, knowledge);
    const risk = scoreRisk(component, findings);

    return {
      ...component,
      packageId: match.packageId,
      matchMethod: match.method,
      matchConfidence: match.confidence,
      category: knowledge.category,
      categoryLabel: knowledge.label,
      explanation: knowledge.explanation,
      findings,
      risk,
    };
  }

  function matchPackage(component) {
    const knowledgeBase = window.SBON_KNOWLEDGE_BASE;
    const purlName = extractPurlName(component.purl);
    const normalizedName = normalizeName(component.name);

    for (const alias of knowledgeBase.aliases) {
      if (alias.aliasType === "purl-name" && purlName && normalizeName(alias.value) === purlName) {
        return {
          packageId: alias.packageId,
          method: "purl-name",
          confidence: alias.confidence,
        };
      }
    }

    for (const alias of knowledgeBase.aliases) {
      if (alias.aliasType === "name" && normalizeName(alias.value) === normalizedName) {
        return {
          packageId: alias.packageId,
          method: "name",
          confidence: alias.confidence,
        };
      }
    }

    for (const alias of knowledgeBase.aliases) {
      if (alias.aliasType === "regex" && new RegExp(alias.value, "i").test(component.name)) {
        return {
          packageId: alias.packageId,
          method: "regex",
          confidence: alias.confidence,
        };
      }
    }

    return {
      packageId: null,
      method: "none",
      confidence: "low",
    };
  }

  function buildKnowledge(match) {
    if (!match.packageId) {
      return {
        category: "unknown",
        label: "不明",
        explanation:
          "公開情報や社内台帳で用途を確認してください。用途が不明なOSSは、保守責任と影響範囲が判断しにくい状態です。",
      };
    }

    const knowledgeBase = window.SBON_KNOWLEDGE_BASE;
    const packageCategory = knowledgeBase.packageCategories.find((item) => item.packageId === match.packageId);
    const category = knowledgeBase.categories.find((item) => item.id === packageCategory?.categoryId);
    const entry = knowledgeBase.entriesJa.find((item) => item.packageId === match.packageId);

    return {
      category: category?.id || "unknown",
      label: category?.labelJa || "不明",
      explanation: entry
        ? `${entry.summary}${entry.whyItMatters ? ` ${entry.whyItMatters}` : ""}`
        : "このコンポーネントの説明は知識ベースに登録されていません。",
    };
  }

  function buildFindings(component, match, knowledge) {
    const findings = [];
    if (component.vulnerabilities.some((item) => item.severity === "high" || item.severity === "critical")) {
      findings.push("高深刻度の脆弱性があります");
    }
    if (component.vulnerabilities.length > 0) {
      findings.push("既知の脆弱性があります");
    }
    findings.push(...applyRiskRules(component, match));
    if (component.licenses.length === 0 || component.licenses.includes("NOASSERTION")) {
      findings.push("ライセンス情報が未確認です");
    }
    if (knowledge.category === "unknown") {
      findings.push("用途メタデータが不足しています");
    }
    return findings;
  }

  function applyRiskRules(component, match) {
    if (!match.packageId) return [];

    return window.SBON_KNOWLEDGE_BASE.riskRules
      .filter((rule) => rule.enabled && rule.packageId === match.packageId)
      .filter((rule) => matchesRiskRule(component, rule))
      .map((rule) => rule.findingJa);
  }

  function matchesRiskRule(component, rule) {
    if (rule.ruleType === "version-prefix") {
      const version = String(component.version || "");
      return rule.values.some((value) => version.startsWith(value));
    }
    return false;
  }

  function scoreRisk(component, findings) {
    if (
      component.vulnerabilities.some((item) => item.severity === "critical" || item.severity === "high") ||
      findings.some((finding) => finding.includes("古い"))
    ) {
      return "high";
    }

    if (component.vulnerabilities.length > 0 || findings.length > 0) {
      return "medium";
    }

    return "low";
  }

  function normalizeSeverity(severity = "unknown") {
    const lowered = String(severity).toLowerCase();
    if (["critical", "high", "medium", "low"].includes(lowered)) return lowered;
    return "unknown";
  }

  function extractPurlName(purl) {
    const match = String(purl || "").match(/^pkg:[^/]+\/(?:[^/]+\/)?([^@?#]+)/);
    return match ? normalizeName(decodeURIComponent(match[1])) : "";
  }

  function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
  }

  window.SBON_RISK = {
    enrichComponent,
    matchPackage,
    normalizeSeverity,
    scoreRisk,
  };
})();
