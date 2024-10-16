<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { onBeforeMount, reactive, ref, unref, watch } from 'vue'
import { ElMessage, ElOption, ElOptionGroup, ElSelect, ElTree } from 'element-plus'
import { deleteUserByIdApi } from '@/api/department'
import { useTable } from '@/hooks/web/useTable'
import Write from './components/Write.vue'
import { Dialog } from '@/components/Dialog'
import { useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { BaseButton } from '@/components/Button'
import crudSchemas from './crudSchemas'
import MonacoEditor from '@/components/monaco-editor/index.vue'
import { getFilesByExtension, readFile } from '@/utils/fileUtil'
import { useEasyTierStore } from '@/store/modules/easytier'
import { LOG_PATH } from '@/constants/easytier'
import dayjs from 'dayjs'
import {
  execCli,
  getRunningProcesses,
  killProcess,
  runChildEasyTier,
  sleep
} from '@/utils/execUtil'
import { parseNodeInfo, parsePeerInfo } from '@/utils/easyTierUtil'
import { Descriptions, DescriptionsSchema } from '@/components/Descriptions'

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

const editDialogVisible = ref(false)
const logDialogVisible = ref(false)
const stopDisabled = ref(false)
const descriptionCollapse = ref(false)
const dataConfig = ref('')
const logData = ref('')
const nodeInfo = ref({})
const peerInfo = ref<PeerInfo[]>([])
const treeEl = ref<typeof ElTree>()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const actionType = ref('')
const ids = ref<string[]>([])
const writeRef = ref<ComponentRef<typeof Write>>()
const saveLoading = ref(false)
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
onBeforeMount(async () => {
  try {
    await getConfigList()
    getNodeInfo()
    getPeerInfo()
  } catch (e) {
    console.error('获取配置异常', e)
  }
})

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
  console.log('开始运行配置:', currentNodeKey.value)
  await runChildEasyTier(currentNodeKey.value + '.toml').then(() => {
    stopDisabled.value = false
    easyTierStore.setStopLoop(false)
    getNodeInfo()
    getPeerInfo()
    descriptionCollapse.value = true
  })
}
const stopAction = async () => {
  console.log('停止运行配置:', currentNodeKey.value)
  const processes = await getRunningProcesses('easytier-core')
  if (processes && processes.length > 0) {
    console.log('processes', processes)
    const { commandLine, pid } = processes.find((value: any) =>
      value.commandLine?.includes(currentNodeKey.value)
    )
    if (commandLine.includes(currentNodeKey.value)) {
      await killProcess(pid)
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
const addConfigAction = () => {}
const saveConfigAction = async () => {
  const write = unref(writeRef)
  const formData = await write?.submit()
  if (formData) {
    saveLoading.value = true
    try {
    } catch (error) {
      console.log(error)
    } finally {
      saveLoading.value = false
      dialogVisible.value = false
    }
  }
}
const updateDataConfig = (val: string) => {
  //val:子组件实时传过来的值
  console.log(val)
}
</script>

<template>
  <div class="flex w-100% h-100%">
    <!--<ContentWrap class="w-250px">
      <div class="flex justify-center items-center">
        <div class="flex-1">{{ t('userDemo.departmentList') }}</div>
        <ElInput
          v-model="currentDepartment"
          class="flex-[2]"
          :placeholder="t('userDemo.searchDepartment')"
          clearable
        />
      </div>
      <ElDivider />
      组网列表
    </ContentWrap>-->

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
        <BaseButton type="primary" @click="viewLogAction">{{ t('easytier.view_log') }}</BaseButton>
      </div>
      <!--<Search
        :schema="allSchemas.searchSchema"
        @reset="setSearchParams"
        @search="setSearchParams"
      />-->
      <!--<div class="mb-10px">
        <BaseButton type="primary" @click="AddAction">{{ t('exampleDemo.add') }}</BaseButton>
        <BaseButton :loading="delLoading" type="danger" @click="delData()">
          {{ t('exampleDemo.del') }}
        </BaseButton>
      </div>-->
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

    <Dialog v-model="editDialogVisible" :title="dialogTitle">
      <MonacoEditor
        ref="monacoEdit"
        v-model:value="dataConfig"
        :readonly="false"
        language="toml"
        theme="vs-dark"
        :update="updateDataConfig"
      />
      <template #footer>
        <BaseButton
          v-if="actionType === 'add'"
          type="primary"
          :loading="saveLoading"
          @click="addConfigAction"
        >
          {{ t('exampleDemo.add') }}
        </BaseButton>
        <BaseButton
          v-if="actionType === 'edit'"
          type="primary"
          :loading="saveLoading"
          @click="saveConfigAction"
        >
          {{ t('exampleDemo.save') }}
        </BaseButton>
        <BaseButton @click="editDialogVisible = false">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Dialog>
    <Dialog v-model="logDialogVisible" :title="dialogTitle">
      <MonacoEditor
        ref="monacoEdit"
        v-model:value="logData"
        :readonly="true"
        language="log"
        theme="vs-dark"
      />
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
