import { platform } from '@tauri-apps/plugin-os'
import { locale } from '@tauri-apps/plugin-os'
import { getCurrentWindow } from '@tauri-apps/api/window'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  type Options
} from '@tauri-apps/plugin-notification'

/**
 * 操作系统平台
 * @returns platform 返回一个描述使用的特定操作系统的字符串。该值在编译时设置。
 * 可能的值有 linux、macos、ios、freebsd、dragonfly、netbsd、openbsd、solaris、android、windows
 */
export const getPlatform = () => {
  const currentPlatform = platform()
  return currentPlatform
}

export const getLocale = async () => {
  const currentLocale = await locale()
  console.log(currentLocale)
  if (currentLocale) {
    // use the locale string here
  }
  return currentLocale
}

// 处理窗口关闭事件
export const handleWindowClose = async () => {
  const window = getCurrentWindow()

  // 监听窗口关闭事件
  await window.onCloseRequested(async (event) => {
    // 阻止默认关闭行为
    event.preventDefault()

    // 询问用户是否最小化到托盘
    // const shouldMinimize = await ask('是否最小化到托盘？', {
    //   title: '关闭提示',
    //   type: 'warning'
    // })

    await window.minimize()
    // if (shouldMinimize) {
    //   // 最小化窗口
    // } else {
    //   // 用户选择退出，调用托盘的退出方法
    //   await trayStore.onQuit()
    // }
  })
}

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const notify = async (
  body: string,
  title: string = 'EasyTier 管理器',
  options?: Options
) => {
  // 通知权限
  let permissionGranted = await isPermissionGranted()

  // 如果没有，我们需要请求它
  if (!permissionGranted) {
    const permission = await requestPermission()
    permissionGranted = permission === 'granted'
  }

  // 一旦获得许可，我们就可以发送通知
  if (permissionGranted) {
    sendNotification({ title, body, silent: true, ...options })
  }
}
