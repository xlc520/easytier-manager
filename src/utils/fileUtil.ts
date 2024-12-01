import { CONFIG_PATH, LOG_PATH, RESOURCE_PATH } from '@/constants/easytier'
import { invoke } from '@tauri-apps/api/core'
import {
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  appLogDir,
  configDir,
  dataDir,
  delimiter,
  dirname,
  extname,
  homeDir,
  join,
  resourceDir
} from '@tauri-apps/api/path'
import {
  BaseDirectory,
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  writeFile
} from '@tauri-apps/plugin-fs'

// 获取可执行文件路径
export const getExecutablePath = async () => {
  try {
    // 使用 Tauri 的 invoke API 调用 Rust 后端函数
    return await invoke('get_executable_path')
  } catch (error) {
    console.error('获取可执行文件路径时出错:', error)
  }
}
// 程序启动时，判断是否存在resource目录，不存在则创建
export const checkDir = async (dirPath: string = RESOURCE_PATH) => {
  try {
    try {
      const _e = await extname(dirPath)
      dirPath = await dirname(dirPath)
    } catch (_error) {
      /* empty */
    }
    const dirExists = await exists(dirPath, { baseDir: BaseDirectory.Resource })
    if (!dirExists) {
      await mkdir(dirPath, { baseDir: BaseDirectory.Resource, recursive: true })
    }
  } catch (error) {
    console.error('创建resource目录时出错:', error)
    throw error
  }
}

// 获取resource目录，如果resource目录不存在，则调用checkResourceDir创建，最终返回带'resource'后缀的目录
export const getResourceDir = async () => {
  await checkDir()
  return await join(await resourceDir(), RESOURCE_PATH)
}
// 获取resource下的logs目录
export const getLogsDir = async () => {
  const logsDir = await join(await resourceDir(), LOG_PATH)
  await checkDir(logsDir)
  return logsDir
}
// 获取 config目录， RESOURCE_PATH+CONFIG_PATH
// export const getConfigPath = async () => {
//   const configPath = await join(RESOURCE_PATH, CONFIG_PATH)
//   await checkDir(CONFIG_PATH)
//   return configPath
// }

/**
 * 写入内容到文件
 * 1.支持写入字符串或二进制数据 (Uint8Array)
 * 2.可以指定基础目录 (默认为 AppData)
 * 3.支持追加模式和创建新文件的选项
 * 4.包含完整的错误处理
 * @param filePath 文件路径
 * @param content 写入的内容
 * @param options 可选参数
 *
 * 使用示例:
 * ```
 *  await writeFileContent('config.json', '{"setting": "value"}');
 *   // 使用选项
 *   await writeFileContent('data.txt', 'content', {
 *     baseDir: BaseDirectory.AppConfig,
 *     append: true,
 *     createNew: false
 *   });
 *   // 写入二进制数据
 *   const binaryData = new Uint8Array([1, 2, 3]);
 *   await writeFileContent('data.bin', binaryData);
 * ```
 */
export async function writeFileContent(
  filePath: string,
  content: string | Uint8Array,
  options?: {
    baseDir?: BaseDirectory // 基础目录
    append?: boolean // 是否追加模式
    createNew?: boolean // 是否创建新文件
  }
): Promise<void> {
  try {
    const defaultOptions = {
      baseDir: BaseDirectory.Resource,
      append: false,
      createNew: false
    }
    const finalOptions = { ...defaultOptions, ...options }
    await checkDir(filePath)
    if (typeof content === 'string') {
      const encoder = new TextEncoder()
      content = encoder.encode(content)
    }

    await writeFile(filePath, content, finalOptions)
  } catch (error) {
    console.error('写入文件时出错:', error)
    throw error
  }
}

/**
 * 读取文件内容的通用方法
 * @param filePath 文件路径
 * @param options 可选参数
 * @returns Promise<string | Uint8Array> 返回文件内容，如果 asBinary 为 true 则返回 Uint8Array，否则返回字符串
 *
 * 使用示例:
 * ```typescript
 * // 读取文本文件
 * const textContent = await readFileContent('config.json');
 *
 * // 读取二进制文件
 * const binaryContent = await readFileContent('data.bin', { asBinary: true });
 *
 * // 从特定目录读取
 * const configContent = await readFileContent('settings.json', {
 *   baseDir: BaseDirectory.AppConfig
 * });
 * ```
 */
