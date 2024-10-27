<script setup lang="ts">
import { computed } from 'vue'
import { Collapse } from '@/components/Collapse'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { SizeDropdown } from '@/components/SizeDropdown'
import { Screenfull } from '@/components/Screenfull'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { Icon } from '@/components/Icon'
import { shell } from 'electron'

const { getPrefixCls, variables } = useDesign()
const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
const locale = computed(() => appStore.getLocale)

const toDocumentEasytierManager = () => {
  shell.openExternal('https://github.com/xlc520/easytier-manager')
}
const toDocumentEasyTier = () => {
  shell.openExternal('https://github.com/EasyTier/EasyTier')
}
</script>

<template>
  <div
    :id="`${variables.namespace}-tool-header`"
    :class="[
      prefixCls,
      'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between'
    ]"
  >
    <div v-if="layout !== 'top'" class="h-full flex items-center">
      <Collapse
        v-if="hamburger && layout !== 'cutMenu'"
        class="custom-hover"
        :color="variables['top-header-text-color']"
      />
      <Breadcrumb v-if="breadcrumb" class="<md:hidden" />
    </div>
    <div class="h-full flex items-center mr-20px">
      <Screenfull
        v-if="screenfull"
        class="custom-hover"
        :color="variables['top-header-text-color']"
      />
      <SizeDropdown v-if="size" class="custom-hover" :color="variables['top-header-text-color']" />
      <LocaleDropdown
        v-if="locale"
        class="custom-hover"
        :color="variables['top-header-text-color']"
      />
      <div class="ml-1 mr-4" @click="toDocumentEasyTier">
        <el-tooltip content="EasyTier Github" placement="bottom" effect="light">
          <Icon :size="18" icon="devicon:github" class="cursor-pointer" />
        </el-tooltip>
      </div>
      <div class="mr-10" @click="toDocumentEasytierManager">
        <el-tooltip content="EasyTier 管理器 Github" placement="bottom" effect="light">
          <Icon :size="18" icon="devicon:github" class="cursor-pointer" />
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-tool-header';

.@{prefix-cls} {
  transition: left var(--transition-time-02);
}
</style>
