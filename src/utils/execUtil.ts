import { ipcRenderer } from 'electron'

export const getSysInfo = async () => {
  try {
    const sysInfo = await ipcRenderer.invoke('getSysInfo')
    if (sysInfo.osType === 'win32') {
      sysInfo.osType = 'windows'
    }
    if (sysInfo.osArch === 'x64') {
      sysInfo.osArch = 'x86_64'
    }
    return sysInfo
  } catch (error) {
    console.error('获取系统信息失败:', error)
  }
}

export const execCli = async (cmd: string) => {
  try {
    return await ipcRenderer.invoke('execCli', cmd)
  } catch (error) {
    console.error('异常:', error)
  }
}

export const exeExist = async (cmd: string) => {
  try {
    return await ipcRenderer.invoke('exeExist', cmd)
  } catch (error) {
    console.error('读取进程异常:', error)
  }
}

export const runChildEasyTier = async (param: string) => {
  try {
    return await ipcRenderer.invoke('runChildEasyTier', param)
  } catch (error) {
    console.error('启动EasyTire异常:', error)
  }
}

export const getRunningProcesses = async (programName: string) => {
  try {
    return await ipcRenderer.invoke('getRunningProcesses', programName)
  } catch (error) {
    console.error('读取进程异常:', error)
  }
}

export const killProcess = async (pid: any) => {
  try {
    return await ipcRenderer.invoke('killProcess', pid)
  } catch (error) {
    console.error('读取进程异常:', error)
  }
}

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
