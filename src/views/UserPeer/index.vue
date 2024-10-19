<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { onBeforeMount, reactive, ref, unref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElOption, ElOptionGroup, ElSelect, ElTree } from 'element-plus'
import { deleteUserByIdApi } from '@/api/department'
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
    const res = await deleteUserByIdApi(unref(ids))
    return !!res
  }
})
const { total, loading, dataList, pageSize, currentPage } = tableState
const { getList } = tableMethods

const { allSchemas } = useCrudSchemas(crudSchemas)

const logDialogVisible = ref(false)
const stopDisabled = ref(false)
const descriptionCollapse = ref(false)
const logData = ref('')
const nodeInfo = ref({})
const peerInfo = ref<PeerInfo[]>([])
const treeEl = ref<typeof ElTree>()
const dialogTitle = ref('')
const ids = ref<string[]>([])
const currentNodeKey = ref('')
const currentDepartment = ref('')
const allConfigOptions = reactive([
  {
    label: '运行中',
    options: [{ label: '', value: '' }]
  },
  {
    label: '未运行',
    options: [{ label: '', value: '' }]
  }
])

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
  const fileList = await getFilesByExtension('config', '.toml')
  easyTierStore.setFileList(fileList)
  let tmpList: any = []
  let tmpList2: any = []
  let tmpList3: any = []
  fileList.forEach((f: string) => {
    const fileName = f.replace('.toml', '')
    tmpList.push({ network_name: fileName })
    tmpList3.push({ value: fileName, label: fileName })
    tmpList2.push(fileName)
  })
  easyTierStore.setConfigList(tmpList)
  easyTierStore.setFileListNoSuffix(tmpList2)
  easyTierStore.setAllConfigOptions(tmpList3)
  allConfigOptions[1].options = tmpList3
  // todo 使用上次的配置
  currentNodeKey.value = tmpList[0].network_name
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
    if (!res) {
      retryTime++
      continue
    } else {
      retryTime = 0
    }
    peerInfo.value = parsePeerInfo(res)
    peerInfo.value.forEach((value) => {
      if (value.cost === 'Local') {
        value.cost = '本机'
      }
      if (value.ipv4 && value.ipv4.includes('/')) {
        value.ipv4 = value.ipv4.split('/')[0]
      }
    })
    await getList()
    await sleep(7000)
  }
}

const startAction = async () => {
  log.log('开始运行配置:', currentNodeKey.value)
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
      stopDisabled.value = false
      easyTierStore.setStopLoop(false)
      getNodeInfo()
      getPeerInfo()
      descriptionCollapse.value = true
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
}
const stopAction = async () => {
  log.log('停止运行配置:', currentNodeKey.value)
  const processes = await getRunningProcesses('easytier-core')
  if (processes && processes.length > 0) {
    const { commandLine, pid } = processes.find((value: any) =>
      value.commandLine?.includes(currentNodeKey.value)
    )
    if (commandLine.includes(currentNodeKey.value)) {
      await killProcess(pid)
      nodeInfo.value = {}
      peerInfo.value.length = 0
      descriptionCollapse.value = false
      await getList()
      ElMessage.success(t('common.accessSuccess'))
    }
  }
  easyTierStore.setStopLoop(true)
}

const viewLogAction = async () => {
  const date = dayjs(new Date()).format('YYYY-MM-DD')
  logData.value = await readFile(LOG_PATH + '/' + currentNodeKey.value + '.' + date)
  logDialogVisible.value = true
}
const refreshAction = async () => {
  await getConfigList()
  getNodeInfo()
  getPeerInfo()
  ElMessage.info('已刷新')
}

onBeforeMount(async () => {
  try {
    await getConfigList()
    getNodeInfo()
    getPeerInfo()
  } catch (e) {
    log.debug('获取配置异常', e)
  }
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
      <div class="mt-5 mb-10px">
        <ElSelect
          v-model="currentNodeKey"
          placeholder="选择配置"
          class="mr-10px"
          style="width: 240px"
          default-first-option
        >
          <ElOptionGroup v-for="group in allConfigOptions" :key="group.label" :label="group.label">
            <ElOption
              v-for="item in group.options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElOptionGroup>
        </ElSelect>
        <BaseButton type="success" @click="startAction">{{ t('easytier.startNet') }}</BaseButton>
        <BaseButton type="danger" :disabled="stopDisabled" @click="stopAction"
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
</style>
