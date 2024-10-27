// logger.ts
// 引入模块
import log, { LevelOption } from 'electron-log'
import path from 'path'
import { app } from 'electron'
//设置log
// 日志文件等级，默认值：false
log.transports.file.level = 'info'
// 日志控制台等级，默认值：false
log.transports.console.level = 'debug'
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
// 日志大小，默认：1048576（10M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 10485760

const date = new Date()
const dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
// 文件位置及命名方式
// 默认位置为：C:\Users\[user]\AppData\Roaming\[appname]\electron_log\
// 文件名为：年-月-日.log
// 自定义文件保存位置为安装目录下 \log\年-月-日.log
const fileName = 'easytier-manager-' + dateStr + '.log'
// 日志文件名，默认：main.log
log.transports.file.fileName = fileName
const logDirPath = path.join(app.getPath('userData'), 'logs')
log.transports.file.resolvePathFn = (variables, message) => {
  return path.join(logDirPath, variables.fileName)
}

// log.transports.file.resolvePathFn = (vars, message) => {
//   if (!exist) {
//     fs.mkdir(logDirPath, function (e) {
//       if (!e) {
//         return path.join(logDirPath, fileName)
//       } else {
//         log.error('创建文件夹失败' + logDirPath + ',e:' + e)
//         return
//       }
//     })
//   } else {
//     return path.join(logDirPath, fileName)
//   }
// }

// 覆盖consloe.log
// 有时electron-log替代consloe.log是很有用的，如下：
// console.log = log.log;
// 如果你想覆盖其他方法，像error，warn可以这样写：
Object.assign(console, log.functions)

// 动态更改日志级别
const setLogLevel = (level: LevelOption) => {
  log.transports.file.level = level
  log.info('设置日志级别', level)
}
const getLogLevel = () => {
  const level = log.transports.file.level
  return level.valueOf()
}

// 有六个日志级别error, warn, info, verbose, debug, silly。默认是silly
export default {
  info(param: any) {
    log.info(param)
  },
  warn(param: any) {
    log.warn(param)
  },
  error(param: any) {
    log.error(param)
  },
  debug(param: any) {
    log.debug(param)
  },
  verbose(param: any) {
    log.verbose(param)
  },
  silly(param: any) {
    log.silly(param)
  },
  setLogLevel,
  getLogLevel
}
