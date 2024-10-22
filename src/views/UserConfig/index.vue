<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Form from './components/Form.vue'
import { Dialog } from '@/components/Dialog'
import { BaseButton } from '@/components/Button'
import { CONFIG_PATH } from '@/constants/easytier'
import * as toml from 'smol-toml'
import { useEasyTierStore } from '@/store/modules/easytier'
import log from '@/utils/logger'
import path from 'path'
import MonacoEditor from '@/components/monaco-editor'
import { installService, uninstallService } from '@/utils/execUtil'
import defaultData from './components/defaultData'
import {
  deleteFile,
  getFilesByExtension,
  getUserDataPath,
  readFile,
  writeFile
} from '@/utils/fileUtil'
import { cloneDeep, isObject, mapValues } from 'lodash-es'
import DefaultData from './components/defaultData'

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
const formData = ref<FormData>(cloneDeep(DefaultData.defaultFormData))
const getConfigList = async () => {
  const fileList = await getFilesByExtension('config', '.toml')
  easyTierStore.setFileList(fileList)
  let tmpList: any = []
  let tmpList2: any = []
  fileList.forEach((f: string) => {
    const fileName = f.replace('.toml', '')
    tmpList.push({ network_identity: { network_name: fileName } })
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

const edit = async (row) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = ''
  await readFileData(CONFIG_PATH + '/' + row.network_identity.network_name + '.toml')
  dialogVisible.value = true
}

const editForm = async (row) => {
  dialogTitle.value = t('exampleDemo.edit')
  actionType.value = 'edit'
  editType.value = 'form'
  await readFileData(CONFIG_PATH + '/' + row.network_identity.network_name + '.toml')
  let parse = Object.assign({}, formData.value, toml.parse(dataConfig.value))
  formData.value = parse as FormData
  dialogVisible.value = true
}

const AddAction = () => {
  dialogTitle.value = t('easytier.addNetConfig')
  actionType.value = 'add'
  editType.value = ''
  dataConfig.value = ''
  dialogVisible.value = true
}
const clearObjectValues = (obj) => {
  return mapValues(obj, (value) => {
    if (isObject(value)) {
      return clearObjectValues(value)
    } else {
      return undefined
    }
  })
}

const AddFormAction = () => {
  dialogTitle.value = t('easytier.addNetConfigForm')
  formData.value = cloneDeep(DefaultData.defaultFormData)
  actionType.value = 'add'
  editType.value = 'form'
  dialogVisible.value = true
}
const refreshAction = async () => {
  await getConfigList()
}
const addConfigAction = async () => {
  // todo 如果已经存在网络名则提示
  if (editType.value === 'form') {
    saveLoading.value = true
    try {
      let networkName = formData.value.network_identity?.network_name
      formData.value.file_logger.dir = path.join(await getUserDataPath(), 'log')
      formData.value.file_logger.file = networkName
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
      await writeFile(CONFIG_PATH + '/' + networkName + '.toml', toml.stringify(formData.value))
      ElMessage.success(t('common.accessSuccess'))
    } catch (error) {
      log.log('表单新增报错：' + error)
      ElMessage.error('表单新增报错')
    } finally {
      saveLoading.value = false
      dialogVisible.value = false
    }
  } else {
    try {
      saveLoading.value = true
      // @ts-ignore
      // @ts-nocheck
      const parseValue: EasyTierConfig = toml.parse(dataConfig.value)
      let networkName = parseValue.network_identity?.network_name
      parseValue.file_logger.dir = path.join(await getUserDataPath(), 'log')
      parseValue.file_logger.file = networkName
      await writeFile(CONFIG_PATH + '/' + networkName + '.toml', toml.stringify(parseValue))
      ElMessage.success(t('common.accessSuccess'))
    } catch (error) {
      log.error('Error writing file:', error)
    } finally {
      saveLoading.value = false
      dialogVisible.value = false
    }
  }
  await getConfigList()
}
const saveConfigAction = async () => {
  if (editType.value === 'form') {
    if (formData.value) {
      saveLoading.value = true
      try {
        let networkName = formData.value.network_identity?.network_name
        formData.value.file_logger.dir = path.join(await getUserDataPath(), 'log')
        formData.value.file_logger.file = networkName
        await writeFile(CONFIG_PATH + '/' + networkName + '.toml', toml.stringify(formData.value))
        ElMessage.success(t('common.accessSuccess'))
      } catch (error) {
        log.log('表单保存报错：' + error)
        ElMessage.error('表单保存报错')
      } finally {
        saveLoading.value = false
        dialogVisible.value = false
      }
    }
  } else {
    // @ts-ignore
    // @ts-nocheck
    const parseValue: EasyTierConfig = toml.parse(dataConfig.value)
    let networkName = parseValue.network_identity?.network_name
    parseValue.file_logger.dir = path.join(await getUserDataPath(), 'log')
    parseValue.file_logger.file = networkName
    await writeFile(CONFIG_PATH + '/' + networkName + '.toml', toml.stringify(parseValue))
    ElMessage.success(t('common.accessSuccess'))
    dialogVisible.value = false
  }
  await getConfigList()
}
const delConfig = async (row?) => {
  ElMessageBox.confirm(t('common.delMessage'), t('common.delWarning'), {
    confirmButtonText: t('common.delOk'),
    cancelButtonText: t('common.delCancel'),
    type: 'warning'
  })
    .then(async () => {
      log.log('删除', row)
      await deleteFile(CONFIG_PATH + '/' + row.network_identity?.network_name + '.toml')
      ElMessage.success(t('common.delSuccess'))
    })
    .finally(async () => {
      await getConfigList()
    })
}

const serviceName = 'easytier'
const installServiceHandle = async (row) => {
  ElMessageBox.confirm(t('easytier.installServiceMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    const binPath = path.join(await getUserDataPath(), 'bin', 'easytier-core')
    const confiPath = path.join(
      await getUserDataPath(),
      'config',
      row?.network_identity.network_name + '.toml'
    )
    await installService(serviceName, binPath, confiPath)
    ElMessage.success(t('common.accessSuccess'))
  })
}

const uninstallServiceHandle = async () => {
  ElMessageBox.confirm(t('easytier.uninstallServiceMessage'), t('common.reminder'), {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    await uninstallService(serviceName)
    ElMessage.success(t('common.accessSuccess'))
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
        <BaseButton type="info" @click="refreshAction"
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
          prop="network_identity.network_name"
          label="网络名称"
          header-align="center"
          align="center"
          show-overflow-tooltip
          sortable
        />
        <el-table-column label="操作" width="360" header-align="center" align="center">
          <template #default="{ row }">
            <el-row justify="center">
              <BaseButton type="primary" size="small" @click="edit(row)">
                {{ t('easytier.editNetConfig') }}
              </BaseButton>
              <BaseButton type="primary" size="small" @click="editForm(row)">
                {{ t('easytier.editNetConfigForm') }}
              </BaseButton>
            </el-row>
            <BaseButton type="info" size="small" @click="installServiceHandle(row)">
              {{ t('easytier.installService') }}
            </BaseButton>
            <BaseButton type="warning" size="small" @click="uninstallServiceHandle()">
              {{ t('easytier.uninstallService') }}
            </BaseButton>
            <BaseButton type="danger" size="small" @click="delConfig(row)">
              {{ t('exampleDemo.del') }}
            </BaseButton>
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

    <Dialog v-model="dialogVisible" :title="dialogTitle" maxHeight="60vh">
      <Form v-if="editType === 'form'" :form-data="formData" />
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
        <span>默认配置名称为网络名称 </span>
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
