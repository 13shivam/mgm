module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 'latest'
    },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        'no-undef': 'warn',
        'no-case-declarations': 'off',
        'no-redeclare': 'warn',
        'no-dupe-class-members': 'error'
    },
    globals: {
        electron: 'readonly',
        ipcRenderer: 'readonly'
    }
};
