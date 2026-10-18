// eslint.config.js
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Dependency Graph for Feature Modules
 * -------------------------------------------------------------
 * Defines which modules are permitted to import from other modules.
 * Rule: When creating a new module (e.g. 'book', 'review'), register it here
 * and specify which other modules it is allowed to depend upon.
 */
const dependencyMap = {
  auth: ['user'], // 'auth' module can depend on 'user'
  user: [], // 'user' module has no module dependencies
  book: [], // 'book' module has no module dependencies
  tutorial: [], // 'tutorial' module has no module dependencies
  genre: ['book'], // 'genre' module can depend on 'book'
  review: ['book', 'user'], // 'review' module can depend on 'book' and 'user'
  dashboard: ['book', 'user', 'review'], // 'dashboard' module can depend on 'book', 'user', and 'review'
  shelf: ['book', 'review'], // 'shelf' module can depend on 'book' and 'review'
};

/**
 * Architecture Elements
 * -------------------------------------------------------------
 * Categorizes the project codebase into architectural layers:
 * 1. Feature Modules (e.g. src/modules/auth, src/modules/user)
 * 2. Shared Layer    (common utilities, middlewares, types, database connection)
 * 3. Config Layer    (environment variables & validation)
 */
const elements = [
  ...Object.keys(dependencyMap).map(name => ({
    type: name,
    pattern: `src/modules/${name}/**`,
  })),
  {
    type: 'shared',
    pattern: 'src/shared/**',
  },
  {
    type: 'config',
    pattern: 'src/config/**',
  },
  {
    type: 'scripts',
    pattern: 'src/scripts/**',
  },
];

/**
 * Architectural Policies (eslint-plugin-boundaries)
 * -------------------------------------------------------------
 * Controls import boundaries across modules and layers:
 * - Inter-module imports are restricted to public entry points (*.index.ts).
 * - Feature modules can consume shared utilities and configuration.
 * - Shared and Config layers cannot depend on feature modules (prevents upward leaks).
 * - Config layer is self-contained with zero dependencies on internal layers.
 * - Scripts layer can consume shared, config, and feature modules via public entry points (*.index.ts).
 * - Application layers (modules, shared, config) cannot import from scripts.
 */
const policies = [
  // 1. Inter-module communication: Only allowed via module entrypoints (*.index.ts)
  ...Object.entries(dependencyMap).flatMap(([from, deps]) =>
    deps.map(dep => ({
      from: { element: { type: from } },
      allow: {
        to: { element: { type: dep, fileInternalPath: '*.index.ts' } },
      },
    })),
  ),

  // 2. Feature modules are allowed to access shared utils and configuration
  {
    from: { element: { type: Object.keys(dependencyMap) } },
    allow: {
      to: { element: { type: ['shared', 'config'] } },
    },
  },

  // 3. Shared and Config layers must NOT depend on any feature modules
  {
    from: { element: { type: ['shared', 'config'] } },
    disallow: {
      to: { element: { type: Object.keys(dependencyMap) } },
    },
  },

  // 4. Shared layer is allowed to access configuration (e.g. token service using env)
  {
    from: { element: { type: 'shared' } },
    allow: {
      to: { element: { type: 'config' } },
    },
  },

  // 5. Scripts layer can access shared utils and configuration
  {
    from: { element: { type: 'scripts' } },
    allow: {
      to: { element: { type: ['shared', 'config'] } },
    },
  },

  // 6. Scripts layer can consume feature modules ONLY via public entry points (*.index.ts)
  {
    from: { element: { type: 'scripts' } },
    allow: {
      to: {
        element: {
          type: Object.keys(dependencyMap),
          fileInternalPath: '*.index.ts',
        },
      },
    },
  },

  // 7. Prevent application layers from importing from scripts
  {
    from: {
      element: {
        type: ['shared', 'config', ...Object.keys(dependencyMap)],
      },
    },
    disallow: {
      to: { element: { type: 'scripts' } },
    },
  },
];

export default defineConfig(
  // Base recommended configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ['src/**/*.ts'],
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      // TypeScript path alias resolution (@src/* mapped in tsconfig.json)
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
      'boundaries/elements': elements,
    },
    rules: {
      // Enforce architectural boundary constraints strictly
      'boundaries/dependencies': ['error', { default: 'disallow', policies }],

      // Detect and prevent circular dependencies across modules
      'import/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],

      // Unused variables rule configured to ignore Express parameters prefixed with '_' (e.g. _res, _next)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Global ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
