<!-- https://blog.csdn.net/qq_29184685/article/details/129087445
  https://aydk.site/example/install.html#vue3-vite -->
<template>
  <div>
    <div ref="editorContainer" class="monaco-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw, watchEffect } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: '100vh'
  },
  height: {
    // 编辑器height
    type: [String, Number],
    default: '100%'
  },
  readonly: {
    // 是否只读
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'toml'
  },
  theme: {
    type: String,
    default: 'vs-dark'
  },
  options: {
    type: Object,
    default: () => ({})
  },
  onContentChange: {
    type: Function,
    required: false
  }
})
const editorContainer = ref<any>(null)
const editor = ref<any>(null)
const data = ref(props.value)
// const editor_height = ref(`${props.height}px`)
// const emit = defineEmits(['contentChange'])
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
onMounted(() => {
  // Register a new language
  monaco.languages.register({ id: 'toml' })
  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider('toml', {
    // 定义 TOML 语法规则
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*/, 'identifier'],
        [/"(?:[^"\\]|\\.)*"/, 'string'],
        [/\[.*?\]/, 'bracket'],
        [/\s*=\s*/, 'operator'],
        [/#.*$/, 'comment'],
        [/\d+/, 'number']
      ]
    }
  })

  // 初始化编辑器，确保dom已经渲染
  editor.value = monaco.editor.create(editorContainer.value, {
    value: data.value,
    theme: props.theme, // 主题 "vs" | "vs-dark" | "hc-black" | "hc-light" ，自定义：myCoolTheme
    language: props.language, // 编辑器类型支持
    minimap: { enabled: false }, // 小地图 是否启用预览图
    folding: true, // 是否折叠
    foldingHighlight: true, // 折叠等高线
    foldingStrategy: 'indentation', // 折叠方式  auto | indentation
    showFoldingControls: 'always', // 是否一直显示折叠 always | mouseover
    disableLayerHinting: true, // 等宽优化
    emptySelectionClipboard: false, // 空选择剪切板
    selectionClipboard: false, // 选择剪切板
    automaticLayout: true, // 自动布局
    scrollBeyondLastLine: false, // 滚动完最后一行后再滚动一屏幕
    colorDecorators: true, // 呈现内联色彩装饰器和颜色选择器
    lineNumbers: 'on', // 行号 取值： "on" | "off" | "relative" | "interval" | function
    lineNumbersMinChars: 5, // 行号最小字符   number
    readOnly: props.readonly, //是否只读  取值 true | false
    formatOnPaste: true,
    overviewRulerBorder: true, // 滚动条的边框 是否应围绕概览标尺绘制边框
    acceptSuggestionOnCommitCharacter: true, // 接受关于提交字符的建议
    acceptSuggestionOnEnter: 'on', // 接受输入建议 "on" | "off" | "smart"
    autoClosingBrackets: 'languageDefined', // 是否自动添加结束括号(包括中括号) "always" | "languageDefined" | "beforeWhitespace" | "never"
    autoClosingDelete: 'auto', // 是否自动删除结束括号(包括中括号) "always" | "never" | "auto"
    autoClosingOvertype: 'always', // 是否关闭改写 即使用insert模式时是覆盖后面的文字还是不覆盖后面的文字 "always" | "never" | "auto"
    autoClosingQuotes: 'languageDefined', // 是否自动添加结束的单引号 双引号 "always" | "languageDefined" | "beforeWhitespace" | "never"
    autoIndent: 'none', // 控制编辑器在用户键入、粘贴、移动或缩进行时是否应自动调整缩进 "none" | "keep" | "brackets" | "advanced" | "full"
    contextmenu: true, // 启用上下文菜单
    columnSelection: false, // 启用会导致无法正常选择，启用列编辑 按下shift键位然后按↑↓键位可以实现列选择 然后实现列编辑
    autoSurround: 'languageDefined', // 是否应自动环绕选择 'languageDefined' | 'quotes' | 'brackets' | 'never'
    copyWithSyntaxHighlighting: false, // 是否应将语法突出显示复制到剪贴板中 即 当你复制到word中是否保持文字高亮颜色
    cursorBlinking: 'smooth', // 光标动画样式 "blink" | "smooth" | "phase" | "expand" | "solid"
    cursorSmoothCaretAnimation: 'on', // 是否启用光标平滑插入动画  当你在快速输入文字的时候 光标是直接平滑的移动还是直接"闪现"到当前文字所处位置 "on" | "off" | "explicit" | undefined
    cursorStyle: 'line', //  光标样式 "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin"
    cursorSurroundingLines: 0, // 光标环绕行数 当文字输入超过屏幕时 可以看见右侧滚动条中光标所处位置是在滚动条中间还是顶部还是底部 即光标环绕行数 环绕行数越大 光标在滚动条中位置越居中
    cursorSurroundingLinesStyle: 'all', // "default" | "all" 光标环绕样式
    cursorWidth: 2, // <=25 光标宽度
    links: true, // 是否点击链接
    renderLineHighlight: 'all', // 当前行突出显示方式 'none' | 'gutter' | 'line' | 'all'
    roundedSelection: false, // 选区是否有圆角
    scrollbar: {
      horizontal: 'visible',
      horizontalHasArrows: true,
      vertical: 'auto',
      verticalHasArrows: true
    }
  })
  // 监听值的变化
  editor.value.onDidChangeModelContent(() => {
    // 给父组件实时返回最新文本
    // emit('update:modelValue', toRaw(editor.value).getValue())
    // 将内容传递给父组件
    const currentValue = toRaw(editor.value).getValue()
    // @ts-nocheck
    // @ts-ignore
    props.onContentChange(currentValue)
  })
  // editor.value.onDidChangeModelContent((val: any) => {
  //   //内容改变时给父组件实时返回值
  //   emit('editorChange', toRaw(editor.value).getValue())
  // })
})
// 编辑器避免重复赋值
watchEffect(() => {
  if (editor.value && toRaw(editor.value).getValue() !== props.value)
    toRaw(editor.value).setValue(props.value)
})
// onBeforeUnmount(() => {
//   // 清理
//   if (editor.value) {
//     editor.value.dispose()
//   }
// })
// watchEffect(() => { // 监听父组件值的变化，重新赋值给编辑器
//   if (editor.value)
//     toRaw(editor.value).setValue(props.value)
// })
</script>

<style scoped>
.monaco-editor {
  width: 100%;
  height: 400px;
}
</style>
