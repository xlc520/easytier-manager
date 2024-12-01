<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { BIN_PATH, LOG_PATH } from '@/constants/easytier'
import { useI18n } from '@/hooks/web/useI18n'
import { downloadFile } from '@/utils/fileUtil'
import { useClipboard } from '@vueuse/core'
import { ElInput, ElMessage, ElNotification } from 'element-plus'
import path from 'path'
import { onMounted, reactive, ref, unref } from 'vue'

const { t } = useI18n()

// const sysInfo = ref<SysInfo>({ osArch: '', osType: '', osVersion: '' })
const userDataPath = ref('')
const fileName = ref('')
const mirrorUrlIndex = ref(0)
const downLoadSuccess = ref(false)
const downLoadSuccessNotify = ref(true)
const downLoadErrorNotify = ref(true)
const checkCorePathSuccess = ref(false)
const form = reactive({
  corePath: '',
  coreVersion: '',
  logPath: '',
  appVersion: '',
  appLogLevel: ''
})

const verSelect = ref<string>('2.0.3')
const verOptions = [
  {
    value: '2.1.0',
    label: '2.1.0'
  },
  {
    value: '2.1.1',
    label: '2.1.1'
  },
  {
    value: '2.1.2',
    label: '2.1.2'
  },
  {
    value: '2.1.3',
    label: '2.1.3'
  },
  {
    value: '2.2.0',
    label: '2.2.0'
  },
  {
    value: '2.0.3',
    label: '2.0.3'
  },
  {
    value: '1.2.3',
    label: '1.2.3'
  }
]
const mirrorUrlSelect = ref<string>('')

