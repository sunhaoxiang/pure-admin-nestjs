import antfu from '@antfu/eslint-config'
import perfectionist from 'eslint-plugin-perfectionist'

export default antfu(
  {
    typescript: true,
    stylistic: true,
  },
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本
    },
    rules: {
      'ts/consistent-type-imports': 'off', // 关闭类型导入一致性检查
      'no-console': 'off', // 允许使用 console
      'no-unused-vars': 'off', // 关闭未使用变量检查
      '@typescript-eslint/no-unused-vars': 'off', // 关闭 TS 未使用变量检查
      'ts/no-use-before-define': 'off', // 允许在定义前使用变量
      'ts/strict-boolean-expressions': 'off', // 关闭布尔表达式严格检查
      'ts/no-unsafe-member-access': 'off', // 允许不安全的成员访问
      'ts/no-unsafe-call': 'off', // 允许不安全的函数调用
      'ts/no-unsafe-assignment': 'off', // 允许不安全的赋值
      'ts/no-unsafe-return': 'off', // 允许不安全的返回值
      'ts/no-unsafe-argument': 'off', // 允许不安全的参数传递
      'ts/no-misused-promises': 'off', // 允许 Promise 的非标准使用
      'ts/no-floating-promises': 'off', // 允许未处理的 Promise
      'node/prefer-global/process': 'off', // 允许直接使用 process
      'node/prefer-global/buffer': 'off', // 允许直接使用 buffer
      'import/no-named-default': 'off', // 允许导入命名的默认导出
      'jsdoc/check-param-names': 'off', // 关闭 JSDoc 参数名检查
    },
  },
  {
    name: 'perfectionist',
    rules: {
      'import/order': 'off', // 关闭默认的导入排序规则
      'sort-imports': 'off', // 关闭默认的导入排序
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural', // 使用自然排序
          order: 'asc', // 升序排序
          ignoreCase: true, // 忽略大小写
          specialCharacters: 'keep', // 保留特殊字符的原始位置
          internalPattern: ['^@/.+'], // 将 @/ 开头的导入视为内部导入
          partitionByComment: false, // 不使用注释分隔导入组
          partitionByNewLine: false, // 不使用空行分隔导入组
          newlinesBetween: 'always', // 导入组之间始终添加空行
          maxLineLength: undefined, // 不限制导入语句长度
          groups: [
            'type', // 类型导入
            ['builtin', 'external'], // 内置模块和外部模块
            'internal-type', // 内部类型导入
            'internal', // 内部模块导入
            ['parent-type', 'sibling-type', 'index-type'], // 父级、同级和索引类型导入
            ['parent', 'sibling', 'index'], // 父级、同级和索引模块导入
            'object', // 对象导入
            'unknown', // 未知类型导入
          ],
        },
      ],
      'perfectionist/sort-exports':
        perfectionist.configs['recommended-natural'].rules['perfectionist/sort-exports'], // 使用推荐的自然排序规则排序导出
      'perfectionist/sort-named-imports':
        perfectionist.configs['recommended-natural'].rules['perfectionist/sort-named-imports'], // 使用推荐的自然排序规则排序命名导入
      'perfectionist/sort-named-exports':
        perfectionist.configs['recommended-natural'].rules['perfectionist/sort-named-exports'], // 使用推荐的自然排序规则排序命名导出
    },
  },
)
