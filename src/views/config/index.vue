<script setup lang="tsx">
import { BaseButton } from '@/components/Button'
import { CodeEditor } from '@/components/CodeEditor'
import { ContentWrap } from '@/components/ContentWrap'
import { Dialog } from '@/components/Dialog'
import { CONFIG_PATH } from '@/constants/easytier'
import { useI18n } from '@/hooks/web/useI18n'
import { useEasyTierStore } from '@/store/modules/easytier'
import {
  deleteFileOrDir,
  getLogsDir,
  listTomlFiles,
  readFileContent,
  writeFileContent
} from '@/utils/fileUtil'
import { ElMessageBox, ElNotification } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import * as toml from 'smol-toml'
import { onMounted, ref } from 'vue'
import DefaultData from './components/defaultData'
import Form from './components/Form.vue'

const { t } = useI18n()
const easyTierStore = useEasyTierStore()
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dataConfig = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const actionType = ref('')
const editType = ref('')
const saveLoading = ref(false)
const formRef = ref()
const formData = ref<FormData>(cloneDeep(DefaultData.defaultFormData))
const configFileName = ref('')
const errorMessage = ref('')
const logsDir = ref('')
const getConfigList = async () => {
  const fileList = await listTomlFiles()
  const tmpList: any = []
  for (const f of fileList) {
    const configName = f.replace('.toml', '')
    tmpList.push({ configFileName: configName, fileName: f })
  }
  easyTierStore.setConfigList(tmpList)
  return tmpList
}
// const serviceStatusDict = (status: string) => {
//   if (!status) {
//     return '未安装'
//   }
//   switch (status) {
//     case 'SERVICE_STOPPED':
//       return '停止'
//     case 'SERVICE_RUNNING':
//       return '运行中'
//     case 'uninstalled':
//       return '未安装'
//     default:
//       return '停止'
//   }
// }
const readFileData = async (fileName: string) => {
  dataConfig.value = (await readFileContent(CONFIG_PATH + '/' + fileName)) as string
}

const edit = async (row: any) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = ''
  await readFileData(row.fileName)
  configFileName.value = row?.configFileName
  dialogVisible.value = true
}

