export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // Tailwind v4 resolves package imports and emits its own declaration ordering.
    "import-notation": "string",
    "at-rule-empty-line-before": null,
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,
    "custom-property-empty-line-before": null,
    "value-keyword-case": null,
    "color-hex-length": null,
    "at-rule-prelude-no-invalid": null,
    "media-feature-range-notation": null,
    "declaration-block-no-duplicate-custom-properties": null,
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "apply",
          "custom-variant",
          "plugin",
          "source",
          "tailwind",
          "theme",
          "utility",
          "variant",
        ],
      },
    ],
  },
}
