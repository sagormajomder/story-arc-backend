// eslint.config.js
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const el = type => ({ element: { type } });

const elements = [
  { type: 'auth', pattern: 'src/modules/auth/**' },
  { type: 'user', pattern: 'src/modules/user/**' },
];

const dependencyPolicies = [
  { from: el('auth'), allow: [el('user')] },
  { from: el('user'), allow: [] },
  {
    to: [el('auth'), el('user')],
    allow: [{ to: { element: { fileInternalPath: '*index.ts' } } }],
  },
];
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        { default: 'disallow', policies: dependencyPolicies },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