export async function readFileContent(
  filePath: string,
  options?: {
    baseDir?: BaseDirectory // 基础目录
    asBinary?: boolean // 是否以二进制方式读取
  }
): Promise<string | Uint8Array> {
  try {
    const { baseDir = BaseDirectory.Resource, asBinary = false } = options || {}
    await checkDir(filePath)
    if (asBinary) {
      const content = await readFile(filePath, { baseDir })
      return content
    } else {
      const content = await readTextFile(filePath, { baseDir })
      return content
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return ''
  }
}
// 列出目录下的所有文件
export const listFiles = async (targetDir: string = RESOURCE_PATH) => {
  try {
    await checkDir(targetDir)
    const entries = await readDir(targetDir, { baseDir: BaseDirectory.Resource })
    return entries.map((entry) => entry.name)
  } catch (error) {
    console.error('Error listing resource files:', error)
    return []
  }
}

// 列出 resource 目录下的所有 .toml 文件
export const listTomlFiles = async (targetDir: string = CONFIG_PATH) => {
  try {
    const _ = await checkDir(targetDir)

    const entries = await readDir(targetDir, { baseDir: BaseDirectory.Resource })
    return entries.filter((entry) => entry.name.endsWith('.toml')).map((entry) => entry.name)
  } catch (error) {
    console.error('Error listing resource files:', error)
    return []
  }
}

// 写入 resource 目录下的 config.json 文件
export const writeConfigJsonObj = async (obj: any) => {
  const configJsonPath = await join(RESOURCE_PATH, 'config.json')
  await checkDir(configJsonPath)
  await writeFileContent(configJsonPath, JSON.stringify(obj), {
    baseDir: BaseDirectory.Resource
  })
}

// 读取 resource 目录下的 config.json 文件，并返回 JSON 对象
export const getConfigJsonObj = async () => {
  try {
    const configJsonPath = await join(RESOURCE_PATH, 'config.json')
    await checkDir(configJsonPath)
    const configJson = await readFileContent(configJsonPath, {
      baseDir: BaseDirectory.Resource
    })
    return JSON.parse(configJson as string)
  } catch (error) {
    console.error('读取配置文件失败:', error)
    await writeConfigJsonObj({})
    return {}
  }
}

// 根据指定文件或目录，删除文件或目录
export const deleteFileOrDir = async (path: string) => {
  await remove(path, { baseDir: BaseDirectory.Resource })
}

// 获取路径值
export const getPathVal = async () => {
  // configDir C:\Users\Administrator\AppData\Roaming
  const configDirVal = await configDir()
  console.log('configDir', configDirVal)

  // dataDir C:\Users\Administrator\AppData\Roaming
  const dataDirVal = await dataDir()
  console.log('dataDir', dataDirVal)

  // resourceDir E:\source\rust\EasyTier\target\debug
  const resourceDirVal = await resourceDir()
  console.log('resourceDir', resourceDirVal)

  // E:\source\rust\EasyTier\target\debug\easytier-gui-pro.exe
  const executableDirVal = await getExecutablePath()
  console.log('executableDir', executableDirVal)

  // appConfigDir C:\Users\Administrator\AppData\Roaming\com.easytier-gui-pro
  const appConfigDirVal = await appConfigDir()
  console.log('appConfigDir', appConfigDirVal)

  // appDataDir C:\Users\Administrator\AppData\Roaming\com.easytier-gui-pro
  const appDataDirVal = await appDataDir()
  console.log('appDataDir', appDataDirVal)

  // appLocalDataDir C:\Users\Administrator\AppData\Local\com.easytier-gui-pro
  const appLocalDataDirVal = await appLocalDataDir()
  console.log('appLocalDataDir', appLocalDataDirVal)

  // appLogDir C:\Users\Administrator\AppData\Local\com.easytier-gui-pro\logs
  const appLogDirVal = await appLogDir()
  console.log('appLogDir', appLogDirVal)

  // homeDir C:\Users\Administrator
  const homeDirVal = await homeDir()
  console.log('homeDir', homeDirVal)

  // delimiter ;
  const delimiterVal = delimiter()
  console.log('delimiter', delimiterVal)
}

import { ElMessage } from 'element-plus'
import request from '@/axios'
import type { AxiosResponse, AxiosProgressEvent } from 'axios'

type ProgressCallback = (fileUrl: string, progress: number) => void

// 防抖函数
function debounce<ProgressCallback extends (...args: any) => any>(
  func: ProgressCallback,
  wait: number
): ProgressCallback {
  let startTime = Date.now()
  return function (this: any, ...args: Parameters<ProgressCallback>) {
    if (Date.now() - wait >= startTime) {
      func.apply(this, args)
      startTime = Date.now()
    }
  } as ProgressCallback
}

export async function downloadFile(
  fileUrl: string,
  updateProgressBar: ProgressCallback
): Promise<void> {
  try {
    const updateProgress = debounce(updateProgressBar, 500)
    const response: AxiosResponse | any = await request.request({
      url: fileUrl,
      method: 'get',
      responseType: 'blob',
      onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
        const total = progressEvent.total
        const current = progressEvent.loaded
        if (total) {
          const percentage = Math.floor((current / total) * 100)
          updateProgress(fileUrl, percentage)
        }
      }
    })

    if (response.headers['content-type'].startsWith('application/json')) {
      const resCode = response.data.code
      if (resCode !== 0) {
        ElMessage.warning(response.data.msg)
      }
      return
    }

    // 获取文件名
    let filename = ''
    const disposition = response.headers['content-disposition']
    if (disposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }
    console.log('filename', filename)
    // 如果没有获取到文件名，从 URL 中提取
    if (!filename) {
      filename = fileUrl.split('/').pop() || 'downloaded_file'
    }

    // 构建保存路径
    const savePath = await join(RESOURCE_PATH, filename)

    // 确保目录存在
    await checkDir(RESOURCE_PATH)

    // 将文件内容转换为 Uint8Array
    const arrayBuffer = await response.data.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // 写入文件
    await writeFileContent(savePath, uint8Array, {
      baseDir: BaseDirectory.Resource
    })

    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('下载文件时出错:', error)
    ElMessage.warning('下载文件失败，请稍后再试')
  }
}

/**
 * 更新页面中的进度条
 */
const updateProgressBar = (file: string, percentage: number) => {
  console.log(`Download progress: ${percentage}%`)
}
