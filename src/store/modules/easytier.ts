import { RESOURCE_PATH } from '@/constants/easytier'
import { getConfigJsonObj, writeConfigJsonObj } from '@/utils/fileUtil'
import { resourceDir } from '@tauri-apps/api/path'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEasyTierStore = defineStore(
  'easytier',
  () => {
    const configPath = ref('resource')
    const configList = ref<RunningItem[]>([])
    const fileList = ref([])
    const runningList = ref<RunningItem[]>([])
    const lastRunConfig = ref('')
    const allConfigOptions = ref([])
    // 带有文件后缀
    const fileListNoSuffix = ref([])
    const stopLoop = ref(false)
    // 是否 通知 全部节点建立 P2P 连接  true:通知  false:不同值
    const p2pNotify = ref(true)
    // 启动直接报错提示
    const errRunNotify = ref(true)
    const defaultFormData = ref()
    const os = ref()
    const setConfigList = (list) => {
      configList.value = list
    }
    const setFileList = (list) => {
      fileList.value = list
    }
    const setFileListNoSuffix = (list) => {
      fileListNoSuffix.value = list
    }
    const loadRunningList = () => {
      const runningListStr = localStorage.getItem('runningList')
      runningList.value = JSON.parse(runningListStr || '[]')
    }
    const getRunningItem = (configFileName: string) => {
      return runningList.value.find((i) => i.configFileName === configFileName)
    }
    const addRunningList = (configFileName: string, pid: number) => {
      runningList.value.push({ configFileName, pid })
      localStorage.setItem('runningList', JSON.stringify(runningList.value))
    }
    const removeRunningList = (configFileName: string) => {
      runningList.value = runningList.value.filter((i) => i.configFileName !== configFileName)
      localStorage.setItem('runningList', JSON.stringify(runningList.value))
    }
    const setLastRunConfigName = (config: any) => {
      lastRunConfig.value = config
      localStorage.setItem('lastRunConfigName', JSON.stringify(config))
    }
    const getLastRunConfigName = () => {
      if (lastRunConfig.value) {
        return lastRunConfig.value
      }
      const storageConfigName = JSON.parse(localStorage.getItem('lastRunConfigName') || '{}')
      if (Object.keys(storageConfigName).length !== 0) {
        return storageConfigName
      }
      if (configList.value.length > 0) {
        return configList.value[0].configFileName
      }
      return ''
    }
    const setAllConfigOptions = (list) => {
      allConfigOptions.value = list
    }
    const setStopLoop = (flag) => {
      stopLoop.value = flag
    }
    const setP2pNotify = (flag) => {
      p2pNotify.value = flag
    }
    const setDefaultFormData = (data) => {
      defaultFormData.value = data
    }
    const setErrRunNotify = (data) => {
      errRunNotify.value = data
    }
    const setOs = (data) => {
      os.value = data
    }
    const setConfigPath = async (path?: string) => {
      if (path) {
        configPath.value = path
        return
      }
      // 读取 resource 目录下的 config.json 文件，并返回 JSON 对象
      // const configJsonObj = await getConfigJsonObj()
      // if (configJsonObj.configPath) {
      //   configPath.value = configJsonObj.configPath
      //   return
      // }
      // 如果 configJsonObj 中存在 path 键，则设置 configPath 为 path 键的值，如果不存在则判断 path 是否为空，为空则设置为 resource 目录，否则设置为 path 键的值
      configPath.value = await resourceDir()
      // configJsonObj.configPath = RESOURCE_PATH
      // await writeConfigJsonObj(configJsonObj)
    }
    return {
      configPath,
      configList,
      fileList,
      fileListNoSuffix,
      runningList,
      allConfigOptions,
      lastRunConfig,
      stopLoop,
      p2pNotify,
      defaultFormData,
      errRunNotify,
      os,
      setConfigList,
      setFileList,
      setFileListNoSuffix,
      loadRunningList,
      getRunningItem,
      addRunningList,
      removeRunningList,
      setAllConfigOptions,
      setLastRunConfigName,
      getLastRunConfigName,
      setStopLoop,
      setP2pNotify,
      setDefaultFormData,
      setErrRunNotify,
      setOs,
      setConfigPath
    }
  },
  {
    persist: {
      key: 'easytier',
      storage: localStorage
    }
  }
)
