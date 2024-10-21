import os from 'os'
import path from 'path'
import { exec, spawn } from 'child_process'
import { app } from 'electron'
import axios from 'axios'
import fs from 'fs'

const AdmZip = require('adm-zip')

// const fs = require('fs').promises

const osPlatform = os.platform()

// 获取应用的用户数据目录
const userDataPath = app.getPath('userData')

/**
 * 从文件读取数据
 * @param filePath 需要读取的路径
 * 例如：filePath: myconfig/data.json，则最终读取的是 %APPDATA%/应用的名称/myconfig/data.json
 */
export const readFile = async (filePath: string) => {
  try {
    const dataPath2 = path.join(userDataPath, filePath)
    fs.accessSync(dataPath2)
    const data = fs.readFileSync(dataPath2)
    return new TextDecoder('utf-8').decode(data)
  } catch (error) {
    console.error('Error reading file:', error)
  }
}
/**
 * 写入数据到文件
 * @param filePath 需要写入的路径
 * @param content 数据
 * 例如：filePath: myconfig/data.json，则最终写入的是 %APPDATA%/应用的名称/myconfig/data.json
 */
export const writeFile = async (filePath: string, content: any) => {
  try {
    const dataPath = path.join(userDataPath, filePath)
    await ensureDirectoryExists(dataPath) // 创建路径
    console.log('配置写入路径:', dataPath)
    fs.writeFileSync(dataPath, content)
  } catch (error) {
    console.error('Error writing file:', error)
  }
}
const ensureDirectoryExists = async (filePath: string) => {
  // 获取文件路径中的目录部分
  const dirPath = path.dirname(filePath)
  try {
    // 检查目录是否存在
    fs.accessSync(dirPath)
    return true
  } catch (error) {
    // 目录不存在，尝试创建目录
    try {
      fs.mkdirSync(dirPath, { recursive: true })
      return true
    } catch (mkdirError) {
      console.error(`目录 ${dirPath} 创建失败:`, mkdirError)
      return false
    }
  }
}

// 删除本地文件
export const deleteFile = async (filePath: string) => {
  const dataPath = path.join(userDataPath, filePath)
  try {
    // 检查文件是否存在
    // fs.accessSync(dataPath)
    fs.access(dataPath, (err) => {
      if (!err) {
        // 如果文件存在，删除它
        fs.unlinkSync(dataPath)
        console.debug(`文件 ${dataPath} 已成功删除`)
      }
    })
  } catch (error) {
    console.error(`删除文件 ${dataPath} 时出错:`, error)
  }
}
/**
 * 获取指定目录下指定后缀名称的文件列表
 * @param {string} dirPath - 目录路径
 * @param {string} extension - 文件后缀名（例如：'.txt'）
 * @returns {Promise<Array>} - 文件列表的 Promise
 * 例如：filePath: config，则最终读取的是 %APPDATA%/应用的名称/config
 */
export const getFilesByExtension = async (dirPath: string, extension: string = '.toml') => {
  try {
    const dataPath = path.join(userDataPath, dirPath)
    // 检查目录路径是否存在
    fs.accessSync(dataPath)

    // 读取目录下的所有文件和文件夹
    const files = await fs.readdirSync(dataPath)
    const filteredFiles: any[] = []

    for (const file of files) {
      const filePath = path.join(dataPath, file)
      const fileStat = fs.statSync(filePath)
      // 如果是文件并且后缀名匹配
      if (fileStat.isFile() && path.extname(file) === extension) {
        filteredFiles.push(file)
      }
    }
    return filteredFiles
  } catch (error) {
    if (error.toString().includes('no such file')) {
      console.debug(`获取文件列表时出错: ${error}`)
      return []
    }
    console.error(`获取文件列表时出错: ${error}`)
    return []
  }
}
/**
 * 获取正在运行的程序信息
 * @param {string} [programName] - 可选的程序名，用于模糊查询
 * @returns {Promise<Array>} - 返回一个包含程序信息的数组对象
 */
export const getRunningProcesses = async (programName: string): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    let command = ''
    const processInfo: any[] = []

    if (osPlatform === 'win32') {
      // Windows 使用 WMIC 命令
      // wmic process where "name like '%easytier%'" get Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize /format:csv
      command =
        'wmic process get Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize /format:csv'
      if (programName && programName !== '') {
        command =
          'wmic process where "name like \'%' +
          programName +
          '%\'" get Caption,commandline,ExecutablePath,ProcessId,WorkingSetSize /format:csv'
      }
    } else if (osPlatform === 'darwin' || osPlatform === 'linux') {
      // macOS 和 Linux 使用 ps 命令
      command = 'ps -eo comm,args,pid,rss'
      if (programName && programName !== '') {
        command = 'ps -eo comm,args,pid,rss | grep ' + programName
      }
    } else {
      reject(new Error('Unsupported OS'))
      return
    }

    exec(command, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      if (osPlatform === 'win32') {
        // 解析 Windows 的 CSV 输出
        const lines = stdout.trim().split('\n').slice(1) // 去掉第一行标题
        lines.forEach((line) => {
          const [_node, caption, commandline, executablePath, pid, workingSetSize] = line.split(',')
          const process = {
            name: caption,
            commandLine: commandline,
            path: executablePath,
            pid: parseInt(pid),
            memory: parseInt(workingSetSize)
          }
          processInfo.push(process)
        })
      } else if (osPlatform === 'darwin' || osPlatform === 'linux') {
        // 解析 macOS 和 Linux 的 ps 输出
        const lines = stdout.trim().split('\n').slice(1) // 去掉第一行标题
        lines.forEach((line) => {
          const [comm, args, pid, rss] = line.trim().split(/\s+/)
          const process = {
            name: comm,
            commandLine: args,
            path: args, // ps 命令不直接提供可执行文件路径
            pid: parseInt(pid),
            memory: parseInt(rss) * 1024 // rss 单位是 KB
          }
          processInfo.push(process)
        })
      }

      resolve(processInfo)
    })
  })
}

