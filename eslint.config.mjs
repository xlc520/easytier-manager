// https://juejin.cn/post/7402922513888460852
// https://ksh7.com/posts/eslint-update-9/index.html
// 导入了 `globals`全局变量的库模块，该模块提供了一组预定义的全局变量（如 window、document 等），这些变量通常在不同的环境（如浏览器、Node.js）中可用。在 ESLint 配置中，你可以使用这个模块来指定代码所运行的环境，从而定义全局变量。
import globals from 'globals';
//针对 JavaScript 的 ESLint 配置和规则。保持 JavaScript 代码的一致性和质量
import pluginJs from '@eslint/js';
// 导入 `typescript-eslint` 插件（ `typescript-eslint/parser` 和 `typescript-eslint/eslint-plugin`）。提供了对 TypeScript 的支持，包括 TS 的解析器和推荐的规则集，用于在 TypeScript 文件中进行 lint 检查。
import tsEslint from 'typescript-eslint';
// 导入 `eslint-plugin-vue` 插件，提供了 Vue.js 特有 ESLint 规则。确保 Vue 文件（`.vue` 文件）中的代码符合 Vue.js 的最佳实践和代码风格指南
import pluginVue from 'eslint-plugin-vue';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const customConfig = [
  // 指定文件匹配模式 和语言选项
  {files: ['**/*.{js,mjs,cjs,ts,vue}']}, //["**/*.vue"]
  // 指定全局变量和环境
  {
    languageOptions: {
      globals: {
        ...globals.es2022,
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 12, // 使用最新的 ECMAScript 语法
      sourceType: 'module', // 代码是 ECMAScript 模块
      parser: tsEslintParser,
      parserOptions: {parser: tsEslint.parser}, // 使用 TypeScript 解析器
    },
    rules: {
      'no-dupe-class-members': 0,
      'no-redeclare': 0,
      'no-undef': 0,
      'no-unused-vars': 0,
      ...tsEslintPlugin.configs.recommended.rules,
      '@typescript-eslint/ban-types': 2,
      '@typescript-eslint/no-confusing-non-null-assertion': 2,
    },
    files: ['**/*.{ts,tsx}'],
    plugins: {
      // ts 语法特有的规则，例如泛型
      '@typescript-eslint': tsEslintPlugin,
    },
  },
  // 自定义规则
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 生产环境中警告 console 使用，开发环境中关闭规则
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off', // 生产环境中警告 debugger 使用，开发环境中关闭规则
      indent: ['warn', 2], // 缩进使用 2 个空格 而不是 4 个  error
      'linebreak-style': ['warn', 'windows'], // 使用 Unix 风格的换行符
      quotes: ['warn', 'single'], // 使用单引号
      semi: ['warn', 'never'], // 语句末尾不加分号
      'no-unused-vars': 'off', // 关闭未使用变量警告
      '@typescript-eslint/no-unused-vars': 'off', // 关闭未使用变量警告
      //关闭操作符换行规则的检查。默认ESLint会要求你在操作符前后换行，配置项可关闭这种检查。
      'vue/operator-linebreak': 'off',
      //关闭单行 HTML 元素内容新行的规则。默认情况下，ESLint 可能会要求在单行 HTML 元素的内容后面有新行，这个配置项可以关闭这种要求。
      'vue/singleline-html-element-content-newline': 'off',
      //关闭组件名称必须是多单词的规则。默认情况下，ESLint 可能会要求组件名称由多个单词组成，这个配置项允许单词少于两个的组件名称。
      'vue/multi-word-component-names': 'off',
      //关闭对 `v-model` 参数使用的规则。默认情况下，ESLint 可能会对 `v-model` 的参数使用进行检查，这个配置项可以关闭这种检查。
      'vue/no-v-model-argument': 'off',
      //关闭要求组件 `prop` 必须有默认值的规则。默认情况下，ESLint 可能会要求每个 `prop` 都有一个默认值，这个配置项允许没有默认值的 `prop`。
      'vue/require-default-prop': 'off',
      //关闭要求组件 `prop` 必须有类型定义的规则。默认情况下，ESLint 可能会要求每个 `prop` 都有一个类型定义，这个配置项允许没有类型定义的 `prop`。
      'vue/require-prop-types': 'off',
      //关闭 HTML 自闭合标签规则的检查。默认情况下，ESLint 可能会要求 HTML 标签自闭合的风格。
      // 'vue/html-self-closing': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'never',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ],
      //关闭属性名引号使用规则的检查。默认情况下，ESLint 可能会要求在对象属性名周围使用引号，这个配置项可以关闭这种检查。
      'vue/quote-props': 'off',
      //关闭检查不规则空白字符的规则。默认情况下，ESLint 可能会检查代码中是否有不规则的空白字符，这个配置项可以关闭这种检查。
      'vue/no-irregular-whitespace': 'off',
      //关闭 `prop` 名称大小写规则的检查。默认情况下，ESLint 可能会要求 `prop` 名称遵循特定的大小写规则，这个配置项可以关闭这种要求。
      'vue/prop-name-casing': 'off',
      //关闭 HTML 缩进规则的检查。默认情况下，ESLint 可能会要求 HTML 标签按照特定的缩进方式对齐，这个配置项可以关闭这种检查。
      'vue/html-indent': 'off',
      //关闭对保留组件名称的检查。默认情况下，ESLint 可能会禁止使用某些保留的组件名称，这个配置项允许使用这些名称。
      'vue/no-reserved-component-names': 'off',
      'vue/no-setup-props-destructure': 'off',
      'vue/script-setup-uses-vars': 'error',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'vue/custom-event-name-casing': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'space-before-function-paren': 'off',
      'vue/attributes-order': 'off',
      'vue/one-component-per-file': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/require-explicit-emits': 'off',
      'vue/no-v-html': 'off',
      'vue/require-toggle-inside-transition': 'off'
    },
  },
  // 忽略文件
  {
    ignores: [
      '**/dist',
      './src/main.ts',
      '.vscode',
      '.idea',
      '*.sh',
      '**/node_modules',
      '*.md',
      '*.woff',
      '*.woff',
      '*.ttf',
      'yarn.lock',
      'package-lock.json',
      '/public',
      '/docs',
      '**/output',
      '.husky',
      '.local',
      '/bin',
      'Dockerfile',
      '/build/',
      '/test/unit/coverage/',
      '.idea',
      '.git',
      'release',
      '.npmrc'
    ],
  },
]

export default [
  // 使用的扩展配置 解析器选项
  pluginJs.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tsEslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...customConfig
];
