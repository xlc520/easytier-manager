import * as monaco from 'monaco-editor'
import { ref, nextTick, onBeforeUnmount } from 'vue'
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
  function createEditor(editorOption: monaco.editor.IStandaloneEditorConstructionOptions = {}) {
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
    // 定义 TOML 文件的语法高亮
    // monaco.editor.defineTheme('tomlTheme', {
    //   base: 'vs',
    //   inherit: true,
    //   rules: [
    //     { token: 'comment', foreground: '008000' }, // 注释为绿色
    //     { token: 'section', foreground: '800080', fontStyle: 'bold' }, // 节为紫色
    //     { token: 'key', foreground: 'ffffff' }, // 键为白色
    //     { token: 'operator', foreground: '000000' }, // 操作符为黑色
    //     { token: 'string', foreground: 'ffa500' }, // 字符串为橙色
    //     { token: 'number', foreground: 'ffa500' }, // 数字为橙色
    //     { token: 'white', foreground: 'ffffff' }, // 空白为白色
    //     { token: 'text', foreground: '000000' } // 文本为黑色
    //   ],
    //   colors: {
    //     'editor.foreground': '#000000',
    //     'editor.background': '#f0f0f0'
    //   }
    // })

    // 定义日志文件的语言配置
    monaco.languages.register({ id: 'log' })
    monaco.languages.setMonarchTokensProvider('log', {
      tokenizer: {
        root: [
          [/\[ERROR\]/, 'error'],
          [/\[WARNING\]/, 'warning'],
          [/\[INFO\]/, 'info'],
          [/\[DEBUG\]/, 'debug'],
          [/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, 'timestamp'],
          [/[a-zA-Z0-9._-]+/, 'identifier'],
          [/\s+/, 'white'],
          [/./, 'text']
        ]
      }
    })
    // monaco.languages.setMonarchTokensProvider('log', {
    //   tokenizer: {
    //     root: [
    //       [/$$ERROR$$.*/, 'error'],
    //       [/$$WARN$$.*/, 'warning'],
    //       [/$$INFO$$.*/, 'info'],
    //       [/$$DEBUG$$.*/, 'debug'],
    //       [/\d{4}-\d{2}-\d{2}/, 'date'],
    //       [/\d{2}:\d{2}:\d{2}/, 'time'],
    //       [/".*?"/, 'string'],
    //       [/\{.*?\}/, 'object'],
    //       [/$$.*?$$/, 'array']
    //     ]
    //   }
    // })
    // 定义日志文件的语法高亮
    // monaco.editor.defineTheme('logTheme', {
    //   base: 'vs',
    //   inherit: true,
    //   rules: [
    //     { token: 'error', foreground: 'ff0000', fontStyle: 'bold' },
    //     { token: 'warning', foreground: 'ffa500', fontStyle: 'bold' },
    //     { token: 'info', foreground: '0000ff', fontStyle: 'bold' },
    //     { token: 'debug', foreground: '008000', fontStyle: 'bold' },
    //     { token: 'timestamp', foreground: '808080' },
    //     { token: 'identifier', foreground: '000000' },
    //     { token: 'white', foreground: 'ffffff' },
    //     { token: 'text', foreground: '000000' }
    //   ],
    //   colors: {
    //     'editor.foreground': '#000000',
    //     'editor.background': '#f0f0f0'
    //   }
    // })
    // monaco.editor.defineTheme('logTheme', {
    //   base: 'vs',
    //   inherit: true,
    //   rules: [
    //     { token: 'error', foreground: 'ff0000', fontStyle: 'bold' },
    //     { token: 'warning', foreground: 'FFA500' },
    //     { token: 'info', foreground: '0000FF' },
    //     { token: 'debug', foreground: '008000' },
    //     { token: 'date', foreground: '008080' },
    //     { token: 'time', foreground: '008080' },
    //     { token: 'string', foreground: 'A31515' },
    //     { token: 'object', foreground: '000080' },
    //     { token: 'array', foreground: '800080' }
    //   ]
    // })

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
