<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { onBeforeMount, onMounted, reactive, ref, unref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification, ElOption, ElSelect, ElTree } from 'element-plus'
import { useTable } from '@/hooks/web/useTable'
import { Dialog } from '@/components/Dialog'
import { useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { BaseButton } from '@/components/Button'
import crudSchemas from './crudSchemas'
import { getFilesByExtension, readFile } from '@/utils/fileUtil'
import { useEasyTierStore } from '@/store/modules/easytier'
import { LOG_PATH } from '@/constants/easytier'
import dayjs from 'dayjs'
import { parseNodeInfo, parsePeerInfo } from '@/utils/easyTierUtil'
import { Descriptions, DescriptionsSchema } from '@/components/Descriptions'
import log from '@/utils/logger'
import MonacoEditor from '@/components/monaco-editor'
import { notify } from '@/utils/notifyUtil'
import { ipcRenderer } from 'electron'
import {
  execCli,
  getRunningProcesses,
  killProcess,
  runChildEasyTier,
  sleep
} from '@/utils/execUtil'

const { t } = useI18n()
const easyTierStore = useEasyTierStore()
const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const res = {
      list: peerInfo.value,
      total: peerInfo.value.length
    }
    return {
      list: res.list || [],
      total: res.total || 0
    }
  },
  fetchDelApi: async () => {
    return false
  }
})
const { total, loading, dataList, pageSize, currentPage } = tableState
const { getList } = tableMethods

const { allSchemas } = useCrudSchemas(crudSchemas)

const logDialogVisible = ref(false)
const descriptionCollapse = ref(false)
const runningTag = ref(false)
const logData = ref('')
const nodeInfo = ref({})
const peerInfo = ref<PeerInfo[]>([])
const treeEl = ref<typeof ElTree>()
const dialogTitle = ref('')
const currentNodeKey = ref('')
const currentDepartment = ref('')
const allConfigOptions = ref([
  {
    label: '',
    value: ''
  }
])
// 暂时无法判断配置是哪个节点网络
// const allConfigOptions = reactive([
//   {
//     label: '运行中',
//     options: [{ label: '', value: '' }]
//   },
//   {
//     label: '未运行',
//     options: [{ label: '', value: '' }]
//   }
// ])

const nodeInfoSchema = reactive<DescriptionsSchema[]>([
  {
    field: 'Hostname',
    label: t('easytier.hostname')
  },
  {
    field: 'Virtual IP',
    label: t('easytier.ipv4Vir')
  },
  {
    field: 'Public IP',
    label: t('easytier.ipPublic')
  },
  {
    field: 'UDP Stun Type',
    label: t('easytier.nat_type')
  },
  {
    field: 'Peer ID',
    label: t('easytier.peerId')
  },
  {
    field: 'Proxy CIDRs',
    label: t('easytier.proxy_network')
  },
  {
    field: 'Listener 1',
    label: t('easytier.listener1')
  },
  {
    field: 'Listener 2',
    label: t('easytier.listener2')
  },
  {
    field: 'Listener 3',
    label: t('easytier.listener3')
  },
  {
    field: 'Listener 4',
    label: t('easytier.listener4')
  }
])
watch(
  () => currentDepartment.value,
  (val) => {
    unref(treeEl)!.filter(val)
  }
)

