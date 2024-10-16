<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, reactive, ref, unref } from 'vue'
import { ElMessage } from 'element-plus'
import _ from 'lodash'
import { exeExist, getSysInfo } from '@/utils/execUtil'
import { coreUrl } from '@/constants/easytier'
// import { getGithubVer } from '@/api/easytier'
import { getUserDataPath } from '@/utils/fileUtil'
import path from 'path'
import { CircleCheck, Download, Folder } from '@element-plus/icons-vue'
import { useClipboard } from '@vueuse/core'

const { t } = useI18n()

interface SysInfo {
  osType: string
  osArch: string
  osVersion: string
}

const sysInfo = ref<SysInfo>({ osArch: '', osType: '', osVersion: '' })
const userDataPath = ref('')
const checkCorePathSuccess = ref(false)
const form = reactive({
  corePath: ''
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
    value: '1.2.3',
    label: '1.2.3'
  }
]

// const getDownloadUrl = async () => {
//   const response = await getGithubVer()
//   console.log('response', response)
//   // const winUrlTemplate = _.template(coreUrl)
//   // const downUrl = winUrlTemplate({
//   //   osType: sysInfo.value.osType,
//   //   osArch: sysInfo.value.osArch,
//   //   version: res.tag_name
//   // })
//   // console.log('下载URL:', downUrl)
//   // return downUrl
// }
const downLoadCore = async () => {
  // const url = getDownloadUrl()
  // 尝试官方链接
  const winUrlTemplate = _.template(coreUrl)
  // easytier-windows-x86_64-v2.0.3.zip
  // easytier-win32-x64-v2.0.3.zip
  const downUrl = winUrlTemplate({
    osType: sysInfo.value.osType,
    osArch: sysInfo.value.osArch,
    version: 'v' + verSelect.value
  })
  console.log('下载URL:', downUrl)
  // 尝试加速链接
}
const checkCorePath = async () => {
  const exist = await exeExist(form.corePath + ' -V')
  if (exist) {
    checkCorePathSuccess.value = true
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
onMounted(async () => {
  sysInfo.value = await getSysInfo()
  userDataPath.value = await getUserDataPath()
  form.corePath = path.join(userDataPath.value, 'bin', 'easytier-core')
})
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-[3] ml-10px" :title="t('common.setting')">
      <el-descriptions class="margin-top" :column="1" border>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon size="16px">
                <Folder />
              </el-icon>
              {{ t('easytier.corePath') }}
            </div>
          </template>
          {{ form.corePath }}
          <el-icon v-if="checkCorePathSuccess" color="#67C23A" size="16px">
            <CircleCheck />
          </el-icon>
          <el-button class="ml-5" type="primary" @click="checkCorePath"
            >{{ t('easytier.checkCorePath') }}
          </el-button>
          <el-button type="info" @click="copyCorePath">{{ t('easytier.copyCorePath') }}</el-button>
        </el-descriptions-item>

        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon size="16px">
                <Download />
              </el-icon>
              {{ t('easytier.downLoadCore') }}
            </div>
          </template>
          请先检测内核是否已存在再下载，选择版本时可以手动输入
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
          <el-button class="ml-5" type="primary" @click="downLoadCore"
            >{{ t('easytier.rx_bytes') }}
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
  justify-content: space-between;
}
</style>
