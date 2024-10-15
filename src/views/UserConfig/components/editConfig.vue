<script setup lang="ts">
import MonacoEditor from '@/components/monaco-editor/index.vue'
import { ref } from 'vue'

const dialogTableVisible = ref(false)
const data = ref('test')

function update(val: string) {
  //val:子组件实时传过来的值
  console.log(val)
}
</script>

<template>
  <div>
    <el-dialog v-model="dialogTableVisible" title="Shipping address" width="800">
      <MonacoEditor
        ref="monacoEdit"
        v-model:value="data"
        :readonly="false"
        language="toml"
        theme="myCoolTheme"
        :update="update"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="less"></style>
