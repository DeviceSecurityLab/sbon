const viewer = window.SBON_UI.createViewer({
  parser: window.SBON_PARSER,
  exporter: window.SBON_EXPORT,
  sampleSbom: window.SBON_SAMPLE_SBOM,
});

viewer.start();
