// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//

import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron'
import { release } from 'os'
import path, { join } from 'path'
import {
  deleteFile,
  download,
  execCli,
  exeExist,
  extractZip,
  getFilesByExtension,
  getRunningProcesses,
  getSysInfo,
  killProcess,
  readFile,
  runChildEasyTier,
  writeFile
} from './mainUtil'
import fs from 'fs-extra'

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : join(process.env.DIST_ELECTRON, '../public')

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'EasyTier 组网',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    width: 950,
    height: 700,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      /** 是否在 Web Worker 中启用节点集成 */
      nodeIntegration: true, // 启用 Node.js 集成
      contextIsolation: false, // 禁用上下文隔离（可选，但通常与 nodeIntegration 一起使用）
      webSecurity: false // 禁用web安全策略
      // enableRemoteModule: true, // 启用 remote 模块（可选，但通常与 nodeIntegration 一起使用）
      // sandbox: false, // 开启沙盒则preload脚本被禁用，所以得设为false
      /** 是否启用 DevTools 仅在开发环境可用 */
      // devTools: !app.isPackaged
      // devTools: true
    },
    // 是否无边框窗口
    frame: true
  })
  // 隐藏electron的菜单栏
  // if (app.isPackaged) {
  //   Menu.setApplicationMenu(null)
  // }
  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }
  // win.maximize()

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}#${arg}`)
    // childWindow.webContents.openDevTools({ mode: 'undocked', activate: true })
  }
})

// 窗口最小化
ipcMain.on('window-min', function () {
  if (win) {
    win.minimize()
  }
})
//窗口最大化
ipcMain.on('window-max', function () {
  if (win) {
    if (win.isMaximized()) {
      win.restore()
    } else {
      win.maximize()
    }
  }
})
//关闭窗口
ipcMain.on('window-close', function () {
  if (win) {
    win.close()
  }
})

ipcMain.handle('getAppDataPath', async (event, data) => app.getPath('appData'))

ipcMain.handle('getUserDataPath', async (event, data) => app.getPath('userData'))

ipcMain.handle('getFilesByExtension', async (event, dirPath: string, extension: string) =>
  getFilesByExtension(dirPath, extension)
)
ipcMain.handle('getSysInfo', async (event) => getSysInfo())
ipcMain.handle('read-file', async (event, filePath) => readFile(filePath))
ipcMain.handle('write-file', async (event, filePath, content) => writeFile(filePath, content))
ipcMain.handle('deleteFile', async (event, filePath) => deleteFile(filePath))
ipcMain.handle('execCli', async (event, param) => execCli(param))
ipcMain.handle('exeExist', async (event, param) => exeExist(param))
ipcMain.handle('killProcess', async (event, param) => killProcess(param))
ipcMain.handle('runChildEasyTier', async (event, param) => runChildEasyTier(param))
ipcMain.handle(
  'getRunningProcesses',
  async (event, programName): Promise<Array<any>> => getRunningProcesses(programName)
)

ipcMain.on('download', async (event, url, savePath) => download(event, url, savePath))
// 处理压缩包解压
ipcMain.on('extract-zip', async (event, zipPath, targetDir) =>
  extractZip(event, zipPath, targetDir)
)
