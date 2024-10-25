import { ipcRenderer } from 'electron'
import log from '@/utils/logger'

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
    log.error('获取系统信息失败:', error)
  }
}

export const execCli = async (cmd: string) => {
  try {
    return await ipcRenderer.invoke('execCli', cmd)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const exeCmd = async (cmd: string) => {
  try {
    return await ipcRenderer.invoke('exeCmd', cmd)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const exeExist = async (cmd: string) => {
  try {
    return await ipcRenderer.invoke('exeExist', cmd)
  } catch (error) {
    log.error('读取进程异常:', error)
  }
}

export const runChildEasyTier = async (param: string) => {
  try {
    return await ipcRenderer.invoke('runChildEasyTier', param)
  } catch (error) {
    log.error('启动EasyTier异常:', error)
  }
}

export const getRunningProcesses = async (programName: string) => {
  try {
    return await ipcRenderer.invoke('getRunningProcesses', programName)
  } catch (error) {
    log.error('读取进程异常:', error)
  }
}

export const killProcess = async (pid: any) => {
  try {
    return await ipcRenderer.invoke('killProcess', pid)
  } catch (error) {
    log.error('读取进程异常:', error)
  }
}

export const getVersion = async () => {
  try {
    return await ipcRenderer.invoke('getVersion')
  } catch (error) {
    log.error('获取版本异常:', error)
  }
}

export const installServiceOnWindows = async (
  serviceName: string,
  programPath: string,
  args: string
) => {
  try {
    return await ipcRenderer.invoke('installServiceOnWindows', serviceName, programPath, args)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const uninstallServiceOnWindows = async (serviceName: string) => {
  try {
    return await ipcRenderer.invoke('uninstallServiceOnWindows', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const installServiceOnLinux = async (
  serviceName: string,
  programPath: string,
  args: string
) => {
  try {
    return await ipcRenderer.invoke('installServiceOnLinux', serviceName, programPath, args)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const uninstallServiceOnLinux = async (serviceName: string) => {
  try {
    return await ipcRenderer.invoke('uninstallServiceOnLinux', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const installServiceOnMacOS = async (
  serviceName: string,
  programPath: string,
  args: string
) => {
  try {
    return await ipcRenderer.invoke('installServiceOnMacOS', serviceName, programPath, args)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const uninstallServiceOnMacOS = async (serviceName) => {
  try {
    return await ipcRenderer.invoke('uninstallServiceOnMacOS', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const installService = async (serviceName: string, programPath: string, args: string) => {
  try {
    const sysInfo = await ipcRenderer.invoke('getSysInfo')
    if (sysInfo.osType === 'win32') {
      return await installServiceOnWindows(serviceName, programPath, args)
    }
    if (sysInfo.osType === 'linux') {
      return await installServiceOnLinux(serviceName, programPath, args)
    }
    if (sysInfo.osType === 'darwin') {
      return await installServiceOnMacOS(serviceName, programPath, args)
    }
  } catch (error) {
    log.error('异常:', error)
  }
}

export const uninstallService = async (serviceName: string) => {
  try {
    const sysInfo = await ipcRenderer.invoke('getSysInfo')
    if (sysInfo.osType === 'win32') {
      return await uninstallServiceOnWindows(serviceName)
    }
    if (sysInfo.osType === 'linux') {
      return await uninstallServiceOnLinux(serviceName)
    }
    if (sysInfo.osType === 'darwin') {
      return await uninstallServiceOnMacOS(serviceName)
    }
  } catch (error) {
    log.error('异常:', error)
  }
}

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const checkForUpdatesAndNotify = async () => {
  try {
    await ipcRenderer.send('checkForUpdatesAndNotify')
  } catch (error) {
    log.error('异常:', error)
  }
}

export const setLogLevel = async (level: any) => {
  try {
    await ipcRenderer.send('setLogLevel', level)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const getLogLevel = async () => {
  try {
    return await ipcRenderer.invoke('getLogLevel')
  } catch (error) {
    log.error('异常:', error)
  }
}

export const startServiceOnWindows = async (serviceName: string) => {
  try {
    return await ipcRenderer.invoke('startServiceOnWindows', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const stopServiceOnWindows = async (serviceName: string) => {
  try {
    return await ipcRenderer.invoke('stopServiceOnWindows', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}

export const checkServiceOnWindows = async (serviceName: string) => {
  try {
    return await ipcRenderer.invoke('checkServiceOnWindows', serviceName)
  } catch (error) {
    log.error('异常:', error)
  }
}
