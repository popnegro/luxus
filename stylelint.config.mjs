export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['apply', 'layer', 'source', 'theme', 'plugin', 'utility'],
      },
    ],
    'property-no-vendor-prefix': [
      true,
      {
        ignoreProperties: ['mask', 'mask-image', 'mask-position', 'mask-repeat', 'mask-size'],
      },
    ],
    'custom-property-pattern': null,
    'declaration-block-single-line-max-declarations': null,
    'import-notation': null,
    'keyframes-name-pattern': null,
    'no-invalid-position-at-import-rule': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'selector-class-pattern': null,
    'selector-id-pattern': null,
  },
};