const getConfigList = async () => {
  try {
    const fileList = await getFilesByExtension('config', '.toml')
    easyTierStore.setFileList(fileList)
    let tmpList: any = []
    let tmpList2: any = []
    let tmpList3: any = []
    fileList.forEach((f: string) => {
      const fileName = f.replace('.toml', '')
      tmpList.push({ configFileName: fileName })
      tmpList3.push({ value: fileName, label: fileName })
      tmpList2.push(fileName)
    })
    easyTierStore.setConfigList(tmpList)
    easyTierStore.setFileListNoSuffix(tmpList2)
    easyTierStore.setAllConfigOptions(tmpList3)
    allConfigOptions.value = tmpList3
    // allConfigOptions[1].options = tmpList3
    // todo 使用上次的配置
    if (tmpList && tmpList[0]) {
      currentNodeKey.value = tmpList[0].configFileName
    }
  } catch (e) {
    log.error('获取配置异常' + e)
  }
}
const getNodeInfo = async () => {
  const maxRetry = 10
  let retryTime = 1
  while (true) {
    // todo 可配置retryTime
    if (easyTierStore.stopLoop || retryTime > maxRetry) {
      break
    }
    const res = await execCli('node')
    if (res === 403) {
      easyTierStore.setStopLoop(true)
    }
    if (!res) {
      retryTime++
      continue
    }
    if (
      nodeInfo.value['Virtual IP'] &&
      nodeInfo.value['Public IP'] &&
      nodeInfo.value['UDP Stun Type']
    ) {
      retryTime = maxRetry
    }
    nodeInfo.value = parseNodeInfo(res) as string
    await sleep(7000)
  }
}
const getPeerInfo = async () => {
  let retryTime = 1
  while (true) {
    // todo 可配置retryTime
    if (easyTierStore.stopLoop || retryTime > 5) {
      break
    }
    const res = await execCli('peer')
    if (res === 403) {
      ElMessageBox.alert(
        'easytier-core 或 easytier-cli 不存在或无可执行权限，请到设置页下载安装，或授予可执行权限<br><b>使用：</b><br>1.先到设置检测内核是否存在；<br>2.配置页新建组网配置；<br>3.工作台运行配置<br>组网成功后可退出管理器',
        t('common.reminder'),
        {
          confirmButtonText: t('common.ok'),
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      easyTierStore.setStopLoop(true)
      continue
    }
    if (!res) {
      retryTime++
      continue
    } else {
      retryTime = 0
    }
    peerInfo.value = parsePeerInfo(res)
    const filter = peerInfo.value.filter((value) => value.ipv4 && value.cost !== 'Local')
    const filter1 = peerInfo.value.filter(
      (value) => value.ipv4 && value.cost !== 'Local' && value.cost === 'p2p'
    )
    peerInfo.value.forEach((value) => {
      if (value.cost === 'Local') {
        value.cost = '本机'
      }
      if (value.ipv4 && value.ipv4.includes('/')) {
        value.ipv4 = value.ipv4.split('/')[0]
      }
    })
    if (
      easyTierStore.p2pNotify &&
      filter.length > 0 &&
      filter1.length > 0 &&
      filter.length === filter1.length
    ) {
      notify('EasyTier 管理器', '恭喜你，全部节点建立 P2P 连接！🎉🎉')
      // 只通知一次
      easyTierStore.setP2pNotify(false)
    }
    await getList()
    await sleep(7000)
  }
}

const startAction = async () => {
  log.log('开始运行配置:' + currentNodeKey.value)
  await runChildEasyTier(currentNodeKey.value + '.toml')
    .then((res) => {
      if (!res) {
        ElMessageBox({
          title: '哦豁，出错啦',
          message: '运行当前配置出错，请在 设置 检查是否有核心程序，或核心程序是否有可执行权限',
          type: 'error',
          draggable: true,
          confirmButtonText: t('common.ok')
        })
        return
      }
      getNodeInfo()
      getPeerInfo()
      easyTierStore.setStopLoop(false)
      easyTierStore.setP2pNotify(true)
      descriptionCollapse.value = true
      runningTag.value = true
    })
    .catch(() => {
      ElMessageBox({
        title: '哦豁，出错啦',
        message: '运行当前配置出错，请在设置检查是否有核心程序，或核心程序是否有可执行权限',
        type: 'error',
        draggable: true,
        confirmButtonText: t('common.ok')
      })
    })
    .finally(() => currentNodeKeyChange())
}
const stopAction = async () => {
  log.log('停止运行配置:' + currentNodeKey.value)
  easyTierStore.setErrRunNotify(false)
  const p = await isRunProcess()
  if (p && p.commandLine) {
    await killProcess(p.pid)
    await reset()
    ElMessage.success(t('common.accessSuccess'))
  }
  easyTierStore.setStopLoop(true)
  currentNodeKeyChange()
}
const reset = async () => {
  nodeInfo.value = {}
  peerInfo.value.length = 0
  descriptionCollapse.value = false
  runningTag.value = false
  await getList()
}
const viewLogAction = async () => {
  const date = dayjs(new Date()).format('YYYY-MM-DD')
  logData.value = await readFile(LOG_PATH + '/' + currentNodeKey.value + '.' + date)
  logDialogVisible.value = true
}
const refreshAction = async () => {
  const p = await isRunProcess()
  if (p && p.commandLine) {
    runningTag.value = true
    easyTierStore.setStopLoop(false)
    getNodeInfo()
    getPeerInfo()
    await getList()
  } else {
    runningTag.value = false
  }
  ElMessage.info('已刷新')
}
// 是则返回进程信息，不是则 undefined
const isRunProcess = async () => {
  const processes = await getRunningProcesses('easytier-core')
  try {
    if (processes && processes.length > 0) {
      const p = processes.find((value: any) => value.commandLine?.includes(currentNodeKey.value))
      if (p && p.commandLine) {
        return p
      }
    }
  } catch (e) {
    log.error('错误' + e)
  }
  return undefined
}
const currentNodeKeyChange = async () => {
  easyTierStore.setErrRunNotify(true)
  const p = await isRunProcess()
  if (p && p.commandLine) {
    runningTag.value = true
    easyTierStore.setStopLoop(false)
    getNodeInfo()
    getPeerInfo()
    await getList()
    return
  }
  nodeInfo.value = {}
  peerInfo.value.length = 0
  descriptionCollapse.value = false
  runningTag.value = false
  easyTierStore.setStopLoop(true)
  await getList()
}
onBeforeMount(async () => {
  await getConfigList()
  getNodeInfo()
  getPeerInfo()
  currentNodeKeyChange()
})
onMounted(() => {
  ipcRenderer.on('runChildEasyTierExit', () => {
    if (easyTierStore.errRunNotify) {
      ElNotification({
        title: t('common.reminder'),
        message: '启动异常，请检查配置文件是否正确，或是否重复启动',
        type: 'error',
        duration: 8000
      })
    }
  })
  // ipcRenderer.on('update-message', (_event, arg) => {
  //   ElNotification({
  //     title: t('common.reminder'),
  //     message: arg,
  //     type: 'info'
  //   })
  // })
})
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-[3] ml-10px">
      <Descriptions
        :title="t('easytier.peerInfo')"
        :data="nodeInfo"
        :schema="nodeInfoSchema"
        :show="descriptionCollapse"
      />
      <small
        >注：当前配置是否在运行，以<b>选择框后的状态</b>为主，由于核心的原因，可能无法获取指定配置的节点信息</small
      >
      <div class="mt-3 mb-10px">
        <ElSelect
          v-model="currentNodeKey"
          placeholder="选择配置"
          class="mr-10px"
          style="width: 240px"
          default-first-option
          @change="currentNodeKeyChange"
        >
          <ElOption
            v-for="item in allConfigOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
          <!--<ElOptionGroup v-for="group in allConfigOptions" :key="group.label" :label="group.label">
          </ElOptionGroup>-->
        </ElSelect>
        <el-switch
          v-model="runningTag"
          class="mr-2 switch-color"
          size="large"
          inline-prompt
          :active-text="t('easytier.running')"
          :inactive-text="t('easytier.stopping')"
          disabled
        >
          <template #active-action>
            <span class="custom-active-action">v</span>
          </template>
          <template #inactive-action>
            <span class="custom-inactive-action">×</span>
          </template>
        </el-switch>
        <BaseButton type="success" @click="startAction" :disabled="runningTag"
          >{{ t('easytier.startNet') }}
        </BaseButton>
        <BaseButton type="danger" @click="stopAction" :disabled="!runningTag"
          >{{ t('easytier.stopNet') }}
        </BaseButton>
        <BaseButton type="info" @click="viewLogAction">{{ t('easytier.view_log') }}</BaseButton>
        <BaseButton type="primary" @click="refreshAction">{{ t('common.refresh') }}</BaseButton>
      </div>
      <Table
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :columns="allSchemas.tableColumns"
        :data="dataList"
        :loading="loading"
        align="center"
        headerAlign="center"
        @register="tableRegister"
        :pagination="{
          total
        }"
      />
    </ContentWrap>

    <Dialog v-model="logDialogVisible" :title="dialogTitle" maxHeight="60vh">
      <div class="edit-container h-60vh">
        <MonacoEditor
          ref="MonacoEditRef"
          v-model="logData"
          language="log"
          :readOnly="true"
          :languageSelector="false"
          :themeSelector="false"
        />
      </div>
      <template #footer>
        <BaseButton @click="logDialogVisible = false">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Dialog>
  </div>
</template>
<style lang="less">
.@{elNamespace}-dialog {
  --el-dialog-width: 70%;
}

.switch-color {
  --el-switch-on-color: #05b900;
  --el-switch-off-color: #ec2323;
}
</style>
