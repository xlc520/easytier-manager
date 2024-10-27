// fileUtil.js
import { ipcRenderer } from 'electron'
import { GITHUB_DOWN_URL, GITHUB_EASYTIER } from '@/constants/easytier'
import log from '@/utils/logger'

export const readFile = async (filePath: string) => {
  try {
    return await ipcRenderer.invoke('readFile', filePath)
  } catch (error) {
    log.error('Error reading file:', error)
    return ''
  }
}

export const writeFile = async (filePath: string, content: any) => {
  try {
    await ipcRenderer.invoke('writeFile', filePath, content)
  } catch (error) {
    log.error('Error writing file:', error)
  }
}

export const deleteFile = async (filePath: string) => {
  try {
    await ipcRenderer.invoke('deleteFile', filePath)
  } catch (error) {
    log.error('Error delete file:', error)
  }
}

/**
 * 获取指定目录下指定后缀名称的文件列表
 * @param {string} dirPath - 目录路径
 * @param {string} extension - 文件后缀名（例如：'.txt'）
 * @returns {Promise<Array>} - 文件列表的 Promise
 */
export const getFilesByExtension = async (dirPath: string, extension: string) => {
  try {
    return await ipcRenderer.invoke('getFilesByExtension', dirPath, extension)
  } catch (error) {
    log.error('Error reading:', error)
  }
}

// 储存你应用程序配置文件的文件夹，默认是 appData 文件夹附加应用的名称 按照习惯用户存储的数据文件应该写在此目录
export const getUserDataPath = async () => {
  try {
    return await ipcRenderer.invoke('getUserDataPath')
  } catch (error) {
    log.error('Error :', error)
  }
}

/*
每个用户的应用程序数据目录，默认情况下指向：
%APPDATA% Windows 中
$XDG_CONFIG_HOME or ~/.config Linux 中
~/Library/Application Support macOS 中
 */
export const getAppDataPath = async () => {
  try {
    return await ipcRenderer.invoke('getAppDataPath')
  } catch (error) {
    log.error('Error:', error)
  }
}

export const download = async (url: string, savePath: string) => {
  try {
    await ipcRenderer.send('download', url, savePath)
  } catch (error) {
    log.error('Error:', error)
  }
}

export const downloadComplete = async (callback) => {
  try {
    await ipcRenderer.on('download-complete', callback)
  } catch (error) {
    log.error('Error:', error)
  }
}

export const downloadError = async (callback) => {
  try {
    return await ipcRenderer.on('download-error', callback)
  } catch (error) {
    log.error('Error:', error)
  }
}

export const downloadEasyTier = async (fileName: string, mirrorUrl: string) => {
  try {
    let url = GITHUB_EASYTIER + GITHUB_DOWN_URL + fileName
    if (mirrorUrl) {
      url = mirrorUrl + '/' + url
    }
    log.log('下载URL:', url)
    await download(url, fileName)
  } catch (error) {
    log.error('Error:', error)
  }
}

export const extractZip = async (fileName: string, targetDir: string) => {
  try {
    return await ipcRenderer.invoke('extractZip', fileName, targetDir)
  } catch (error) {
    log.error('Error:', error)
  }
}