const editForm = async (row: any) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = 'form'
  await readFileData(row.fileName)
  const parse = Object.assign({}, formData.value, toml.parse(dataConfig.value))
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
const checkConfigFileName = async () => {
  const findItem = easyTierStore.configList.find(
    (item) => item.configFileName === configFileName.value
  )
  if (findItem) {
    errorMessage.value = '配置文件名已存在'
    return true
  }
  errorMessage.value = ''
  return false
}
const configFileNameChange = async () => {
  formData.value.file_logger.file = configFileName.value
}
const addConfigAction = async () => {
  if (await checkConfigFileName()) {
    await ElMessageBox.alert('配置文件名已存在', { type: 'error' })
    return
  }
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
      formData.value.file_logger.dir = formData.value.file_logger.dir
        ? formData.value.file_logger.dir
        : logsDir.value
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
      await writeFileContent(
        CONFIG_PATH + '/' + configFileName.value + '.toml',
        toml.stringify(formData.value)
      )
      ElNotification({
        title: t('common.reminder'),
        message: t('common.accessSuccess'),
        type: 'success',
        duration: 2000
      })
    } catch (error) {
      console.log('表单新增报错：' + error)
      ElNotification({
        title: t('common.reminder'),
        message: '表单新增报错',
        type: 'error',
        duration: 2000
      })
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
      let parseValue: EasyTierConfig = toml.parse(dataConfig.value)
      parseValue = {
        ...parseValue,
        file_logger: {
          level: parseValue.file_logger?.level ? parseValue.file_logger?.level : 'error',
          dir: parseValue.file_logger?.dir ? parseValue.file_logger?.dir : logsDir.value,
          file: configFileName.value
        }
      }
      await writeFileContent(CONFIG_PATH + '/' + configFileName.value + '.toml', dataConfig.value)
      ElNotification({
        title: t('common.reminder'),
        message: t('common.accessSuccess'),
        type: 'success',
        duration: 2000
      })
    } catch (error: any) {
      console.error('Error writing file:', error)
      ElNotification({
        title: t('common.reminder'),
        message: error.message,
        type: 'error',
        duration: 5000
      })
    } finally {
      configFileName.value = ''
      saveLoading.value = false
      dialogVisible.value = false
    }
  }
  await getConfigList()
}
const saveConfigAction = async () => {
  if (editType.value === 'form') {
    // 验证必填 formRef
    if (!(await formRef.value.validateForm())) {
      return
    }
    if (formData.value) {
      saveLoading.value = true
      try {
        formData.value.file_logger.dir = formData.value.file_logger.dir
          ? formData.value.file_logger.dir
          : logsDir.value
        formData.value.file_logger.file = configFileName.value
        if (
          !formData.value.proxy_network ||
          formData.value.proxy_network?.length === 0 ||
          formData.value.proxy_network![0].cidr === undefined
        ) {
          formData.value.proxy_network = undefined
        }
        if (
          !formData.value.peer ||
          formData.value.peer?.length === 0 ||
          formData.value.peer![0].uri === undefined
        ) {
          formData.value.peer = undefined
        }
        if (!formData.value.console_logger || formData.value.console_logger?.level === undefined) {
          formData.value.console_logger = undefined
        }
        await writeFileContent(
          CONFIG_PATH + '/' + configFileName.value + '.toml',
          toml.stringify(formData.value)
        )
        ElNotification({
          title: t('common.reminder'),
          message: t('common.accessSuccess'),
          type: 'success',
          duration: 2000
        })
      } catch (error) {
        console.log('表单保存报错：' + error)
        ElNotification({
          title: t('common.reminder'),
          message: '表单保存报错',
          type: 'success',
          duration: 2000
        })
      } finally {
        configFileName.value = ''
        saveLoading.value = false
        dialogVisible.value = false
      }
    }
  } else {
    try {
      // @ts-ignore
      // @ts-nocheck
      let parseValue: EasyTierConfig = toml.parse(dataConfig.value)
      parseValue = {
        ...parseValue,
        file_logger: {
          level: parseValue.file_logger?.level ? parseValue.file_logger?.level : 'error',
          dir: parseValue.file_logger?.dir ? parseValue.file_logger?.dir : logsDir.value,
          file: configFileName.value
        }
      }
      await writeFileContent(CONFIG_PATH + '/' + configFileName.value + '.toml', dataConfig.value)
      configFileName.value = ''
      dialogVisible.value = false
      ElNotification({
        title: t('common.reminder'),
        message: t('common.accessSuccess'),
        type: 'success',
        duration: 2000
      })
    } catch (error: any) {
      console.error('Error writing file:', error.message)
      ElNotification({
        title: t('common.reminder'),
        message: error.message,
        type: 'error',
        duration: 5000
      })
    }
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
      // todo log.log('删除服务', row)
      // await uninstallService(prefixSvc + row?.configFileName)
      await deleteFileOrDir(CONFIG_PATH + '/' + row?.fileName)
      ElNotification({
        title: t('common.reminder'),
        message: t('common.delSuccess'),
        type: 'success',
        duration: 2000
      })
    })
    .catch(async () => {
      ElNotification({
        title: t('common.reminder'),
        message: t('common.delError'),
        type: 'error',
        duration: 2000
      })
    })
    .finally(async () => {
      await getConfigList()
    })
}
// const installServiceHandle = async (row: any) => {
//   ElMessageBox.confirm(t('easytier.installServiceMessage'), t('common.reminder'), {
//     confirmButtonText: t('common.ok'),
//     cancelButtonText: t('common.cancel'),
//     type: 'warning'
//   }).then(async () => {
//     // const res = await execCli('peer')
//     // if (res === 403) {
//     //   ElNotification({
//     //     title: t('common.reminder'),
//     //     message:
//     //       'easytier-core 或 easytier-cli 不存在或无可执行权限，请到设置页下载安装，或授予可执行权限',
//     //     type: 'error',
//     //     duration: 8000
//     //   })
//     //   return
//     // }
//     // const binPath = path.join(await getUserDataPath(), BIN_PATH, 'easytier-core')
//     // const configPath = path.join(await getUserDataPath(), CONFIG_PATH, row.configFileName + '.toml')
//     // installService(prefixSvc + row.configFileName, binPath, configPath)
//     //   .then((res) => {
//     //     log.info('res', res)
//     //     if (res) {
//     //       ElNotification({
//     //         title: t('common.reminder'),
//     //         message: '服务安装成功',
//     //         type: 'success',
//     //         duration: 3000
//     //       })
//     //     }
//     //   })
//     //   .finally(() => {
//     //     getConfigList()
//     //   })
//   })
// }

