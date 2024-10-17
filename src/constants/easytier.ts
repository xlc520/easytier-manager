/**
 * 配置目录
 */
export const CONFIG_PATH = 'config'
export const LOG_PATH = 'log'
/**
 * 配置文件名
 */
export const CONFIG_FILE_NAME = 'data.json'

export const CORE_INFO_API = 'https://api.github.com/repos/EasyTier/EasyTier/releases/latest'
export const GITHUB_EASYTIER = 'https://github.com/EasyTier/EasyTier'
export const GITHUB_DOWN_URL = '/releases/latest/download'
export const EASYTIER_NAME = '/easytier-<%= osType %>-<%= osArch %>-<%= version %>.zip'

export const GITHUB_MIRROR_URL = [
  {
    value: 'https://ghproxy.cn',
    label: 'https://ghproxy.cn'
  },
  {
    value: 'https://ghproxy.net',
    label: 'https://ghproxy.net'
  },
  {
    value: 'https://gh-proxy.com',
    label: 'https://gh-proxy.com'
  },
  {
    value: 'https://gh.xiu2.us.kg',
    label: 'https://gh.xiu2.us.kg'
  },
  {
    value: 'https://ghproxy.cc',
    label: 'https://ghproxy.cc'
  },
  {
    value: 'https://github.store',
    label: 'https://github.store'
  },
  {
    value: 'https://github.site',
    label: 'https://github.site'
  },
  {
    value: 'https://cors.isteed.cc',
    label: 'https://cors.isteed.cc'
  }
]
