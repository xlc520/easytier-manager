<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { reactive, ref, unref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { deleteUserByIdApi } from '@/api/department'
import type { DepartmentUserItem } from '@/api/department/types'
import { useTable } from '@/hooks/web/useTable'
import Write from './components/Write.vue'
import { Dialog } from '@/components/Dialog'
import { CrudSchema, useCrudSchemas } from '@/hooks/web/useCrudSchemas'
import { BaseButton } from '@/components/Button'
import { CONFIG_PATH } from '@/constants/easytier'
import * as toml from 'smol-toml'
import { useEasyTierStore } from '@/store/modules/easytier'
import log from '@/utils/logger'
import path from 'path'
import {
  deleteFile,
  getFilesByExtension,
  getUserDataPath,
  readFile,
  writeFile
} from '@/utils/fileUtil'
// import MonacoEditor from '@/components/monaco-editor/index.vue'
const MonacoEditor = () => import('@/components/monaco-editor/index.vue')
const { t } = useI18n()
const easyTierStore = useEasyTierStore()
const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    // const res = await getConfigList()
    const res = easyTierStore.configList
    return {
      list: res || [],
      total: res.length || 0
    }
  },
  fetchDelApi: async () => {
    const res = await deleteUserByIdApi(unref(ids))
    return !!res
  }
})
const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'index',
    label: t('userDemo.index'),
    form: {
      hidden: true
    },
    search: {
      hidden: true
    },
    detail: {
      hidden: true
    },
    table: {
      type: 'index'
    }
  },
  {
    field: 'hostname',
    label: t('easytier.hostname'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'network_name',
    label: t('easytier.network_name'),
    search: {
      hidden: true
    }
  },
  {
    field: 'network_secret',
    label: t('easytier.network_secret'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'dhcp',
    label: t('easytier.dhcp'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'ipv4Vir',
    label: t('easytier.ipv4Vir'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'peers',
    label: t('easytier.peers'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'proxy_network',
    label: t('easytier.proxy_network'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'default_protocol',
    label: t('easytier.default_protocol'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'console_log_level',
    // trace, debug, info, warn, error, off
    label: t('easytier.console_log_level'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'file_log_level',
    // trace, debug, info, warn, error, off
    label: t('easytier.file_log_level'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'file_log_dir',
    label: t('easytier.file_log_dir'),
    table: {
      hidden: true
    },
    search: {
      hidden: true
    }
  },
  {
    field: 'action',
    label: t('userDemo.action'),
    form: {
      hidden: true
    },
    detail: {
      hidden: true
    },
    search: {
      hidden: true
    },
    table: {
      width: 340,
      slots: {
        default: (data: any) => {
          const row = data.row as DepartmentUserItem
          return (
            <>
              <BaseButton
                type="primary"
                onClick={() => {
                  editType.value = ''
                  action(row, 'edit')
                }}
              >
                {t('easytier.editNetConfig')}
              </BaseButton>
              <BaseButton
                type="primary"
                onClick={() => {
                  editType.value = 'form'
                  action(row, 'edit')
                }}
              >
                {t('easytier.editNetConfigForm')}
              </BaseButton>
              <BaseButton type="danger" onClick={() => delConfig(row)}>
                {t('exampleDemo.del')}
              </BaseButton>
            </>
          )
        }
      }
    }
  }
])
const { total, loading, dataList, pageSize, currentPage } = tableState
const { getList } = tableMethods

const { allSchemas } = useCrudSchemas(crudSchemas)

const dataConfig = ref('')
const treeEl = ref<typeof ElTree>()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const actionType = ref('')
const editType = ref('')
const ids = ref<string[]>([])
const writeRef = ref<ComponentRef<typeof Write>>()
const saveLoading = ref(false)
const currentDepartment = ref('')
const currentRow = ref<DepartmentUserItem>()
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
  fileList.forEach((f: string) => {
    const fileName = f.replace('.toml', '')
    tmpList.push({ network_name: fileName })
    tmpList2.push(fileName)
  })
  easyTierStore.setConfigList(tmpList)
  easyTierStore.setFileListNoSuffix(tmpList2)
  await getList()
  return tmpList
}

const readFileData = async (fileName: string) => {
  dataConfig.value = await readFile(fileName)
}
const action = async (row: any, type: string) => {
  dialogTitle.value = t(type === 'edit' ? 'exampleDemo.edit' : 'exampleDemo.detail')
  actionType.value = type
  currentRow.value = { ...row }
  await readFileData(CONFIG_PATH + '/' + row.network_name + '.toml')
  dialogVisible.value = true
}
const AddAction = () => {
  dialogTitle.value = t('easytier.addNetConfig')
  dialogVisible.value = true
  actionType.value = 'add'
  editType.value = ''
}
const AddFormAction = () => {
  dialogTitle.value = t('easytier.addNetConfigForm')
  dialogVisible.value = true
  actionType.value = 'add'
  editType.value = 'form'
}
const refreshAction = async () => {
  await getConfigList()
}
const addConfigAction = async () => {
  // todo 如果已经存在网络名则提示
  if (editType.value === 'form') {
    // const write = unref(writeRef)
    // const formData = await write?.submit()
    // if (formData) {
    //   saveLoading.value = true
    //   try {
    //   } catch (error) {
    //     log.log(error)
    //   } finally {
    //     saveLoading.value = false
    //     dialogVisible.value = false
    //   }
    // }
  } else {
    try {
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
      dialogVisible.value = false
    }
  }
  await getConfigList()
}
const saveConfigAction = async () => {
  if (editType.value === 'form') {
    const write = unref(writeRef)
    const formData = await write?.submit()
    if (formData) {
      saveLoading.value = true
      try {
      } catch (error) {
        log.log(error)
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
    await writeFile(CONFIG_PATH + '/' + networkName + '.toml', toml.stringify(parseValue))
    log.log('保存的代码', dataConfig.value)
    ElMessage.success(t('common.accessSuccess'))
    dialogVisible.value = false
  }
  await getConfigList()
}
const delConfig = async (row?) => {
  log.log('删除', row)
  ElMessageBox.confirm(t('common.delMessage'), t('common.delWarning'), {
    confirmButtonText: t('common.delOk'),
    cancelButtonText: t('common.delCancel'),
    type: 'warning'
  })
    .then(async () => {
      await deleteFile(CONFIG_PATH + '/' + row?.network_name + '.toml')
      ElMessage.success(t('common.delSuccess'))
    })
    .finally(async () => {
      await getConfigList()
    })
}
const updateDataConfig = (val: string) => {
  //val:子组件实时传过来的值
  dataConfig.value = val
}
</script>

<template>
  <div class="flex w-100% h-100%">
    <ContentWrap class="flex-[3] ml-10px">
      <div class="mb-10px">
        <BaseButton type="primary" @click="AddFormAction"
          >{{ t('easytier.addNetConfigForm') }}
        </BaseButton>
        <BaseButton type="primary" @click="AddAction">{{ t('easytier.addNetConfig') }}</BaseButton>
        <BaseButton type="info" @click="refreshAction"
          >{{ t('easytier.reloadNetConfig') }}
        </BaseButton>
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
        @register="tableRegister"
        :pagination="{
          total
        }"
      />
    </ContentWrap>

    <Dialog v-model="dialogVisible" :title="dialogTitle">
      <Write
        v-if="editType === 'form'"
        ref="writeRef"
        :form-schema="allSchemas.formSchema"
        :current-row="currentRow"
      />
      <MonacoEditor
        v-if="editType !== 'form'"
        ref="monacoEdit"
        v-model:value="dataConfig"
        :readonly="false"
        language="toml"
        theme="vs-dark"
        :onContentChange="updateDataConfig"
      />
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
</style>
