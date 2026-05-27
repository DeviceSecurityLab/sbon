(function () {
  function createViewer({ parser, exporter, sampleSbom }) {
    const state = {
      format: "未読み込み",
      components: [],
      dependencies: new Map(),
      selectedId: null,
    };

    const elements = {
      fileInput: document.querySelector("#fileInput"),
      dropzone: document.querySelector("#dropzone"),
      loadSampleButton: document.querySelector("#loadSampleButton"),
      printButton: document.querySelector("#printButton"),
      csvButton: document.querySelector("#csvButton"),
      searchInput: document.querySelector("#searchInput"),
      riskFilter: document.querySelector("#riskFilter"),
      categoryFilter: document.querySelector("#categoryFilter"),
      totalComponents: document.querySelector("#totalComponents"),
      highRiskCount: document.querySelector("#highRiskCount"),
      mediumRiskCount: document.querySelector("#mediumRiskCount"),
      vulnerabilityCount: document.querySelector("#vulnerabilityCount"),
      executiveSummary: document.querySelector("#executiveSummary"),
      componentRows: document.querySelector("#componentRows"),
      emptyRowTemplate: document.querySelector("#emptyRowTemplate"),
      detailView: document.querySelector("#detailView"),
      treeView: document.querySelector("#treeView"),
      formatLabel: document.querySelector("#formatLabel"),
      tabs: document.querySelectorAll(".tab"),
    };

    function start() {
      bindEvents();
      render();
    }

    function bindEvents() {
      elements.fileInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) loadFile(file);
      });

      elements.dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        elements.dropzone.classList.add("is-dragging");
      });

      elements.dropzone.addEventListener("dragleave", () => {
        elements.dropzone.classList.remove("is-dragging");
      });

      elements.dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        elements.dropzone.classList.remove("is-dragging");
        const file = event.dataTransfer.files?.[0];
        if (file) loadFile(file);
      });

      elements.loadSampleButton.addEventListener("click", () => loadSbom(sampleSbom));
      elements.printButton.addEventListener("click", () => window.print());
      elements.csvButton.addEventListener("click", () => exporter.exportCsv(state.components));
      elements.searchInput.addEventListener("input", render);
      elements.riskFilter.addEventListener("change", render);
      elements.categoryFilter.addEventListener("change", render);

      for (const tab of elements.tabs) {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".tab, .tab-page").forEach((item) => item.classList.remove("is-active"));
          tab.classList.add("is-active");
          document.querySelector(`#${tab.dataset.tab}View`).classList.add("is-active");
        });
      }
    }

    async function loadFile(file) {
      try {
        const json = JSON.parse(await file.text());
        loadSbom(json);
      } catch (error) {
        alert(error.message || "JSONの読み込みに失敗しました。");
      }
    }

    function loadSbom(json) {
      const normalized = parser.normalizeSbom(json);
      state.format = normalized.format;
      state.components = normalized.components;
      state.dependencies = normalized.dependencies;
      state.selectedId = state.components[0]?.id || null;
      render();
    }

    function render() {
      const filtered = getFilteredComponents();
      renderSummary();
      renderRows(filtered);
      renderDetail();
      renderTree();
    }

    function renderSummary() {
      const high = state.components.filter((component) => component.risk === "high").length;
      const medium = state.components.filter((component) => component.risk === "medium").length;
      const vulnerabilityCount = state.components.reduce(
        (total, component) => total + component.vulnerabilities.length,
        0,
      );

      elements.totalComponents.textContent = state.components.length;
      elements.highRiskCount.textContent = high;
      elements.mediumRiskCount.textContent = medium;
      elements.vulnerabilityCount.textContent = vulnerabilityCount;
      elements.formatLabel.textContent = state.format;

      const overall = high > 0 ? "高" : medium > 0 ? "中" : state.components.length > 0 ? "低" : "未評価";
      elements.executiveSummary.textContent =
        state.components.length === 0
          ? "SBOMを読み込むと、調達・品質保証・セキュリティ管理向けの確認ポイントを表示します。"
          : `このSBOMには${state.components.length}件のOSSコンポーネントが含まれます。高リスク${high}件、要確認${medium}件、既知の脆弱性${vulnerabilityCount}件です。総合リスクは「${overall}」として扱い、暗号・ネットワーク・OS基盤の項目を優先確認してください。`;
    }

    function renderRows(components) {
      elements.componentRows.textContent = "";

      if (components.length === 0) {
        elements.componentRows.append(elements.emptyRowTemplate.content.cloneNode(true));
        return;
      }

      for (const component of components) {
        const row = document.createElement("tr");
        row.className = component.id === state.selectedId ? "is-selected" : "";
        row.tabIndex = 0;
        row.innerHTML = `
          <td><span class="pkg-name">${escapeHtml(component.name)}</span><span class="pkg-id">${escapeHtml(component.purl || component.id)}</span></td>
          <td>${escapeHtml(component.version)}</td>
          <td><span class="badge ${component.risk}">${riskLabel(component.risk)}</span></td>
          <td class="category">${escapeHtml(component.categoryLabel)}</td>
          <td>${escapeHtml(component.licenses.join(", ") || "未確認")}</td>
          <td>${component.vulnerabilities.length}</td>
        `;
        row.addEventListener("click", () => selectComponent(component.id));
        row.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectComponent(component.id);
          }
        });
        elements.componentRows.append(row);
      }
    }

    function renderDetail() {
      const component = state.components.find((item) => item.id === state.selectedId);
      if (!component) {
        elements.detailView.innerHTML = '<p class="empty">一覧からコンポーネントを選択してください。</p>';
        return;
      }

      elements.detailView.innerHTML = `
        <div class="detail-title">
          <div>
            <h3>${escapeHtml(component.name)}</h3>
            <span class="pkg-id">${escapeHtml(component.purl || component.id)}</span>
          </div>
          <span class="badge ${component.risk}">${riskLabel(component.risk)}</span>
        </div>
        <div class="detail-section">
          <h4>日本語説明</h4>
          <p>${escapeHtml(component.explanation)}</p>
        </div>
        <div class="detail-section">
          <h4>確認ポイント</h4>
          ${renderList(component.findings.length ? component.findings : ["現時点で主要なリスク指標は検出されていません。"])}
        </div>
        <div class="detail-section">
          <h4>知識ベース照合</h4>
          <p>${escapeHtml(matchSummary(component))}</p>
        </div>
        <div class="detail-section">
          <h4>ライセンス</h4>
          <p>${escapeHtml(component.licenses.join(", ") || "未確認")}</p>
        </div>
        <div class="detail-section">
          <h4>脆弱性</h4>
          ${renderVulnerabilities(component.vulnerabilities)}
        </div>
      `;
    }

    function renderTree() {
      if (state.dependencies.size === 0) {
        elements.treeView.innerHTML = '<p class="empty">依存関係情報があるSBOMを読み込むと表示します。</p>';
        return;
      }

      const childRefs = new Set([...state.dependencies.values()].flat());
      const roots = [...state.dependencies.keys()].filter((ref) => !childRefs.has(ref));
      const treeRoots = roots.length ? roots : [...state.dependencies.keys()].slice(0, 5);
      elements.treeView.innerHTML = `<ul class="tree-list">${treeRoots
        .map((ref) => renderTreeNode(ref, new Set()))
        .join("")}</ul>`;
    }

    function renderTreeNode(ref, seen) {
      if (seen.has(ref)) {
        return `<li><span class="tree-node">${escapeHtml(resolveName(ref))}</span> <span class="tree-ref">循環参照</span></li>`;
      }

      const nextSeen = new Set(seen);
      nextSeen.add(ref);
      const children = state.dependencies.get(ref) || [];
      return `
        <li>
          <span class="tree-node">${escapeHtml(resolveName(ref))}</span>
          <span class="tree-ref">${escapeHtml(ref)}</span>
          ${children.length ? `<ul class="tree-list">${children.map((child) => renderTreeNode(child, nextSeen)).join("")}</ul>` : ""}
        </li>
      `;
    }

    function renderVulnerabilities(vulnerabilities) {
      if (!vulnerabilities.length) {
        return "<p>既知の脆弱性はSBOM内に記載されていません。</p>";
      }

      return renderList(
        vulnerabilities.map((item) =>
          `${item.id} (${severityLabel(item.severity)}${item.score ? `, CVSS ${item.score}` : ""}) ${item.description}`,
        ),
      );
    }

    function renderList(items) {
      return `<ul class="plain-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }

    function getFilteredComponents() {
      const query = elements.searchInput.value.trim().toLowerCase();
      const risk = elements.riskFilter.value;
      const category = elements.categoryFilter.value;

      return state.components.filter((component) => {
        const haystack = [
          component.name,
          component.version,
          component.purl,
          component.licenses.join(" "),
          component.vulnerabilities.map((item) => item.id).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return (
          (!query || haystack.includes(query)) &&
          (risk === "all" || component.risk === risk) &&
          (category === "all" || component.category === category)
        );
      });
    }

    function selectComponent(id) {
      state.selectedId = id;
      render();
    }

    function resolveName(ref) {
      const component = state.components.find((item) => item.id === ref || item.purl === ref);
      return component ? `${component.name} ${component.version}` : ref;
    }

    return {
      start,
      loadSbom,
    };
  }

  function riskLabel(risk) {
    return { high: "高", medium: "中", low: "低" }[risk] || "不明";
  }

  function severityLabel(severity) {
    return { critical: "緊急", high: "高", medium: "中", low: "低", unknown: "不明" }[severity] || "不明";
  }

  function matchSummary(component) {
    if (!component.packageId) {
      return "知識ベースには未登録です。用途、保守責任、影響範囲を確認してください。";
    }

    return `package_id: ${component.packageId}, 照合方法: ${component.matchMethod}, 信頼度: ${component.matchConfidence}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.SBON_UI = {
    createViewer,
  };
})();
