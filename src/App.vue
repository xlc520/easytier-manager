<script lang="ts" setup>
import { ConfigGlobal } from '@/components/ConfigGlobal'
import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { useEasyTierStore } from '@/store/modules/easytier'
import { useTrayStore } from '@/store/modules/trayStore'
import { checkDir } from '@/utils/fileUtil'
import { restoreStateCurrent, StateFlags } from '@tauri-apps/plugin-window-state'
import { computed, onBeforeMount } from 'vue'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('app')

const appStore = useAppStore()
const currentSize = computed(() => appStore.getCurrentSize)

const greyMode = computed(() => appStore.getGreyMode)
const trayStore = useTrayStore()
const easytierStore = useEasyTierStore()
appStore.initTheme()

onBeforeMount(async () => {
  trayStore.initTray()
  restoreStateCurrent(StateFlags.ALL)
  checkDir()
  easytierStore.setConfigPath()
})
</script>

<template>
  <ConfigGlobal :size="currentSize">
    <RouterView :class="greyMode ? `${prefixCls}-grey-mode` : ''" />
  </ConfigGlobal>
</template>

<style lang="less">
@prefix-cls: ~'@{adminNamespace}-app';

.size {
  width: 100%;
  height: 100%;
}

html,
body {
  padding: 0 !important;
  margin: 0;
  overflow: hidden;
  .size;

  #app {
    .size;
  }
}

.@{prefix-cls}-grey-mode {
  filter: grayscale(100%);
}
</style>