// 示例调用
// getRunningProcesses('chrome')
// .then(processes => {
//     console.log(processes);
// })
// .catch(error => {
//     console.error('Error:', error);
// });

/**
 * 终止指定进程的公共方法
 * @param {number} pid - 要终止的进程ID
 */
export const killProcess = (pid) => {
  return new Promise((resolve, reject) => {
    let killCommand
    switch (osPlatform) {
      case 'win32':
        // Windows 使用 taskkill 命令
        killCommand = `taskkill /PID ${pid} /F`
        break
      case 'darwin':
      case 'linux':
        // macOS 和 Linux 使用 kill 命令
        killCommand = `kill -9 ${pid}`
        break
      default:
        reject(new Error(`Unsupported platform: ${osPlatform}`))
        return
    }

    exec(killCommand, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}

export const execCli = async (cmd: string) => {
  return new Promise(async (resolve) => {
    try {
      const binPath = path.join(userDataPath, 'bin', 'easytier-cli')
      const command = binPath + ' ' + cmd
      // 检查是否有执行文件
      const exist = await exeExist(binPath + ' -V')
      if (!exist) {
        console.error('easytier-cli不存在或无可执行权限')
        resolve(403)
        return
      }
      console.log('执行命令:', command)
      exec(command, (error, stdout) => {
        if (error) {
          resolve(false)
          return
        }
        const res = stdout.trim()
        console.debug('执行结果:\n', res)
        resolve(res)
      })
    } catch (e) {
      console.error('执行exec出错', e)
      resolve(false)
    }
  })
}

export const exeCmd = async (execPath: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dirPath = path.dirname(execPath)
      // fs.accessSync(dirPath)
      fs.access(dirPath, (err) => {
        if (err) {
          console.debug('文件不存在')
          resolve(false)
          return
        }
      })
      exec(execPath, (error, stdout) => {
        if (error) {
          console.error('执行出错:', error.message)
          resolve(false)
        } else {
          resolve(stdout)
        }
      })
    } catch (e) {
      console.error('执行出错:', e)
      resolve(false)
    }
  })
}

export const exeExist = (execPath: string) => {
  return new Promise((resolve, reject) => {
    try {
      const dirPath = path.dirname(execPath)
      fs.accessSync(dirPath)
      exec(execPath, (error) => {
        if (error) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    } catch (e) {
      resolve(false)
    }
  })
}

export const runChildEasyTier = async (param: string = 'config.toml') => {
  return new Promise(async (resolve, reject) => {
    try {
      const binPath = path.join(userDataPath, 'bin', 'easytier-core')
      const confiPath = path.join(userDataPath, 'config', param)
      const args = ['-c', confiPath]
      // 检查是否有执行文件
      const exist = await exeExist(binPath + ' -V')
      if (!exist) {
        console.error('easytier-core不存在或无可执行权限')
        reject(false)
        return
      }
      console.log('开始启动,命令:', binPath, args[0], args[1])
      // 使用 spawn 创建子进程
      const childProcess = spawn(binPath, args, {
        detached: true, // 使子进程独立于父进程运行,让子进程在父进程退出后继续运行
        stdio: 'ignore' // 忽略子进程的标准输入输出
      })
      // 使子进程独立运行
      childProcess.unref()
      resolve(true)
    } catch (e) {
      console.error('spawn启动错误', e)
      reject(e)
    }
  })
}
/*
'aix'
'darwin'
'freebsd'
'linux'
'openbsd'
'sunos'
'win32'
 */
export const getSysInfo = async () => {
  return new Promise((resolve, reject) => {
    try {
      resolve({
        osType: process.platform,
        osArch: process.arch,
        osVersion: os.release()
      })
    } catch (e) {
      reject('获取系统信息失败')
    }
  })
}

export const download = async (event, url: string, targetPath: string) => {
  try {
    const savePath = path.join(userDataPath, 'bin', targetPath)
    await ensureDirectoryExists(savePath)
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 20000
    })
    const fs = require('fs')
    const writer = fs.createWriteStream(savePath)
    response.data.pipe(writer)

    writer.on('finish', () => {
      event.reply('download-complete', true)
    })

    writer.on('error', (err) => {
      console.error('下载出错', err.message)
      event.reply('download-error', err.message)
    })
  } catch (err) {
    console.error('下载出错', err.message)
    event.reply('download-error', err.message)
  }
}

