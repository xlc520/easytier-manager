<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import Form from './components/Form.vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { BIN_PATH, CONFIG_PATH, LOG_PATH } from '@/constants/easytier'
import * as toml from 'smol-toml'
import { useEasyTierStore } from '@/store/modules/easytier'
import log from '@/utils/logger'
import path from 'path'
import MonacoEditor from '@/components/monaco-editor'
import { execCli, installService, uninstallService } from '@/utils/execUtil'
import defaultData from './components/defaultData'
import DefaultData from './components/defaultData'
import {
  deleteFile,
  getFilesByExtension,
  getUserDataPath,
  readFile,
  writeFile
} from '@/utils/fileUtil'
import { cloneDeep } from 'lodash-es'

const { t } = useI18n()
const easyTierStore = useEasyTierStore()
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref()
const MonacoEditRef = ref<InstanceType<typeof MonacoEditor>>()
const dataConfig = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const actionType = ref('')
const editType = ref('')
const saveLoading = ref(false)
const formRef = ref()
const formData = ref<FormData>(cloneDeep(DefaultData.defaultFormData))
const configFileName = ref('')
const getConfigList = async () => {
  const fileList = await getFilesByExtension('config', '.toml')
  easyTierStore.setFileList(fileList)
  let tmpList: any = []
  let tmpList2: any = []
  fileList.forEach((f: string) => {
    const fileName = f.replace('.toml', '')
    tmpList.push({ configFileName: fileName })
    tmpList2.push(fileName)
  })
  easyTierStore.setConfigList(tmpList)
  easyTierStore.setFileListNoSuffix(tmpList2)
  tableData.value = tmpList
  return tmpList
}

const readFileData = async (fileName: string) => {
  dataConfig.value = await readFile(fileName)
}

const edit = async (row: any) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = ''
  await readFileData(CONFIG_PATH + '/' + row?.configFileName + '.toml')
  configFileName.value = row?.configFileName
  dialogVisible.value = true
}

const editForm = async (row: any) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = 'form'
  await readFileData(CONFIG_PATH + '/' + row.configFileName + '.toml')
  let parse = Object.assign({}, formData.value, toml.parse(dataConfig.value))
  formData.value = parse as FormData
  configFileName.value = row?.configFileName
  dialogVisible.value = true
}

