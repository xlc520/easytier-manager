<script setup lang="tsx">
import { BaseButton } from '@/components/Button'
import { CodeEditor } from '@/components/CodeEditor'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { useI18n } from '@/hooks/web/useI18n'
import { ElMessageBox, ElNotification, ElOption, ElSelect, ElTree } from 'element-plus'
import { computed, onBeforeMount, onMounted, reactive, ref, unref, watch } from 'vue'
import { Descriptions, DescriptionsSchema } from '@/components/Descriptions'
import { LOG_PATH } from '@/constants/easytier'
import { useEasyTierStore } from '@/store/modules/easytier'
import { useTrayStore } from '@/store/modules/trayStore'
import { parseNodeInfo, parsePeerInfo } from '@/utils/easyTierUtil'
import { listTomlFiles, readFileContent } from '@/utils/fileUtil'
import { killProcess, runEasyTierCli, runEasyTierCore } from '@/utils/shellUtil'
import { notify, sleep } from '@/utils/sysUtil'
import dayjs from 'dayjs'

const { t } = useI18n()
const easyTierStore = useEasyTierStore()
const trayStore = useTrayStore()
const logDialogVisible = ref(false)
const descriptionCollapse = ref(false)
// const runningTag = ref(false)
const logData = ref('')
const MonacoEditRef = ref()
const wordWrap = ref('off')
const nodeInfo = ref({})
const peerInfo = ref<PeerInfo[]>([])
const treeEl = ref<typeof ElTree>()
const dialogTitle = ref('')
const currentNodeKey = ref<RunningItem>({
  configFileName: ''
})
const currentDepartment = ref('')
const tableRowClassName = ({ rowIndex }: { row: any; rowIndex: number }) => {
  if (rowIndex === 1) {
    return 'warning-row'
  } else if (rowIndex === 3) {
    return 'success-row'
  }
  return ''
}
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
    const fileList = await listTomlFiles()
    const tmpList: any = []
    for (const f of fileList) {
      const configName = f.replace('.toml', '')
      tmpList.push({ configFileName: configName, fileName: f })
    }
    easyTierStore.setConfigList(tmpList)
    // todo 使用上次的配置
    if (tmpList && tmpList[0]) {
      currentNodeKey.value = tmpList[0]
    }
  } catch (e) {
    console.error('获取配置异常' + e)
  }
}
// 从easyTierStore.runningList 同步 runningTag
const runningTag = computed(() => {
  const res = easyTierStore.runningList.some(
    (i) => i.configFileName === currentNodeKey.value.configFileName
  )
  return res
})
const routeCost = (cost: string) => {
  switch (cost) {
    case 'p2p':
      return t('easytier.direct')
    case 'Local':
      return t('easytier.local')
    default:
      return t('easytier.relay')
  }
}
const getNatType = (natType: string) => {
  /*
  Unknown = 0;
  OpenInternet = 1;
  NoPAT = 2;
  FullCone = 3;
  Restricted = 4;
  PortRestricted = 5;
  Symmetric = 6;
  SymUdpFirewall = 7;
  SymmetricEasyInc = 8;
  SymmetricEasyDec = 9;
  */
  switch (natType) {
    case 'FullCone':
      return t('easytier.fullCone')
    case 'Restricted':
      return t('easytier.restricted')
    case 'PortRestricted':
      return t('easytier.portRestricted')
    case 'Symmetric':
      return t('easytier.symmetric')
    case 'Unknown':
      return t('easytier.unknown')
    default:
      return natType
  }
}
const getNodeInfo = async () => {
  await sleep(3000)
  const maxRetry = 10
  let retryTime = 1
  while (true) {
    // todo 可配置retryTime
    if (easyTierStore.stopLoop || retryTime > maxRetry) {
      break
    }
    const res = await runEasyTierCli(['node'])
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
  await sleep(3000)
  let retryTime = 1
  while (true) {
    // todo 可配置retryTime
    if (easyTierStore.stopLoop || retryTime > 5) {
      break
    }
    const res = await runEasyTierCli(['peer'])
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
    console.log('peerInfo.value', peerInfo.value)
    const filter = peerInfo.value.filter((value) => value.ipv4 && value.cost !== 'Local')
    const filter1 = peerInfo.value.filter(
      (value) => value.ipv4 && value.cost !== 'Local' && value.cost === 'p2p'
    )
    peerInfo.value.forEach((value) => {
      if (value.ipv4 && value.ipv4.includes('/')) {
        value.ipv4 = value.ipv4.split('/')[0]
      }
      value.cost = routeCost(value.cost)
      value.nat_type = getNatType(value.nat_type)
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
    // await getList()
    await sleep(7000)
  }
}

const startAction = async () => {
  console.log('开始运行配置:', currentNodeKey.value.configFileName)
  await runEasyTierCore(currentNodeKey.value.fileName!)
    .then((res) => {
      console.log('运行配置结果:', res)
      easyTierStore.addRunningList(currentNodeKey.value.configFileName, res)
      console.log('运行配置:', easyTierStore.runningList)
      getNodeInfo()
      getPeerInfo()
      easyTierStore.setStopLoop(false)
      easyTierStore.setP2pNotify(true)
      easyTierStore.setLastRunConfigName(currentNodeKey.value)
      descriptionCollapse.value = true
      trayStore.setTrayTooltip('当前运行配置：' + currentNodeKey.value.configFileName)
      // runningTag.value = true
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
  console.log('停止运行配置:', currentNodeKey.value.configFileName)
  // easyTierStore.setErrRunNotify(false)
  const pid = easyTierStore.getRunningItem(currentNodeKey.value.configFileName)?.pid
  if (pid) {
    const res = await killProcess(pid)
    console.log('停止运行配置结果:', res)
    if (res) {
      await reset()
      easyTierStore.removeRunningList(currentNodeKey.value.configFileName)
      ElNotification({
        title: t('common.reminder'),
        message: t('common.accessSuccess'),
        type: 'success',
        duration: 2000
      })
    }
  } else {
    ElNotification({
      title: t('common.reminder'),
      message: '当前配置未运行',
      type: 'warning',
      duration: 2000
    })
  }
  trayStore.setTrayTooltip(undefined)
  easyTierStore.setStopLoop(true)
  // currentNodeKeyChange()
}
const reset = async () => {
  nodeInfo.value = {}
  peerInfo.value.length = 0
  descriptionCollapse.value = false
  // runningTag.value = false
  // await getList()
}
const viewLogAction = async () => {
  const date = dayjs(new Date()).format('YYYY-MM-DD')
  logData.value = (await readFileContent(
    LOG_PATH + '/' + currentNodeKey.value.configFileName + '.' + date
  )) as string
  if (!logData.value || logData.value === '') {
    logData.value = (await readFileContent(
      LOG_PATH + '/' + currentNodeKey.value.configFileName + '.' + date + '.log'
    )) as string
  }
  logDialogVisible.value = true
}
// const refreshAction = async () => {
//   // const p = await isRunProcess()
//   // if (p && p.commandLine) {
//   //   runningTag.value = true
//   //   easyTierStore.setStopLoop(false)
//   //   getNodeInfo()
//   //   getPeerInfo()
//   //   await getList()
//   // } else {
//   //   runningTag.value = false
//   // }
//   // ElMessage.info('已刷新')
// }
// // 是则返回进程信息，不是则 undefined
// const isRunProcess = async () => {
//   // const processes = await getRunningProcesses('easytier-core')
//   // try {
//   //   if (processes && processes.length > 0) {
//   //     const p = processes.find((value: any) => value.commandLine?.includes(currentNodeKey.value))
//   //     if (p && p.commandLine) {
//   //       return p
//   //     }
//   //   }
//   // } catch (e) {
//   //   log.error('错误' + e)
//   // }
//   // return undefined
// }
const currentNodeKeyChange = async () => {
  console.log('currentNodeKeyChange:', currentNodeKey.value)

  // easyTierStore.setErrRunNotify(true)
  // const p = await isRunProcess()
  // if (p && p.commandLine) {
  //   runningTag.value = true
  //   easyTierStore.setStopLoop(false)
  //   getNodeInfo()
  //   getPeerInfo()
  //   // await getList()
  //   return
  // }
  // nodeInfo.value = {}
  // peerInfo.value.length = 0
  // descriptionCollapse.value = false
  // runningTag.value = false
  // easyTierStore.setStopLoop(true)
  // await getList()
}

const wordWrapChange = (val: any) => {
  MonacoEditRef.value.updateOptions({ wordWrap: val })
}
onBeforeMount(async () => {
  await getConfigList()
  currentNodeKey.value = easyTierStore.getLastRunConfigName()
})
onMounted(async () => {
  easyTierStore.loadRunningList()
  easyTierStore.runningList.forEach((item) => {
    console.log('item', item)
  })

  getNodeInfo()
  getPeerInfo()
  // currentNodeKeyChange()

  // ipcRenderer.on('runChildEasyTierExit', () => {
  //   if (easyTierStore.errRunNotify) {
  //     ElNotification({
  //       title: t('common.reminder'),
  //       message: '启动异常，请检查配置文件是否正确，或是否重复启动',
  //       type: 'error',
  //       duration: 8000
  //     })
  //   }
  // })
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
          value-key="configFileName"
          @change="currentNodeKeyChange"
        >
          <ElOption
            v-for="item in easyTierStore.configList"
            :key="item.configFileName"
            :label="item.configFileName"
            :value="item"
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
        <!-- <BaseButton type="primary" @click="refreshAction">{{ t('common.refresh') }}</BaseButton> -->
      </div>
      <el-table
        :data="peerInfo"
        style="width: 100%; margin-top: 10px"
        height="53vh"
        :default-sort="{ prop: 'ipv4_addr', order: 'ascending' }"
        table-layout="fixed"
        :row-class-name="tableRowClassName"
        stripe
        border
      >
        <el-table-column
          prop="ipv4"
          :label="t('easytier.ipv4Vir')"
          width="105"
          show-overflow-tooltip
        >
          <!--  <template #default="{ row }">
            <span>{{ ipFormat(row.ipv4_addr) }}</span>
          </template> -->
        </el-table-column>
        <el-table-column prop="hostname" :label="t('easytier.hostname')" show-overflow-tooltip />
        <el-table-column prop="cost" :label="t('easytier.cost')" show-overflow-tooltip>
          <!-- <template #default="{ row }">
            <span>{{ routeCost(row.cost) }}</span>
          </template> -->
        </el-table-column>
        <el-table-column prop="lat_ms" :label="t('easytier.lat_ms')" show-overflow-tooltip />
        <el-table-column prop="rx_bytes" :label="t('easytier.rx_bytes')" show-overflow-tooltip>
          <!-- <template #default="{ row }">
            <span>{{ rxBytes(row.rx_bytes) }}</span>
          </template> -->
        </el-table-column>
        <el-table-column prop="tx_bytes" :label="t('easytier.tx_bytes')" show-overflow-tooltip>
          <!-- <template #default="{ row }">
            <span>{{ txBytes(row.tx_bytes) }}</span>
          </template> -->
        </el-table-column>
        <el-table-column prop="loss_rate" :label="t('easytier.loss_rate')" show-overflow-tooltip>
          <!-- <template #default="{ row }">
            <span>{{ lossRate(row.loss_rate) }}</span>
          </template> -->
        </el-table-column>
        <el-table-column prop="nat_type" :label="t('easytier.nat_type')" show-overflow-tooltip />
        <!-- <el-table-column
          prop="tunnel_proto"
          :label="t('easytier.tunnel_proto')"
          show-overflow-tooltip
        /> -->
        <el-table-column prop="version" :label="t('easytier.version')" show-overflow-tooltip />
      </el-table>
    </ContentWrap>

    <Dialog v-model="logDialogVisible" :title="dialogTitle" maxHeight="60vh">
      <div class="edit-container h-60vh">
        <el-form-item label="日志换行">
          <el-select
            v-model="wordWrap"
            style="width: 240px"
            @change="wordWrapChange"
            default-first-option
          >
            <el-option label="不换行" value="off" />
            <el-option label="换行" value="on" />
          </el-select>
        </el-form-item>
        <CodeEditor
          ref="MonacoEditRef"
          v-model="logData"
          language="log"
          theme="log"
          :readOnly="true"
          :languageSelector="false"
          :themeSelector="false"
          :wordWrap="wordWrap"
        />
      </div>
      <template #footer>
        <BaseButton @click="logDialogVisible = false">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Dialog>
  </div>
</template>
<style lang="less">
// .@{elNamespace}-dialog {
//   --el-dialog-width: 70%;
// }

.switch-color {
  --el-switch-on-color: #05b900;
  --el-switch-off-color: #ec2323;
}
</style>