export const extractZip = async (event, fileName, targetDir) => {
  return new Promise((resolve, reject) => {
    try {
      const zipPath = path.join(userDataPath, 'bin', fileName)
      targetDir = path.join(userDataPath, targetDir)
      const zip = new AdmZip(zipPath)
      const zipEntries = zip.getEntries()
      zipEntries.forEach((entry) => {
        if (entry.isDirectory) {
          // 如果是目录，创建目录
          const dirPath = path.join(targetDir, entry.entryName)
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
          }
        } else {
          // 如果是文件，解压文件
          const filePath = path.join(targetDir, entry.entryName)
          zip.extractEntryTo(entry, targetDir, false, true)
        }
      })
      resolve(true)
    } catch (err) {
      console.error('解压失败', err)
      reject(false)
    }
  })
}

export const unZipFile = (src: string, dest: string, callBack: (_?: any) => void) => {
  const unzip = new AdmZip(src)
  // 解压多个文件到目录文件
  unzip.extractAllToAsync(dest, /*overwrite*/ true, (err: any) => {
    if (err) {
      callBack?.(err)
    } else {
      // DeleteFile(src);
      callBack?.()
    }
  })
}

// Windows 安装指定程序为系统服务
export const installServiceOnWindows = async (
  serviceName: string,
  programPath: string,
  args: string
) => {
  return new Promise((resolve, reject) => {
    const command = `sc create ${serviceName} binPath= "${programPath} -c ${args}" displayname= "EasyTier 组网" start= auto type= share error= ignore`
    console.log('Windows 安装服务:', command)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing service: ${error.message}`)
        resolve(false)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
        resolve(false)
        return
      }
      console.log(`Service installed: ${stdout}`)
      resolve(true)
    })
  })
}

// Windows 删除服务
export const uninstallServiceOnWindows = (serviceName: string) => {
  return new Promise((resolve, reject) => {
    const command = `sc delete ${serviceName}`
    console.log('Windows 删除服务:', command)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error uninstalling service: ${error.message}`)
        resolve(false)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
        resolve(false)
        return
      }
      console.log(`Service uninstalled: ${stdout}`)
      resolve(true)
    })
  })
}

// Linux 安装指定程序为系统服务
export const installServiceOnLinux = (serviceName: string, programPath: string, args: string) => {
  return new Promise((resolve, reject) => {
    const serviceContent = `
[Unit]
Description=${serviceName}

[Service]
ExecStart=${programPath} -c ${args}
Restart=always

[Install]
WantedBy=multi-user.target
`
    console.log('Linux 安装服务:', serviceContent)
    const serviceFilePath = `/etc/systemd/system/${serviceName}.service`
    fs.writeFileSync(serviceFilePath, serviceContent)
    exec(
      `systemctl enable ${serviceName} && systemctl start ${serviceName}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error installing service: ${error.message}`)
          resolve(false)
          return
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`)
          resolve(false)
          return
        }
        console.log(`Service installed: ${stdout}`)
        resolve(true)
      }
    )
  })
}

// Linux 删除服务
export const uninstallServiceOnLinux = (serviceName: string) => {
  return new Promise((resolve, reject) => {
    const command = `systemctl stop ${serviceName} && systemctl disable ${serviceName}`
    const serviceFilePath = `/etc/systemd/system/${serviceName}.service`
    console.log('Linux 删除服务:', command)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error uninstalling service: ${error.message}`)
        resolve(false)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
        resolve(false)
        return
      }
      console.log(`Service stopped and disabled: ${stdout}`)
      fs.unlinkSync(serviceFilePath)
      console.log(`Service file removed: ${serviceFilePath}`)
      resolve(true)
    })
  })
}

// macOS 安装指定程序为系统服务
export const installServiceOnMacOS = (serviceName: string, programPath: string, args: string) => {
  return new Promise((resolve, reject) => {
    const serviceContent = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${serviceName}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${programPath}</string>
    <string> -c ${args}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
`
    console.log('macOS 安装服务:', serviceContent)
    const serviceFilePath = `/Library/LaunchDaemons/${serviceName}.plist`
    fs.writeFileSync(serviceFilePath, serviceContent)
    exec(`launchctl load ${serviceFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing service: ${error.message}`)
        resolve(false)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
        resolve(false)
        return
      }
      console.log(`Service installed: ${stdout}`)
      resolve(true)
    })
  })
}

// macOS 删除服务
export const uninstallServiceOnMacOS = (serviceName) => {
  return new Promise((resolve, reject) => {
    const serviceFilePath = `/Library/LaunchDaemons/${serviceName}.plist`
    const command = `launchctl unload ${serviceFilePath}`
    console.log('macOS 删除服务:', command)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error uninstalling service: ${error.message}`)
        resolve(false)
        return
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`)
        resolve(false)
        return
      }
      console.log(`Service unloaded: ${stdout}`)
      fs.unlinkSync(serviceFilePath)
      console.log(`Service file removed: ${serviceFilePath}`)
      resolve(true)
    })
  })
}
