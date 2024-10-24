<template>
  <div class="form">
    <el-form
      :model="formData"
      ref="formRef"
      :rules="rules"
      :scroll-to-error="true"
      label-position="right"
      label-width="160px"
      size="default"
      @submit.prevent
    >
      <el-divider direction="horizontal">主要参数</el-divider>
      <el-row>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="主机名" prop="hostname">
            <el-input v-model="formData.hostname" type="text" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="实例名" prop="instance_name">
            <el-input v-model="formData.instance_name" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="网络名称" prop="network_identity.network_name">
            <el-input v-model="formData.network_identity.network_name" type="text" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="网络密码" prop="network_identity.network_secret">
            <el-input
              v-model="formData.network_identity.network_secret"
              type="password"
              :show-password="true"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="自动获取虚拟IP" prop="dhcp">
            <el-switch v-model="formData.dhcp" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :sm="12" :xs="12">
          <el-form-item label="虚拟IPv4" prop="ipv4">
            <el-input v-model="formData.ipv4" type="text" :disabled="ipv4Disabled" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="24" :sm="12" :xs="12">
          <el-tooltip content="支持手动输入" placement="top">
            <el-form-item label="服务器(对等节点)" prop="peer">
              <el-select
                v-model="peers"
                @change="peerChange"
                clearable
                filterable
                allow-create
                default-first-option
                multiple
              >
                <el-option
                  v-for="(item, index) in peersOptions"
                  :key="index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="24" :sm="12" :xs="12">
          <el-tooltip content="支持手动输入" placement="top">
            <el-form-item label="监听" prop="listeners">
              <el-select
                v-model="formData.listeners"
                clearable
                filterable
                allow-create
                default-first-option
                multiple
              >
                <el-option
                  v-for="(item, index) in listenersOptions"
                  :key="index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-tooltip content="支持手动输入" placement="top">
            <el-form-item label="子网代理" prop="proxy_network.cidr">
              <el-select
                v-model="proxyNetwork"
                @change="proxyNetworkChange"
                clearable
                filterable
                allow-create
                default-first-option
                multiple
              >
                <el-option
                  v-for="(item, index) in proxy_network_cidrOptions"
                  :key="index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="24" :sm="12" :xs="12">
          <el-tooltip content="支持手动输入" placement="top">
            <el-form-item label="退出节点" prop="exit_nodes">
              <el-select
                v-model="formData.exit_nodes"
                clearable
                filterable
                allow-create
                default-first-option
                multiple
              >
                <el-option
                  v-for="(item, index) in exit_nodesOptions"
                  :key="index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="RPC 地址" prop="rpc_portal">
            <el-input v-model="formData.rpc_portal" type="text" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="consoleLoggerVisible">
          <el-form-item label="控制台日志级别" prop="console_logger.level">
            <el-select v-model="formData.console_logger.level" clearable filterable>
              <el-option
                v-for="(item, index) in file_logger_levelOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider direction="horizontal">日志设置</el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="日志文件级别" prop="file_logger.level">
            <el-select v-model="formData.file_logger.level" clearable>
              <el-option
                v-for="(item, index) in file_logger_levelOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="日志文件名" prop="file_logger.file">
            <el-input v-model="formData.file_logger.file" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :md="24" :sm="12" :xs="12">
          <el-form-item label="日志文件目录" prop="file_logger.dir">
            <el-input v-model="formData.file_logger.dir" :disabled="true" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider direction="horizontal">其他标志设置</el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="默认协议" prop="flags.default_protocol">
            <el-radio-group v-model="formData.flags.default_protocol">
              <el-radio
                v-for="(item, index) in flags_default_protocolOptions"
                :key="index"
                :value="item.value"
                style="display: inline"
                >{{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="TUN网卡名称" prop="flags.dev_name">
            <el-input v-model="formData.flags.dev_name" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="禁用加密" prop="flags.disable_encryption">
            <el-switch v-model="formData.flags.disable_encryption" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="禁用 IPv6" prop="flags.disable_ipv6">
            <el-switch v-model="formData.flags.disable_ipv6" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="延迟优先模式" prop="flags.latency_first">
            <el-switch v-model="formData.flags.latency_first" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="启用退出节点" prop="flags.enable_exit_node">
            <el-switch v-model="formData.flags.enable_exit_node" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="禁用 TUN 设备" prop="flags.no_tun">
            <el-switch v-model="formData.flags.no_tun" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="启用 smoltcp 堆栈" prop="flags.use_smoltcp">
            <el-switch v-model="formData.flags.use_smoltcp" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="禁用P2P通信" prop="flags.disable_p2p">
            <el-switch v-model="formData.flags.disable_p2p" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="禁用UDP打洞" prop="flags.disable_udp_hole_punching">
            <el-switch v-model="formData.flags.disable_udp_hole_punching" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="使用多线程" prop="flags.multi_thread">
            <el-switch v-model="formData.flags.multi_thread" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="转发所有节点RPC数据" prop="flags.relay_all_peer_rpc">
            <el-switch v-model="formData.flags.relay_all_peer_rpc" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider direction="horizontal">以下尚未测试，建议使用编辑器添加(修改)</el-divider>
      <el-row>
        <el-col :md="24" :sm="12" :xs="12">
          <el-form-item label="自定义路由CIDR" prop="flags.manual_routes">
            <el-input v-model="formData.flags.manual_routes" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="IPv6 监听URL" prop="flags.ipv6_listener">
            <el-input v-model="formData.flags.ipv6_listener" type="text" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="socks5 服务器" prop="flags.socks5">
            <el-input v-model="formData.flags.socks5" type="text" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { onMounted, PropType, reactive, ref, toRefs, watch } from 'vue'

const props = defineProps({
  formData: {
    type: Object as PropType<FormData>,
    required: true
  }
})
const { formData } = toRefs(props)
const formRef = ref()
const ipv4Disabled = ref(false)
const consoleLoggerVisible = ref(false)
const peers = ref<Array<any>>([])
const proxyNetwork = ref<Array<any>>([])

const rules = reactive({
  hostname: [
    { required: true, trigger: ['blur', 'change'], message: '请输入主机名' },
    {
      pattern: /^[^一-龥]+$/,
      trigger: ['blur', 'change'],
      message: '允许：字母 数字 _ -'
    }
  ],
  instance_name: [
    { required: true, trigger: ['blur', 'change'], message: '请输入实例名' },
    {
      pattern: /^[^一-龥]+$/,
      trigger: ['blur', 'change'],
      message: '允许：字母 数字 _ -'
    }
  ],
  'network_identity.network_name': [
    {
      pattern: /^[^一-龥]+$/,
      trigger: ['blur', 'change'],
      message: '允许：字母 数字 _ -'
    }
  ],
  'network_identity.network_secret': [
    {
      pattern: /^[^一-龥]+$/,
      trigger: ['blur', 'change'],
      message: '允许：字母 数字 符号'
    }
  ],
  'file_logger.file': [
    { required: true, trigger: ['blur', 'change'], message: '请输入日志文件名' },
    {
      pattern: /^[^一-龥]+$/,
      trigger: ['blur', 'change'],
      message: '允许：字母 数字 _ -'
    }
  ]
})
const peersOptions = reactive([
  {
    label: 'tcp://public.easytier.top:11010',
    value: 'tcp://public.easytier.top:11010'
  },
  {
    label: 'tcp://c.oee.icu:60006',
    value: 'tcp://c.oee.icu:60006'
  },
  {
    label: 'tcp://ah.nkbpal.cn:11010',
    value: 'tcp://ah.nkbpal.cn:11010'
  },
  {
    label: 'tcp://s1.ct8.pl:11010',
    value: 'tcp://s1.ct8.pl:11010'
  },
  {
    label: 'tcp://et.ie12vps.xyz:11010',
    value: 'tcp://et.ie12vps.xyz:11010'
  }
])
const listenersOptions = reactive([
  {
    label: 'tcp://0.0.0.0:11010',
    value: 'tcp://0.0.0.0:11010'
  },
  {
    label: 'udp://0.0.0.0:11010',
    value: 'udp://0.0.0.0:11010'
  },
  {
    label: 'wg://0.0.0.0:11011',
    value: 'wg://0.0.0.0:11011'
  },
  {
    value: 'ws://0.0.0.0:11011',
    label: 'ws://0.0.0.0:11011'
  },
  {
    value: 'wss://0.0.0.0:11012',
    label: 'wss://0.0.0.0:11012'
  }
])
const proxy_network_cidrOptions = reactive([
  {
    label: '192.168.0.0/24',
    value: '192.168.0.0/24'
  },
  {
    label: '192.168.1.0/24',
    value: '192.168.1.0/24'
  },
  {
    value: '192.168.2.0/24',
    label: '192.168.2.0/24'
  },
  {
    label: '192.168.31.0/24',
    value: '192.168.31.0/24'
  }
])
const exit_nodesOptions = reactive([
  {
    label: '10.144.144.1',
    value: '10.144.144.1'
  }
])
const file_logger_levelOptions = reactive([
  {
    label: '信息',
    value: 'info'
  },
  {
    label: '警告',
    value: 'warn'
  },
  {
    label: '错误',
    value: 'error'
  },
  {
    value: 'debug',
    label: '调试'
  },
  {
    value: 'off',
    label: '关闭'
  }
])
const flags_default_protocolOptions = reactive([
  {
    label: 'tcp',
    value: 'tcp'
  },
  {
    label: 'udp',
    value: 'udp'
  }
])
watch(
  () => formData.value.hostname,
  (value) => {
    if (value) {
      formData.value.instance_name = value
      formData.value.file_logger.file = value
    }
  }
)
watch(
  () => formData.value.dhcp,
  (value) => {
    if (value) {
      ipv4Disabled.value = true
      formData.value.ipv4 = undefined
    } else {
      ipv4Disabled.value = false
    }
  }
)

onMounted(() => {
  if (formData.value.dhcp) {
    ipv4Disabled.value = true
  }
  if (formData.value.peer && formData.value.peer!.length > 0 && formData.value.peer[0].uri) {
    formData.value.peer!.forEach((p) => peers.value.push(p.uri))
  }
  if (
    formData.value.proxy_network &&
    formData.value.proxy_network!.length > 0 &&
    formData.value.proxy_network[0].cidr
  ) {
    formData.value.proxy_network!.forEach((p) => proxyNetwork.value.push(p.cidr))
  }
})
const peerChange = (value: any) => {
  if (formData.value.peer) {
    formData.value.peer.length = 0
  }
  value.forEach((v) => formData?.value.peer?.push({ uri: v }))
}
const proxyNetworkChange = (value: any) => {
  if (formData.value.proxy_network) {
    formData.value.proxy_network.length = 0
  }
  value.forEach((v) => formData?.value?.proxy_network?.push({ cidr: v }))
}
const validateForm = () => {
  return formRef.value.validate()
}
defineExpose({ validateForm })
</script>
<style scoped>
.form {
  margin-right: 20px;
}
</style>
