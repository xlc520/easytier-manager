// @ts-nocheck
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { app, dialog } from 'electron'
import path from 'path'

const init = async (mainWindow) => {
  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.autoDownload = false
  // autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = true // 允许降级
  autoUpdater.allowPrerelease = true // 允许升级到 pre-release 版本
  if (!app.isPackaged) {
    // Useful for some dev/debugging tasks, but download can
    // not be validated becuase dev app is not signed
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
  }
  // 设置更新服务器
  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: 'http://your-update-server.com/updates/'
  // })
  // checkForUpdates：检查是否有新更新可用
  // downloadUpdate：下载更新
  // quitAndInstall：安装更新
  // on：监听事件
  //
  // checking-for-update：检查更新中
  // update-available：有新版本可用
  // update-not-available：没有新版本可用
  // error：错误事件
  // update-downloaded：更新下载完毕
  // download-progress：下载事件，其中包括总下载量、已下载量等属性
  //
  // total：下载的文件的总字节数
  // delta: 表示自上次进度事件以来已下载的字节数
  // transferred: 表示自下载开始以来已经传输的字节数
  // percent: 表示下载完成的百分比
  // bytesPerSecond: 表示当前下载速度，即每秒传输的字节数
  // 监听更新事件
  autoUpdater.on('checking-for-update', () => {
    log.info('检查更新...')
    mainWindow?.webContents.send('update-message', '检查更新...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('有可用更新:' + JSON.stringify(info))
    mainWindow?.webContents.send('update-message', '有可用更新.')
    // 当有新版本可用时，弹窗提示用户
    dialog
      .showMessageBox({
        type: 'info',
        title: '新版本可用',
        message: '有一个可用的新版本，要更新吗',
        buttons: ['更新', '取消']
      })
      .then((result) => {
        if (result.response === 0) {
          // 用户选择更新，触发下载和安装
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('暂无更新')
    mainWindow?.webContents.send('update-message', '暂无更新.')
  })

  autoUpdater.on('error', (err) => {
    log.error('更新出错' + err.message)
    mainWindow?.webContents.send('update-message', `更新出错`)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = '下载速度: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - 下载进度 ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    log.info(log_message)
    mainWindow?.webContents.send('update-message', log_message)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.error('下载完成' + JSON.stringify(info))
    mainWindow?.webContents.send('update-message', '下载完成!')
    // 处理下载完成的情况
    dialog
      .showMessageBox({
        type: 'info',
        title: '更新下载完成',
        message: '点击确定重启获取最新内容',
        buttons: ['确定']
      })
      .then(() => {
        // 调用 quitAndInstall 来安装更新
        autoUpdater.quitAndInstall()
      })
  })

  // 检查更新
  autoUpdater.checkForUpdatesAndNotify()
}
const quitAndInstall = () => {
  autoUpdater.quitAndInstall()
}
const checkForUpdatesAndNotify = async () => {
  await autoUpdater.checkForUpdatesAndNotify()
}
export default { init, quitAndInstall, checkForUpdatesAndNotify }
