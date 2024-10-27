import * as monaco from 'monaco-editor'
import { ref, nextTick, onBeforeUnmount, onMounted } from 'vue'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

export function useMonacoEditor(language: string = 'javascript') {
  // 编辑器示例
  let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null
  // 目标元素
  const monacoEditorRef = ref<HTMLElement>()

  // 创建实例
  function createEditor(editorOption: monaco.editor.IEditorOptions | any = {}) {
    if (!monacoEditorRef.value) return
    monacoEditor = monaco.editor.create(monacoEditorRef.value, {
      // 初始模型
      model: monaco.editor.createModel('', language),
      // 是否启用预览图
      minimap: { enabled: true },
      // 圆角
      roundedSelection: true,
      // 主题
      theme: 'vs-dark',
      // 主键
      multiCursorModifier: 'ctrlCmd',
      // 滚动条
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8
      },
      // 行号
      lineNumbers: 'on',
      // tab大小
      tabSize: 2,
      //字体大小
      fontSize: 14,
      // 控制编辑器在用户键入、粘贴、移动或缩进行时是否应自动调整缩进
      autoIndent: 'advanced',
      // 自动布局
      automaticLayout: true,
      ...editorOption
    })

    return monacoEditor
  }

  // 格式化
  async function formatDoc() {
    await monacoEditor?.getAction('editor.action.formatDocument')?.run()
  }

  // 数据更新
  function updateVal(val: string) {
    nextTick(() => {
      if (getOption(monaco.editor.EditorOption.readOnly)) {
        updateOptions({ readOnly: false })
      }
      // 如果发生卡死，使用toRaw
      monacoEditor?.setValue(val)
      setTimeout(async () => {
        await formatDoc()
      }, 10)
    })
  }

  // 配置更新
  function updateOptions(opt: monaco.editor.IStandaloneEditorConstructionOptions) {
    monacoEditor?.updateOptions(opt)
  }

  // 获取配置
  function getOption(name: monaco.editor.EditorOption) {
    return monacoEditor?.getOption(name)
  }

  // 获取实例
  function getEditor() {
    return monacoEditor
  }

  function changeLanguage(newLanguage: string) {
    const model = monacoEditor?.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage)
    }
  }

  function changeTheme(newTheme: string) {
    monaco.editor.setTheme(newTheme)
  }

  onMounted(() => {
    // 定义 TOML 文件的语言配置
    monaco.languages.register({ id: 'toml' })
    monaco.languages.setMonarchTokensProvider('toml', {
      tokenizer: {
        root: [
          [/#.*$/, 'comment'], // 注释
          [/\[.*?\]/, 'section'], // 节
          [/[a-zA-Z_][a-zA-Z0-9_]*/, 'key'], // 键
          [/\s*=\s*/, 'operator'], // 操作符
          [/"([^"\\]|\\.)*"/, 'string'], // 字符串
          [/'([^'\\]|\\.)*'/, 'string'], // 字符串
          [/\d+/, 'number'], // 数字
          [/\s+/, 'white'], // 空白
          [/./, 'text'] // 文本
        ]
      }
    })
    // 定义日志文件的语言配置
    monaco.languages.register({ id: 'log' })
    monaco.languages.setMonarchTokensProvider('log', {
      // 定义语言的语法规则
      tokenizer: {
        root: [
          // 匹配日期时间格式
          [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}\+\d{2}:\d{2}/, 'custom-date'],
          [/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/, 'custom-date'],
          [/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/, 'custom-date'],
          // 匹配日志级别（INFO, WARN, ERROR, DEBUG 等）
          [/INFO|info/, 'custom-info'],
          [/\[INFO\]|\[info\]/, 'custom-info'],
          [/ERROR|error/, 'custom-error'],
          [/\[ERROR\]|\[error\]/, 'custom-error'],
          [/WARN|warn/, 'custom-warning'],
          [/\[WARN\]|\[warn\]/, 'custom-warning'],
          [/DEBUG|debug/, 'custom-debug'],
          [/\[DEBUG\]|\[debug\]/, 'custom-debug'],
          // 其他文本
          [/./, 'custom-text']
        ]
      }
    })
    // 主题
    monaco.editor.defineTheme('log', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'custom-date', foreground: '#3d714a' }, // 绿色
        { token: 'custom-info', foreground: '#8bc8ad' }, // info 级别显示为蓝色
        { token: 'custom-error', foreground: '#ea5744' }, // error 级别显示为红色
        { token: 'custom-warning', foreground: '#d5d261' }, // warning 级别显示为橙色
        { token: 'custom-debug', foreground: '#808080' }, // debug 级别显示为灰色
        { token: 'custom-text', foreground: '#eeefe7' } // debug 级别显示为灰色
      ],
      colors: {}
    })
  })
  // 页面离开 销毁
  onBeforeUnmount(() => {
    if (monacoEditor) {
      monacoEditor.dispose()
    }
  })

  return {
    monacoEditorRef,
    createEditor,
    getEditor,
    updateVal,
    updateOptions,
    getOption,
    formatDoc,
    changeLanguage,
    changeTheme
  }
}