const AddAction = () => {
  dialogTitle.value = t('easytier.addNetConfig')
  actionType.value = 'add'
  configFileName.value = ''
  editType.value = ''
  dataConfig.value = ''
  dialogVisible.value = true
}
const AddFormAction = () => {
  dialogTitle.value = t('easytier.addNetConfigForm')
  formData.value = cloneDeep(DefaultData.defaultFormData)
  configFileName.value = ''
  actionType.value = 'add'
  editType.value = 'form'
  dialogVisible.value = true
}
const refreshAction = async () => {
  await getConfigList()
}
const addConfigAction = async () => {
  // todo 如果已经存在文件名则提示
  if (!configFileName.value) {
    await ElMessageBox.alert('请指定配置名称(配置文件名)', { type: 'error' })
    return
  }
  if (editType.value === 'form') {
    // 验证必填 formRef
    if (!(await formRef.value.validateForm())) {
      return
    }
    saveLoading.value = true
    try {
      formData.value.file_logger.dir = path.join(await getUserDataPath(), LOG_PATH)
      formData.value.file_logger.file = configFileName.value
      if (
        formData.value.proxy_network?.length === 0 ||
        formData.value.proxy_network![0].cidr === undefined
      ) {
        formData.value.proxy_network = undefined
      }
      if (formData.value.peer?.length === 0 || formData.value.peer![0].uri === undefined) {
        formData.value.peer = undefined
      }
      if (formData.value.console_logger?.level === undefined) {
        formData.value.console_logger = undefined
      }
      await writeFile(
        CONFIG_PATH + '/' + configFileName.value + '.toml',
        toml.stringify(formData.value)
      )
      ElMessage.success(t('common.accessSuccess'))
    } catch (error) {
      log.log('表单新增报错：' + error)
      ElMessage.error('表单新增报错')
    } finally {
      configFileName.value = ''
      saveLoading.value = false
      dialogVisible.value = false
    }
  } else {
    try {
      saveLoading.value = true
      // @ts-ignore
      // @ts-nocheck
      const parseValue: EasyTierConfig = toml.parse(dataConfig.value)
      parseValue.file_logger.dir = path.join(await getUserDataPath(), LOG_PATH)
      parseValue.file_logger.file = configFileName.value
      await writeFile(
        CONFIG_PATH + '/' + configFileName.value + '.toml',
        toml.stringify(parseValue)
      )
      ElMessage.success(t('common.accessSuccess'))
    } catch (error) {
      log.error('Error writing file:', error)
    } finally {
      configFileName.value = ''
      saveLoading.value = false
      dialogVisible.value = false
    }
  }
  await getConfigList()
}
const saveConfigAction = async () => {
  // todo 如果已经存在文件名则提示
  if (!configFileName.value) {
    await ElMessageBox.alert('请指定配置名称(配置文件名)', { type: 'error' })
    return
  }
  if (editType.value === 'form') {
    // 验证必填 formRef
    if (!(await formRef.value.validateForm())) {
      return
    }
    if (formData.value) {
      saveLoading.value = true
      try {
        formData.value.file_logger.dir = path.join(await getUserDataPath(), LOG_PATH)
        formData.value.file_logger.file = configFileName.value
        if (
          formData.value.proxy_network?.length === 0 ||
          formData.value.proxy_network![0].cidr === undefined
        ) {
          formData.value.proxy_network = undefined
        }
        if (formData.value.peer?.length === 0 || formData.value.peer![0].uri === undefined) {
          formData.value.peer = undefined
        }
        if (formData.value.console_logger?.level === undefined) {
          formData.value.console_logger = undefined
        }
        await writeFile(
          CONFIG_PATH + '/' + configFileName.value + '.toml',
          toml.stringify(formData.value)
        )
        ElMessage.success(t('common.accessSuccess'))
      } catch (error) {
        log.log('表单保存报错：' + error)
        ElMessage.error('表单保存报错')
      } finally {
        configFileName.value = ''
        saveLoading.value = false
        dialogVisible.value = false
      }
    }
  } else {
    // @ts-ignore
    // @ts-nocheck
    const parseValue: EasyTierConfig = toml.parse(dataConfig.value)
    parseValue.file_logger.dir = path.join(await getUserDataPath(), LOG_PATH)
    parseValue.file_logger.file = configFileName.value
    await writeFile(CONFIG_PATH + '/' + configFileName.value + '.toml', toml.stringify(parseValue))
    ElMessage.success(t('common.accessSuccess'))
    configFileName.value = ''
    dialogVisible.value = false
  }
  await getConfigList()
}
const delConfig = async (row?: any) => {
  ElMessageBox.confirm(t('common.delMessage'), t('common.delWarning'), {
    confirmButtonText: t('common.delOk'),
    cancelButtonText: t('common.delCancel'),
    type: 'warning'
  })
    .then(async () => {
      log.log('删除', row)
      await deleteFile(CONFIG_PATH + '/' + row?.configFileName + '.toml')
      ElMessage.success(t('common.delSuccess'))
    })
    .finally(async () => {
      await getConfigList()
    })
}

const installServiceHandle = async (row: any) => {
  ElMessageBox.confirm(t('easytier.installServiceMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    const res = await execCli('peer')
    if (res === 403) {
      ElNotification({
        title: t('common.reminder'),
        message:
          'easytier-core 或 easytier-cli 不存在或无可执行权限，请到设置页下载安装，或授予可执行权限',
        type: 'error',
        duration: 8000
      })
      return
    }
    const binPath = path.join(await getUserDataPath(), BIN_PATH, 'easytier-core')
    const configPath = path.join(await getUserDataPath(), CONFIG_PATH, row.configFileName + '.toml')
    await installService('easytier-' + row.configFileName, binPath, configPath)
    ElMessage.success(t('common.accessSuccess'))
  })
}