// const getDownloadUrl = async () => {
//   const response = await getGithubVer()
//   log.log('response', response)
//   const winUrlTemplate = _.template(coreUrl)
//   const downUrl = winUrlTemplate({
//     osType: sysInfo.value.osType,
//     osArch: sysInfo.value.osArch,
//     version: res.tag_name
//   })
//   log.log('下载URL:', downUrl)
//   return downUrl
// }
const downLoadCore = async () => {
  await downloadFile(
    'https://sw.pcmgr.qq.com/c2090d9ff413c5a0739f9169ae20b76e/67498952/spcmgr/download/WeChatSetup_3.9.12.17.exe',
    (fileUrl, progress) => {
      console.log(`Download progress: ${progress}%`)
    }
  )
  // ElNotification({
  //   title: '下载中',
  //   message: `开始使用加速源[${mirrorUrlIndex.value + 1}]下载`,
  //   type: 'info',
  //   duration: 8000
  // })
  // downLoadSuccessNotify.value = true
  // downLoadErrorNotify.value = true
  // await downloadEasyTier(fileName.value, GITHUB_MIRROR_URL[mirrorUrlIndex.value].value)
}
const installCore = async () => {
  // const res = await extractZip(fileName.value, BIN_PATH)
  // if (res) {
  //   ElNotification({
  //     title: t('common.reminder'),
  //     message: t('common.accessSuccess'),
  //     type: 'success'
  //   })
  //   return
  // }
  // ElNotification({
  //   title: t('common.reminder'),
  //   message: t('error.networkError'),
  //   type: 'error'
  // })
}
const verSelectChange = (val: string) => {
  // const winUrlTemplate = template(EASYTIER_NAME)
  // fileName.value = winUrlTemplate({
  //   osType: sysInfo.value.osType,
  //   osArch: sysInfo.value.osArch,
  //   version: 'v' + val
  // })
}
const checkCorePath = async () => {
  // const ver = await execCli('-V')
  // if (ver && ver !== 403) {
  //   form.coreVersion = ver
  //   checkCorePathSuccess.value = true
  // } else {
  //   form.coreVersion = ''
  //   checkCorePathSuccess.value = false
  //   ElNotification({
  //     title: t('common.reminder'),
  //     message: t('easytier.coreEror'),
  //     type: 'error',
  //     duration: 4000
  //   })
  // }
}
const copyCorePath = async () => {
  // 拷贝
  const { copy, copied, isSupported } = useClipboard({
    source: path.join(userDataPath.value, BIN_PATH),
    legacy: true
  })
  if (!isSupported) {
    ElMessage.error(t('setting.copyFailed'))
  } else {
    await copy()
    if (unref(copied)) {
      ElMessage.success(t('setting.copySuccess'))
    }
  }
}
const openCorePath = async () => {
  // const { shell } = require('electron')
  // await shell.openPath(path.join(userDataPath.value))
}
const copyLogPath = async () => {
  // 拷贝
  const { copy, copied, isSupported } = useClipboard({
    source: path.join(userDataPath.value, LOG_PATH),
    legacy: true
  })
  if (!isSupported) {
    ElMessage.error(t('setting.copyFailed'))
  } else {
    await copy()
    if (unref(copied)) {
      ElMessage.success(t('setting.copySuccess'))
    }
  }
}
const openLogPath = async () => {
  // const { shell } = require('electron')
  // await shell.openPath(path.join(userDataPath.value, LOG_PATH))
}
const openInBrowser = (url: string) => {
  // shell.openExternal(url)
}
const checkUpdate = async () => {
  // ElNotification({
  //   title: t('common.reminder'),
  //   message: '更新功能还有待测试，如果失败请到Github下载最新',
  //   type: 'warning',
  //   duration: 4000
  // })
  // await checkForUpdatesAndNotify()
}
const changeAppLogLevel = async () => {
  // await setLogLevel(form.appLogLevel)
}
onMounted(async () => {
  // sysInfo.value = await getSysInfo()
  // userDataPath.value = await getUserDataPath()
  // const ver = await execCli('-V')
  // if (ver && ver !== 403) {
  //   form.coreVersion = ver
  // }
  // form.corePath = path.join(userDataPath.value, BIN_PATH)
  // form.logPath = path.join(userDataPath.value, LOG_PATH)
  // form.appVersion = await getVersion()
  // form.appLogLevel = await getLogLevel()
  // const winUrlTemplate = template(EASYTIER_NAME)
  // // easytier-windows-x86_64-v2.0.3.zip
  // // easytier-win32-x64-v2.0.3.zip
  // fileName.value = winUrlTemplate({
  //   osType: sysInfo.value.osType,
  //   osArch: sysInfo.value.osArch,
  //   version: 'v' + verSelect.value
  // })
  // ipcRenderer.on('download-complete', () => {
  //   mirrorUrlIndex.value = 0
  //   downLoadSuccess.value = true
  //   if (downLoadSuccessNotify.value) {
  //     ElNotification({
  //       title: t('common.reminder'),
  //       message: t('easytier.downLoadSuccess'),
  //       type: 'success'
  //     })
  //   }
  //   downLoadSuccessNotify.value = false
  // })
  // ipcRenderer.on('download-error', async () => {
  //   if (mirrorUrlIndex.value <= GITHUB_MIRROR_URL.length) {
  //     mirrorUrlIndex.value += 1
  //     await downLoadCore()
  //     return
  //   }
  //   if (downLoadErrorNotify.value) {
  //     ElNotification({
  //       title: t('common.reminder'),
  //       message: t('easytier.downLoadError'),
  //       type: 'error'
  //     })
  //   }
  //   downLoadErrorNotify.value = false
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
    <ContentWrap class="flex-[3] ml-10px" :title="t('common.setting')">
      <el-descriptions class="margin-top" :column="1" border>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="ci:info" style="color: #8c8c8c" />
              {{ t('easytier.coreVersion') }}
            </div>
          </template>
          {{
            form.coreVersion
              ? form.coreVersion
              : '内核不存在!!!  &nbsp;&nbsp;请下载安装内核，然后检测内核是否存在'
          }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="heroicons:folder-solid" style="color: #8c8c8c" />
              {{ t('easytier.corePath') }}
            </div>
          </template>
          {{ form.corePath }}
          <Icon v-if="checkCorePathSuccess" icon="lets-icons:check-fill" style="color: #00bd16" />
          <br />
          <el-button type="warning" @click="checkCorePath"
            >{{ t('easytier.checkCorePath') }}
          </el-button>
          <el-button type="primary" @click="openCorePath"
            >{{ t('easytier.openCorePath') }}
          </el-button>
          <el-button type="info" @click="copyCorePath">{{ t('easytier.copyCorePath') }}</el-button>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="lsicon:download-outline" />
              {{ t('easytier.downLoadCore') }}
            </div>
          </template>
          1.选择版本时可以手动输入，对应官方内核仓库的版本，例如：2.0.3<br />
          2.Github加速链接为空默认随机加速链接，下载视网络情况而定，一般30秒以内<br />
          3.下载完后点击安装，安装成功后检测内核是否存在<br />
          版本
          <el-select
            v-model="verSelect"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="选择版本"
            style="width: 120px"
            @change="verSelectChange"
          >
            <el-option
              v-for="item in verOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          &emsp;Github加速链接
          <el-input
            type="text"
            placeholder="例如:https://ghproxy.cn"
            v-model="mirrorUrlSelect"
            style="width: 45%; margin-left: 2px"
            clearable
          />
          <br />
          <el-button class="mt-2" type="primary" @click="downLoadCore"
            >{{ t('easytier.rx_bytes') }}
          </el-button>
          <el-button class="mt-2" type="primary" @click="installCore"
            >{{ t('easytier.installCore') }}
          </el-button>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="icon-park-solid:log" />
              {{ t('easytier.logPath') }}
            </div>
          </template>
          {{ form.logPath }}<br />
          <el-button type="primary" @click="openLogPath">{{ t('easytier.openLogPath') }}</el-button>
          <el-button type="info" @click="copyLogPath">{{ t('easytier.copyLogPath') }}</el-button>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="icon-park-solid:log" />
              {{ t('easytier.appLogLevel') }}
            </div>
          </template>
          <el-select v-model="form.appLogLevel" style="width: 100px">
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warn" />
            <el-option label="调试" value="debug" />
            <el-option label="错误" value="error" />
            <el-option label="关闭" :value="false" />
          </el-select>
          <el-button type="primary" @click="changeAppLogLevel" class="ml-3"
            >{{ t('formDemo.change') }}
          </el-button>
          当软件重启时会恢复默认
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="skill-icons:github-light" />
              {{ t('easytier.github') }}
            </div>
          </template>
          {{ t('easytier.githubManage') }} :
          <el-text
            type="primary"
            @click="openInBrowser('https://github.com/xlc520/easytier-manager')"
            >https://github.com/xlc520/easytier-manager
          </el-text>
          <br />
          {{ t('easytier.githubCore') }} :
          <el-text type="primary" @click="openInBrowser('https://github.com/EasyTier/EasyTier')">
            https://github.com/EasyTier/EasyTier
          </el-text>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="uil:info-circle" />
              {{ t('easytier.appVersion') }}
            </div>
          </template>
          {{ form.appVersion }}
          <el-button class="ml-5" type="info" @click="checkUpdate"
            >{{ t('easytier.checkUpdate') }}
          </el-button>
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>
  </div>
</template>

<style scoped lang="less">
.cell-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
