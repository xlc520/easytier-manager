import { ipcRenderer } from 'electron'
// error, warn, info, verbose, debug, silly
const log = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'info', await handleMsg(...msg))
}
const info = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'info', await handleMsg(...msg))
}
const warn = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'warn', await handleMsg(...msg))
}
const error = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'error', await handleMsg(...msg))
}
const verbose = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'verbose', await handleMsg(...msg))
}
const debug = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'debug', await handleMsg(...msg))
}
const silly = async (...msg: any) => {
  // 渲染进程调用
  await ipcRenderer.invoke('logger', 'silly', await handleMsg(...msg))
}
const handleMsg = async (...args: any[]) => {
  // 将所有参数格式化为字符串
  const formattedArgs = args.map((arg) => {
    if (arg instanceof Error) {
      return arg.message
    }
    // 判断 arg 的类型，如果是对象则转换为 JSON 字符串
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg)
      } catch (e) {
        return '[Circular Object]'
      }
    }
    return String(arg)
  })
  // 拼接所有参数
  return formattedArgs.join(' ')
}
export default {
  log,
  info,
  warn,
  error,
  verbose,
  debug,
  silly
}
