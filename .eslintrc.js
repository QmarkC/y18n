module.exports = {
  root: true,
  extends: './node_modules/gts/',
  plugins: ['node', 'prettier', 'import', 'json'],
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      spread: true,
    },
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.cjs', '.js', '.ts', '.json'],
        paths: ['node_modules/', 'node_modules/@types/'],
      },
    },
    'import/extensions': ['.js', '.ts', '.mjs', '.cjs'],
    'import/ignore': [
      'node_modules',
      '\\.(coffee|scss|css|less|hbs|svg|json)$',
    ],
    // List of polyfills for `eslint-plugin-compat` check
    // To know how to add in case you have a new one to add, please check
    // https://github.com/amilajack/eslint-plugin-compat/wiki/Adding-polyfills-(v2)
    polyfills: [],
  },
  reportUnusedDisableDirectives: true,
  rules: {
    // --------------------------------------------------
    // Imports
    // --------------------------------------------------

    // Ensure consistent use of file extension within the import path
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        json: 'always',
        md: 'always',
        svg: 'always',
        tag: 'always',
        ts: 'never',
        js: 'never',
        mjs: 'never',
      },
    ],

    // Forbid the use of extraneous packages
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-extraneous-dependencies.md
    // paths are treated both as absolute paths, and relative to process.cwd()
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'test/**', // test dir
          'scripts/**', // scripts dir
          '**/*{.,_}{test,spec}.{js,cjs,ts}', // tests where the extension or filename suffix denotes that it is a test
          '**/rollup.config.{js,cjs,mjs,ts}', // rollup config
          '**/rollup.config.*.{js,cjs,mjs,ts}', // rollup config
        ],
      },
    ],

    // Ensure absolute imports are above relative imports and that unassigned imports are ignored
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
      },
    ],

    // --------------------------------------------------
    // JSON
    // --------------------------------------------------

    // https://github.com/azeemba/eslint-plugin-json/blob/master/README.md
    'json/*': ['error', {allowComments: false}],

    // --------------------------------------------------
    // Prettier
    // --------------------------------------------------
    'prettier/prettier': [
      'error',
      {
        // Keep this in sync with .prettier.config.js
        arrowParens: 'avoid',
        bracketSpacing: false,
        printWidth: 80,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],
  },
  overrides: [
    {
      files: ['tsconfig.json', 'tsconfig.*.json'],
      rules: {
        'json/*': ['error', {allowComments: true}],
      },
    },
    {
      files: ['test/**/*'],
      env: {
        mocha: true,
      },
      rules: {},
    },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'no-unused-vars': ['off'],
        'no-useless-constructor': ['off'],
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-useless-constructor': ['error'],
      },
    },
  ],
};