const uninstallServiceHandle = async (row: any) => {
  ElMessageBox.confirm(t('easytier.uninstallServiceMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    await uninstallService('easytier-' + row.configFileName)
    ElMessage.success(t('common.accessSuccess'))
  })
}
const startServiceHandle = async (row: any) => {
  startServiceHandle('easytier-' + row.configFileName)
    .then((res: any) => {
      if (res) {
        ElNotification({
          title: t('common.reminder'),
          message: '运行成功',
          type: 'success',
          duration: 2000
        })
        return
      }
      ElNotification({
        title: t('common.reminder'),
        message: '运行失败，未安装服务/配置文件错误/内核不存在',
        type: 'error',
        duration: 8000
      })
    })
    .catch(() => {
      ElNotification({
        title: t('common.reminder'),
        message: '运行失败，未安装服务/配置文件错误/内核不存在',
        type: 'error',
        duration: 8000
      })
    })
}
const stopServiceHandle = async (row: any) => {
  stopServiceHandle('easytier-' + row.configFileName)
    .then((res: any) => {
      if (res) {
        ElNotification({
          title: t('common.reminder'),
          message: '停止成功',
          type: 'success',
          duration: 2000
        })
        return
      }
      ElNotification({
        title: t('common.reminder'),
        message: '停止失败，请查看管理器日志',
        type: 'error',
        duration: 8000
      })
    })
    .catch(() => {
      ElNotification({
        title: t('common.reminder'),
        message: '停止失败，请查看管理器日志',
        type: 'error',
        duration: 8000
      })
    })
}
onMounted(async () => {
  await getConfigList()
  easyTierStore.setDefaultFormData(defaultData.defaultFormData)
})
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-[3] ml-10px">
      <div class="mb-10px">
        <BaseButton type="primary" @click="AddAction">{{ t('easytier.addNetConfig') }}</BaseButton>
        <BaseButton type="primary" @click="AddFormAction"
          >{{ t('easytier.addNetConfigForm') }}
        </BaseButton>
        <BaseButton type="success" @click="refreshAction"
          >{{ t('easytier.reloadNetConfig') }}
        </BaseButton>
      </div>
      <el-table
        :data="tableData"
        height="55vh"
        table-layout="fixed"
        empty-text="No Data"
        border
        stripe
      >
        <el-table-column
          type="index"
          label="序号"
          :index="1"
          width="70"
          header-align="center"
          align="center"
        />
        <el-table-column
          prop="configFileName"
          label="网络名称"
          header-align="center"
          align="center"
          show-overflow-tooltip
          sortable
        />
        <el-table-column label="操作" width="280" header-align="center" align="center">
          <template #default="{ row }">
            <BaseButton type="primary" size="small" @click="edit(row)">
              {{ t('easytier.editNetConfig') }}
            </BaseButton>
            <BaseButton type="primary" size="small" @click="editForm(row)">
              {{ t('easytier.editNetConfigForm') }}
            </BaseButton>
            <BaseButton type="danger" size="small" @click="delConfig(row)">
              {{ t('exampleDemo.del') }}
            </BaseButton>
          </template>
        </el-table-column>
        <el-table-column label="服务操作" width="240" header-align="center" align="center">
          <template #default="{ row }">
            <el-row justify="center" class="mb-1">
              <BaseButton type="success" size="small" @click="startServiceHandle(row)">
                {{ t('easytier.startService') }}
              </BaseButton>
              <BaseButton type="warning" size="small" @click="stopServiceHandle(row)">
                {{ t('easytier.stopService') }}
              </BaseButton>
            </el-row>
            <el-row justify="center">
              <BaseButton type="primary" size="small" @click="installServiceHandle(row)">
                {{ t('easytier.installService') }}
              </BaseButton>
              <BaseButton type="danger" size="small" @click="uninstallServiceHandle(row)">
                {{ t('easytier.uninstallService') }}
              </BaseButton>
            </el-row>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-3">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 40, 50, 100]"
          :background="false"
          layout="sizes, prev, pager, next, jumper, ->, total"
          :total="total"
        />
      </div>
      <!--<Table
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :columns="allSchemas.tableColumns"
        :data="dataList"
        :loading="loading"
        @register="tableRegister"
        :pagination="{
          total
        }"
      />-->
    </ContentWrap>

    <Dialog v-model="dialogVisible" :title="dialogTitle" maxHeight="68vh">
      <div style="display: inline; text-align: center; justify-content: center">
        <el-form-item label="配置名称" prop="configFileName" class="ml-20 mr-10">
          <el-tooltip content="将作为配置文件名、服务名，最好使用字母、数字、-、_" placement="top">
            <Icon icon="memory:tooltip-start-alert" />
          </el-tooltip>
          <el-input v-model="configFileName" type="text" style="width: 80%" clearable />
        </el-form-item>
      </div>
      <Form v-if="editType === 'form'" :form-data="formData" ref="formRef" />
      <div class="edit-container h-60vh" v-if="editType !== 'form'">
        <MonacoEditor
          ref="MonacoEditRef"
          v-model="dataConfig"
          language="toml"
          :languageSelector="false"
          :themeSelector="false"
        />
      </div>
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
        <BaseButton @click="dialogVisible = false">{{ t('dialogDemo.close') }}</BaseButton>
      </template>
    </Dialog>
  </div>
</template>
<style lang="less">
.@{elNamespace}-dialog {
  --el-dialog-width: 70%;
}

.el-table__header {
  width: 100% !important;
  text-align: center;
}
</style>
