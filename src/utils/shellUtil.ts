import { CONFIG_PATH } from '@/constants/easytier'
import { join, resourceDir } from '@tauri-apps/api/path'
import { attachConsole, error, info } from '@tauri-apps/plugin-log'
import { Command, type SpawnOptions } from '@tauri-apps/plugin-shell'
import { getResourceDir } from './fileUtil'
import { getPlatform } from './sysUtil'
// 启用 TargetKind::Webview 后，这个函数将把日志打印到浏览器控制台
attachConsole()
/**
 * 执行外部程序并等待其完成
 * @param program 程序路径
 * @param args 程序参数数组
 * @param options 执行选项（可选）
 * @returns Promise<string> 程序输出
 *
 * 使用示例:
 * ```
 * // 示例：执行命令并等待结果
 * const output = await executeAndWait('git', ['status'])
 * info('命令输出:', output)
 * ```
 */
export async function executeCmd(
  program: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<string> {
  try {
    // 创建命令实例
    const command = Command.create(program, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: options.encoding
    })
    // 执行并等待完成
    const output = await command.execute()
    if (output.stderr) {
      throw output.stderr
    }
    return output.stdout
  } catch (e: any) {
    error('执行程序失败:' + e.message)
    throw error
  }
}

/**
 * 在后台持续运行外部程序
 * @param program 程序路径
 * @param args 程序参数数组
 * @param options 执行选项（可选）
 * @returns Promise<number> 返回进程 PID
 *
 * 使用示例:
 * ```
 * // 示例1: 启动 Node.js 服务
 * const pid = await executeBack('node', ['server.js'])
 *
 * // 示例2: 启动 Python 脚本
 * const pid = await executeBack('python', ['script.py'], {
 *   cwd: '/path/to/project'
 * })
 *
 * // 示例3: 启动带环境变量的程序
 * const pid = await executeBack('myapp', [], {
 *   env: {
 *     'NODE_ENV': 'production'
 *   }
 * })
 * ```
 */
export async function executeBack(
  program: string,
  args: string[] = [],
  options: SpawnOptions = {}
): Promise<number> {
  try {
    // 根据操作系统选择不同的命令
    const platform = await getPlatform()
    // const command = isWindows
    //   ? Command.create('cmd', ['/c', 'start', program, ...args], options)
    //   : Command.create('nohup', [program, ...args], options);
    const binPath = await join(await getResourceDir(), program)
    if (platform === 'windows') {
      args = ['/c', 'start', '/b', binPath, ...args]
      program = 'cmd'
    }
    if (platform === 'linux' || platform === 'macos') {
      args = [binPath, ...args]
      program = 'nohup'
    }
    // 创建命令对象
    const command = Command.create(program, args, options)

    // // 监听输出(可选)
    // command.stdout.on('data', (line) => {
    //   info(`[${program}] stdout:`, line)
    // })
    // command.stderr.on('data', (line) => {
    //   error(`[${program}] stderr:`, line)
    // })

    // // 监听关闭事件
    // command.on('close', (data) => {
    //   info(`[${program}] 进程退出, code: ${data.code}, signal: ${data.signal}`)
    // })

    // // 监听错误
    // command.on('error', (error) => {
    //   error(`[${program}] 错误:`, error)
    // })

    // 启动进程
    const child = await command.spawn()

    info(`[${program}] 后台进程已启动, PID: ${child.pid}`)
    return child.pid
  } catch (e: any) {
    error('启动后台程序失败:' + e.message)
    throw error
  }
}

// 运行 easytier-core 配置
export async function runEasyTierCore(configFileName: string) {
  const corePath = await join(await resourceDir(), CONFIG_PATH)
  const corePathFileName = corePath + '/' + configFileName
  return await executeBack('easytier-core', ['-c', corePathFileName])
}

// 运行 easytier-cli 配置
export async function runEasyTierCli(args: string[]) {
  try {
    return await executeCmd('easytier-cli', args)
  } catch (error) {
    return 403
  }
}

/**
 * 根据PID终止进程
 * @param pid 进程ID
 * @param force 是否强制终止 (默认false)
 * @returns Promise<boolean> 是否成功终止
 *
 * 使用示例:
 * ```
 * // 正常终止进程
 * await killProcess(1234)
 *
 * // 强制终止进程
 * await killProcess(1234, true)
 * ```
 */
