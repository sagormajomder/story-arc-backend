// eslint.config.js
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

const dependencyMap = {
  auth: ['user'],
  user: [],
};

const elements = Object.keys(dependencyMap).map(name => ({
  type: name,
  pattern: `src/modules/${name}/**`,
}));

const policies = Object.entries(dependencyMap).flatMap(([from, deps]) =>
  deps.map(dep => ({
    from: { element: { type: from } },
    allow: {
      to: { element: { type: dep, fileInternalPath: '*index*' } },
    },
  })),
);

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries, import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      'boundaries/elements': elements,
    },
    rules: {
      'boundaries/dependencies': ['error', { default: 'disallow', policies }],
      'import/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
