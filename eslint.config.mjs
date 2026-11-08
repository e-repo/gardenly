import eslintConfigPrettier from 'eslint-config-prettier';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';
import withNuxt from './.nuxt/eslint.config.mjs';

const strictTypeCheckedRules = Object.assign(
  {},
  ...tseslint.configs.strictTypeChecked.map((config) => config.rules ?? {}),
);

export default withNuxt(
  {
    files: ['**/*.ts', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: strictTypeCheckedRules,
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  eslintConfigPrettier,
);