export async function killProcess(pid: number, force: boolean = true): Promise<boolean> {
  try {
    const platform = await getPlatform()
    // Windows 使用 taskkill 命令
    if (platform === 'windows') {
      const args = force ? ['/F', '/PID', pid.toString()] : ['/PID', pid.toString()]
      const _result = await executeCmd('taskkill', args, { encoding: 'gbk' })
    }
    // Unix-like 系统使用 kill 命令
    else {
      const signal = force ? '-9' : '-15' // SIGKILL vs SIGTERM
      const _result = await executeCmd('kill', [signal, pid.toString()])
    }
    info(`进程 ${pid} 已${force ? '强制' : ''}终止`)
    return true
  } catch (e: any) {
    error(`终止进程 ${pid} 失败:` + e.message)
    return false
  }
}

// Linux/macOS 下使用 sudo 的示例
export async function killProcessWithSudo(pid: number, force: boolean = false): Promise<boolean> {
  try {
    const signal = force ? '-9' : '-15'
    await executeCmd('sudo', ['kill', signal, pid.toString()])
    return true
  } catch (e: any) {
    error(`使用 sudo 终止进程 ${pid} 失败:` + e.message)
    return false
  }
}

// Windows 结束所有 easytier-core 进程
export async function killAllEasyTierCoreProcessWin() {
  return await executeCmd('taskkill', ['/IM', 'easytier-core.exe', '/F'])
}

// Linux/macOS 结束所有 easytier-core 进程
export async function killAllEasyTierCoreProcessUnix() {
  return await executeCmd('killall', ['easytier-core'])
}

/**
 * 获取正在运行的程序信息
 * @param {string} [programName] - 可选的程序名，用于模糊查询
 * @returns {Promise<Array>} - 返回一个包含程序信息的数组对象
 */
export const getRunningProcesses = async (
  programName: string = 'easytier'
): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    let args: string[] = []
    let program = ''
    let encoding = 'utf-8'
    const processInfo: any[] = []
    const platform = getPlatform()
    if (platform === 'windows') {
      // Windows 使用 WMIC 命令
      // wmic process where "name like '%easytier%'" get Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize /format:csv
      // wmic process where "name like '%easytier-core%'" get Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize /format:csv
      program = 'wmic'
      encoding = 'gbk'
      args = [
        'process',
        'where',
        `name like '%easytier%'`,
        'get',
        'Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize',
        '/format:csv'
      ]
    } else if (platform === 'macos' || platform === 'linux') {
      // macOS 和 Linux 使用 ps 命令
      program = 'ps'
      args = ['-eo', 'comm,args,pid,rss', '|', 'grep', 'easytier']
    } else {
      reject(new Error('Unsupported OS'))
      return
    }
    executeCmd(program, args, { encoding })
      .then((result) => {
        if (platform === 'windows') {
          // 解析 Windows 的 CSV 输出
          const lines = result.trim().split('\n').slice(1) // 去掉第一行标题
          lines.forEach((line) => {
            const [_node, caption, commandline, executablePath, pid, workingSetSize] =
              line.split(',')
            if (commandline.includes(programName)) {
              const process = {
                name: caption,
                commandLine: commandline,
                path: executablePath,
                pid: parseInt(pid),
                memory: parseInt(workingSetSize),
                fileName: programName
              }
              processInfo.push(process)
            }
          })
        } else if (platform === 'macos' || platform === 'linux') {
          // 解析 macOS 和 Linux 的 ps 输出
          const lines = result.trim().split('\n').slice(1) // 去掉第一行标题
          lines.forEach((line) => {
            const [comm, args, pid, rss] = line.trim().split(/\s+/)
            if (args.includes(programName)) {
              const process = {
                name: comm,
                commandLine: args,
                path: args, // ps 命令不直接提供可执行文件路径
                pid: parseInt(pid),
                memory: parseInt(rss) * 1024, // rss 单位是 KB
                fileName: programName
              }
              processInfo.push(process)
            }
          })
        }
        resolve(processInfo)
      })
      .catch((error) => {
        reject(error)
      })
  })
}
