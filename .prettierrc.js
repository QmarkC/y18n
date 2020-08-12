module.exports = {
  ...require('gts/.prettierrc.json'),
  printWidth: 80,
  semi: true,
  overrides: [
    {
      files: 'package*.json',
      options: {
        printWidth: 1000
      }
    }
  ]
};
