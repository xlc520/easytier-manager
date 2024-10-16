import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEasyTierStore = defineStore('easytier', () => {
  const configList = ref([])
  const fileList = ref([])
  const allConfigOptions = ref([])
  // 带有文件后缀
  const fileListNoSuffix = ref([])
  const stopLoop = ref(false)
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
  return {
    configList,
    fileList,
    fileListNoSuffix,
    allConfigOptions,
    stopLoop,
    setConfigList,
    setFileList,
    setFileListNoSuffix,
    setAllConfigOptions,
    setStopLoop
  }
})
