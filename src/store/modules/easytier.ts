import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEasyTierStore = defineStore('easytier', () => {
  const configList = ref([])
  const fileList = ref([])
  const allConfigOptions = ref([])
  // 带有文件后缀
  const fileListNoSuffix = ref([])
  const stopLoop = ref(false)
  // 是否 通知 全部节点建立 P2P 连接  true:通知  false:不同值
  const p2pNotify = ref(true)
  // 启动直接报错提示
  const errRunNotify = ref(true)
  const defaultFormData = ref()
  const setConfigList = (list) => {
    configList.value = list
  }
  const setFileList = (list) => {
    fileList.value = list
  }
  const setFileListNoSuffix = (list) => {
    fileListNoSuffix.value = list
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
  return {
    configList,
    fileList,
    fileListNoSuffix,
    allConfigOptions,
    stopLoop,
    p2pNotify,
    defaultFormData,
    errRunNotify,
    setConfigList,
    setFileList,
    setFileListNoSuffix,
    setAllConfigOptions,
    setStopLoop,
    setP2pNotify,
    setDefaultFormData,
    setErrRunNotify
  }
})