// const uninstallServiceHandle = async (row: any) => {
//   ElMessageBox.confirm(t('easytier.uninstallServiceMessage'), t('common.reminder'), {
//     confirmButtonText: t('common.ok'),
//     cancelButtonText: t('common.cancel'),
//     type: 'warning'
//   })
//     .then(async () => {
//       // await uninstallService(prefixSvc + row.configFileName)
//       // ElNotification({
//       //   title: t('common.reminder'),
//       //   message: t('common.accessSuccess'),
//       //   type: 'success',
//       //   duration: 2000
//       // })
//     })
//     .finally(async () => await getConfigList())
// }
// const startServiceHandle = async (row: any) => {
//   // startServiceOnWindows(prefixSvc + row.configFileName)
//   //   .then((res: any) => {
//   //     if (res) {
//   //       ElNotification({
//   //         title: t('common.reminder'),
//   //         message: '服务运行成功',
//   //         type: 'success',
//   //         duration: 2000
//   //       })
//   //       return
//   //     }
//   //     ElNotification({
//   //       title: t('common.reminder'),
//   //       message: '运行失败，未安装服务/配置文件错误/内核不存在',
//   //       type: 'error',
//   //       duration: 8000
//   //     })
//   //   })
//   //   .catch(() => {
//   //     ElNotification({
//   //       title: t('common.reminder'),
//   //       message: '运行失败，未安装服务/配置文件错误/内核不存在',
//   //       type: 'error',
//   //       duration: 8000
//   //     })
//   //   })
//   //   .finally(async () => await getConfigList())
// }
// const stopServiceHandle = async (row: any) => {
//   // stopServiceOnWindows(prefixSvc + row.configFileName)
//   //   .then((res: any) => {
//   //     if (res) {
//   //       ElNotification({
//   //         title: t('common.reminder'),
//   //         message: '服务停止成功',
//   //         type: 'success',
//   //         duration: 2000
//   //       })
//   //       return
//   //     }
//   //     ElNotification({
//   //       title: t('common.reminder'),
//   //       message: '服务停止失败',
//   //       type: 'error',
//   //       duration: 3000
//   //     })
//   //   })
//   //   .catch((e) => {
//   //     ElNotification({
//   //       title: t('common.reminder'),
//   //       message: '服务停止失败 ' + e.message,
//   //       type: 'error',
//   //       duration: 8000
//   //     })
//   //   })
//   //   .finally(async () => await getConfigList())
// }
const testAction = async () => {
  // const name = easyTierStore.getLastRunConfigName()
  // console.log('name', name)
  // const fileName = await basename('data/config.toml')
  // console.log('fileName', fileName)
  // const fileName2 = await dirname('data/config.toml')
  // console.log('fileName2', fileName2)
  // await getPathVal()
  // await executeBack('easytier-core')
}
onMounted(async () => {
  await getConfigList()
  logsDir.value = await getLogsDir()
  // easyTierStore.setDefaultFormData(DefaultData.defaultFormData)
  // const sysInfo = await getSysInfo()
  // easyTierStore.setOs(sysInfo.osType)
  // await writeFileContent('config.json', '{"setting": "value"}')
  // // 从特定目录读取
  // const configContent = await readFileContent('config.json', {
  //   baseDir: BaseDirectory.AppConfig
  // })
  // console.log('configContent:', configContent)
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
        <!-- <BaseButton type="info" @click="testAction">测试 </BaseButton> -->
      </div>
      <el-table
        :data="easyTierStore.configList"
        height="60vh"
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
        <!-- 
        <el-table-column
          prop="serviceStatus"
          label="服务状态"
          header-align="center"
          align="center"
          show-overflow-tooltip
          sortable
        >
          <template #default="{ row }">
            <el-text v-if="row.serviceStatus === '运行中'" type="success" effect="dark">
              {{ row.serviceStatus }}
            </el-text>
            <el-text v-else-if="row.serviceStatus === '停止'" type="info" effect="dark">
              {{ row.serviceStatus }}
            </el-text>
            <el-text v-else>{{ row.serviceStatus }}</el-text>
          </template>
        </el-table-column>
        -->
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
        <!-- <el-table-column label="服务操作" width="240" header-align="center" align="center">
          <template #default="{ row }">
            <el-row justify="center" class="mb-1" v-if="easyTierStore.os === 'windows'">
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
        </el-table-column> -->
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
        <el-form-item
          label="配置名称"
          prop="configFileName"
          class="ml-20 mr-10"
          :validate-status="errorMessage ? 'error' : ''"
          :error="errorMessage"
        >
          <el-tooltip content="将作为配置文件名、服务名，最好使用字母、数字、-、_" placement="top">
            <Icon icon="memory:tooltip-start-alert" />
          </el-tooltip>
          <el-input
            v-model="configFileName"
            type="text"
            style="width: 80%"
            :disabled="actionType === 'edit'"
            @blur="checkConfigFileName"
            @change="configFileNameChange"
            clearable
          />
        </el-form-item>
      </div>
      <Form v-if="editType === 'form'" :form-data="formData" ref="formRef" />
      <div class="edit-container h-60vh" v-if="editType !== 'form'">
        <CodeEditor
          ref="MonacoEditRef"
          v-model="dataConfig"
          language="toml"
          :languageSelector="false"
          :themeSelector="false"
        />
      </div>
      <template #footer>
        <!-- <el-text v-if="editType === 'form'">请注意：如果使用表单编辑，会导致注释丢失 </el-text> -->
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
// .@{elNamespace}-dialog {
//   --el-dialog-width: 70%;
// }

.el-table__header {
  width: 100% !important;
  text-align: center;
}
</style>
