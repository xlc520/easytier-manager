<script setup lang="ts">
import { Icon } from '@/components/Icon'
import { useFullscreen } from '@vueuse/core'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('screenfull')

defineProps({
  color: propTypes.string.def('')
})

const { toggle, isFullscreen } = useFullscreen()

const toggleFullscreen = () => {
  toggle()
}
</script>

<template>
  <div :class="prefixCls" @click="toggleFullscreen">
    <el-tooltip content="全屏" placement="bottom" effect="light">
      <Icon
        :size="18"
        :icon="isFullscreen ? 'zmdi:fullscreen-exit' : 'zmdi:fullscreen'"
        :color="color"
      />
    </el-tooltip>
  </div>
</template>
