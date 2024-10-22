<script setup lang="tsx">
import path from 'path'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, reactive, ref, unref } from 'vue'
import { ElInput, ElMessage } from 'element-plus'
import { EASYTIER_NAME, GITHUB_MIRROR_URL } from '@/constants/easytier'
import { useClipboard } from '@vueuse/core'
import { execCli, getSysInfo, getVersion } from '@/utils/execUtil'
import { downloadEasyTier, extractZip, getUserDataPath } from '@/utils/fileUtil'
import { ipcRenderer } from 'electron'
import _ from 'lodash'
import log from '@/utils/logger'
// import { getGithubVer } from '@/api/easytier'

const { t } = useI18n()

const sysInfo = ref<SysInfo>({ osArch: '', osType: '', osVersion: '' })
const userDataPath = ref('')
const fileName = ref('')
const downLoadSuccess = ref(false)
const checkCorePathSuccess = ref(false)
const form = reactive({
  corePath: '',
  coreVersion: '',
  logPath: '',
  appVersion: ''
})

const verSelect = ref<string>('2.0.3')
const verOptions = [
  {
    value: '2.0.3',
    label: '2.0.3'
  },
  {
    value: '2.0.4',
    label: '2.0.4'
  },
  {
    value: '2.0.5',
    label: '2.0.5'
  },
  {
    value: '2.1.0',
    label: '2.1.0'
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
//   // const winUrlTemplate = _.template(coreUrl)
//   // const downUrl = winUrlTemplate({
//   //   osType: sysInfo.value.osType,
//   //   osArch: sysInfo.value.osArch,
//   //   version: res.tag_name
//   // })
//   // log.log('下载URL:', downUrl)
//   // return downUrl
// }
const downLoadCore = async () => {
  // ElMessage.info(t('easytier.startDownload'))
  // 尝试官方链接
  for (const mirror of GITHUB_MIRROR_URL) {
    if (downLoadSuccess.value) {
      return
    }
    ElMessage.info('开始使用加速源下载:' + mirror.value)
    await downloadEasyTier(fileName.value, mirror.value)
    if (mirror.value == GITHUB_MIRROR_URL[-1].value) {
      // 使用默认链接
      await downloadEasyTier(fileName.value, mirror.value)
        .then(() => {
          ElMessage.success('下载成功')
        })
        .catch(() => {
          log.error('所有加速都下载失败，请手动下载替换或者魔法！')
          ElMessage.error('所有加速都下载失败，请手动下载替换或者魔法！')
        })
    }
  }
}
const installCore = async () => {
  const res = await extractZip(fileName.value, 'bin')
  if (res) {
    ElMessage.success(t('common.accessSuccess'))
  }
  ElMessage.error(t('error.networkError'))
}
const checkCorePath = async () => {
  const ver = await execCli('-V')
  if (ver && ver !== 403) {
    form.coreVersion = ver
    checkCorePathSuccess.value = true
  } else {
    ElMessage.error({ message: t('easytier.coreEror'), duration: 4000 })
  }
}
const copyCorePath = async () => {
  // 拷贝
  const { copy, copied, isSupported } = useClipboard({
    source: path.join(userDataPath.value, 'bin'),
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
  const { shell } = require('electron')
  await shell.openPath(path.join(userDataPath.value))
}
const copyLogPath = async () => {
  // 拷贝
  const { copy, copied, isSupported } = useClipboard({
    source: path.join(userDataPath.value, 'log'),
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
  const { shell } = require('electron')
  await shell.openPath(path.join(userDataPath.value, 'log'))
}
onMounted(async () => {
  sysInfo.value = await getSysInfo()
  userDataPath.value = await getUserDataPath()
  const ver = await execCli('-V')
  if (ver && ver !== 403) {
    form.coreVersion = ver
  }
  form.corePath = path.join(userDataPath.value, 'bin')
  form.appVersion = await getVersion()
  const winUrlTemplate = _.template(EASYTIER_NAME)
  // easytier-windows-x86_64-v2.0.3.zip
  // easytier-win32-x64-v2.0.3.zip
  fileName.value = winUrlTemplate({
    osType: sysInfo.value.osType,
    osArch: sysInfo.value.osArch,
    version: 'v' + verSelect.value
  })
  ipcRenderer.on('download-complete', () => {
    downLoadSuccess.value = true
    ElMessage.success(t('easytier.downLoadSuccess'))
  })
  ipcRenderer.on('download-error', () => {
    ElMessage.error(t('easytier.downLoadError'))
  })
})
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-[3] ml-10px" :title="t('common.setting')">
      1.请先检测内核是否已存在再下载<br />
      2.下载完记得安装<br />
      <el-descriptions class="margin-top" :column="1" border>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="ci:info" style="color: #8c8c8c" />
              {{ t('easytier.coreVersion') }}
            </div>
          </template>
          {{ form.coreVersion }}
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
          1.选择版本时可以手动输入；<br />
          2.为空默认随机加速链接；<br />
          3.下载视网络情况而定，一般30秒以内；<br />
          4.下载完后点击安装，安装成功可检测内核是否存在<br />
          <el-select
            v-model="verSelect"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder="选择版本"
            style="width: 120px"
          >
            <el-option
              v-for="item in verOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            type="text"
            placeholder="Github加速链接,例如:https://ghproxy.cn"
            v-model="mirrorUrlSelect"
            style="width: 60%; margin-left: 3px"
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
          {{ form.logPath }}
          <el-button type="primary" @click="openLogPath">{{ t('easytier.openLogPath') }}</el-button>
          <el-button type="info" @click="copyLogPath">{{ t('easytier.copyLogPath') }}</el-button>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="skill-icons:github-light" />
              {{ t('easytier.github') }}
            </div>
          </template>
          {{ t('easytier.githubManage') }} :
          <el-link type="primary" target="_blank"
            >https://github.com/xlc520/easytier-manager
          </el-link>
          <br />
          {{ t('easytier.githubCore') }} :
          <el-link type="primary" target="_blank">https://github.com/EasyTier/EasyTier</el-link>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <Icon icon="uil:info-circle" />
              {{ t('easytier.appVersion') }}
            </div>
          </template>
          {{ form.appVersion }}
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
