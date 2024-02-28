module.exports = {
  arrowParens: 'avoid',
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  overrides: [
    {
      files: '.prettierrc',
      options: {
        parser: 'json'
      }
    }
  ]
}
