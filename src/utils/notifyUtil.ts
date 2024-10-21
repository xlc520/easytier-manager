export const notify = async (
  title: string = '',
  body: string,
  silent: boolean = true,
  icon: string = 'logo.png'
) => {
  new Notification(title, {
    body: body, // string (可选) - 通知的正文文本，将显示在标题或副标题下面。
    badge: 'badge', // (可选) 通知的副标题, 显示在标题下面。_ macOS _
    data: 'data',
    silent: silent, // boolean（可选）- 是否在显示通知时禁止操作系统发出通知提示音。
    icon: icon // (string | NativeImage) (optional) - An icon to use in the notification. If a string is passed, it must be a valid path to a local icon file.
  }).onclick
}
