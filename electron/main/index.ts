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

import { app, BrowserWindow, ipcMain, shell, Menu, nativeImage, Tray } from 'electron'
import { release } from 'os'
import path, { join } from 'path'
import * as mainUtil from './mainUtil'
import log from './logger'
import { ContextMenu as contextMenu } from '../../src/components/ContextMenu'

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
let tray: Tray | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

const createWindow = async () => {
  win = new BrowserWindow({
    title: 'EasyTier 管理器',
    icon: join(process.env.PUBLIC, 'logo.png'),
    width: 1024,
    height: 700,
    webPreferences: {
      preload,
      nodeIntegrationInWorker: true, //使用Node.js的特性,多线程的Node.js
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      /** 是否在 Web Worker 中启用节点集成 */
      nodeIntegration: true, // 启用 Node.js 集成
      contextIsolation: false, // 禁用上下文隔离（可选，但通常与 nodeIntegration 一起使用）
      webSecurity: false, // 禁用web安全策略
      // enableRemoteModule: true, // 启用 remote 模块（可选，但通常与 nodeIntegration 一起使用）
      sandbox: false, // 开启沙盒则preload脚本被禁用，所以得设为false
      /** 是否启用 DevTools 仅在开发环境可用 */
      devTools: !app.isPackaged
    },
    // 是否无边框窗口
    frame: true
  })
  // 隐藏electron的菜单栏
  if (app.isPackaged) {
    Menu.setApplicationMenu(null)
  }
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
    if (url.startsWith('http:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.on('close', (e) => {
    console.log(win.isFocused())
    if (!win.isFocused()) {
      win = null
    } else {
      e.preventDefault() /*阻止应用退出*/
      win.hide() /*隐藏当前窗口*/
    }
  })

  // 系统通知的应用包名
  app.setAppUserModelId(win.title)

  log.info('\n\n')
  log.info(win.title + ' 启动成功！')
}

const initTray = async () => {
  const icon = nativeImage.createFromPath(join(process.env.PUBLIC, 'logo.png'))
  tray = new Tray(icon)
  // 上下文菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开面板',
      click: () => {
        win.show()
      }
    },
    {
      label: '退出',
      click: () => {
        // BrowserWindow.getFocusedWindow().webContents().send('close-main-window');
        app.quit()
      }
    }
  ])

  // 注意: 你的 contextMenu, Tooltip 和 Title 代码需要写在这里!
  tray.setContextMenu(contextMenu)
  // 工具提示和标题
  tray.setTitle(win.title)
  tray.setToolTip(process.env.npm_package_description)

  // 监听任务栏图标的单击、双击事件
  tray.on('click', () => {
    win.show()
  })
  tray.on('double-click', () => {
    win.show()
  })
}

app.whenReady().then(async () => {
  await createWindow()
  await initTray()
})

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

app.on('activate', async () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    await createWindow()
    await initTray()
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
ipcMain.handle('getVersion', async (event) => app.getVersion())

ipcMain.handle('getFilesByExtension', async (event, dirPath: string, extension: string) =>
  mainUtil.getFilesByExtension(dirPath, extension)
)
ipcMain.handle('getSysInfo', async (event) => mainUtil.getSysInfo())
ipcMain.handle('read-file', async (event, filePath) => mainUtil.readFile(filePath))
ipcMain.handle('write-file', async (event, filePath, content) =>
  mainUtil.writeFile(filePath, content)
)
ipcMain.handle('deleteFile', async (event, filePath) => mainUtil.deleteFile(filePath))
ipcMain.handle('exeCmd', async (event, param) => mainUtil.exeCmd(param))
ipcMain.handle('execCli', async (event, param) => mainUtil.execCli(param))
ipcMain.handle('exeExist', async (event, param) => mainUtil.exeExist(param))
ipcMain.handle('killProcess', async (event, param) => mainUtil.killProcess(param))
ipcMain.handle('runChildEasyTier', async (event, param) => mainUtil.runChildEasyTier(param))
ipcMain.handle(
  'getRunningProcesses',
  async (event, programName): Promise<Array<any>> => mainUtil.getRunningProcesses(programName)
)

ipcMain.on('download', async (event, url, savePath) => mainUtil.download(event, url, savePath))
// 处理压缩包解压
ipcMain.handle('extractZip', async (event, fileName, targetDir) =>
  mainUtil.extractZip(event, fileName, targetDir)
)

// 日志
ipcMain.handle('logger', (event, level, arg) => {
  // error, warn, info, verbose, debug, silly
  switch (level) {
    case 'info':
      log.info(arg)
      break
    case 'warn':
      log.warn(arg)
      break
    case 'error':
      log.error(arg)
      break
    case 'verbose':
      log.verbose(arg)
      break
    case 'debug':
      log.debug(arg)
      break
    case 'silly':
      log.silly(arg)
      break
    default:
      log.info(arg)
  }
})
