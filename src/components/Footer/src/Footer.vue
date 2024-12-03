<script setup lang="ts">
import { useAppStore } from '@/store/modules/app'
import { computed, onMounted, ref } from 'vue'
import { useDesign } from '@/hooks/web/useDesign'
import { getAppVersion } from '@/utils/sysUtil'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('footer')

const appStore = useAppStore()

const title = computed(() => appStore.getTitle)

const appVersion = ref('')

onMounted(async () => {
  const version = await getAppVersion()
  if (version) {
    appVersion.value = version
  }
})
</script>

<template>
  <div
    :class="prefixCls"
    class="text-center text-[var(--el-text-color-placeholder)] bg-[var(--app-content-bg-color)] h-[var(--app-footer-height)] leading-[var(--app-footer-height)] dark:bg-[var(--el-bg-color)] overflow-hidden"
  >
    Copyright ©2024-present {{ title }} {{ appVersion }}
  </div>
</template>
