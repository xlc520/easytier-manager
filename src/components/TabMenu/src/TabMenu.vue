<script setup lang="ts">
import { usePermissionStore } from '@/store/modules/permission'
import { useAppStore } from '@/store/modules/app'
import { computed, unref, watch, ref, onMounted } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { ElScrollbar } from 'element-plus'
import { Icon } from '@/components/Icon'
import { Menu } from '@/components/Menu'
import { useRouter } from 'vue-router'
import { pathResolve } from '@/utils/routerHelper'
import { cloneDeep } from 'lodash-es'
import { filterMenusPath, initTabMap, tabPathMap } from './helper'
import { useDesign } from '@/hooks/web/useDesign'
import { isUrl } from '@/utils/is'
// import { ClickOutside } from 'element-plus'

const { getPrefixCls, variables } = useDesign()
const prefixCls = getPrefixCls('tab-menu')

const { push, currentRoute } = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

// computed
const collapse = computed(() => appStore.getCollapse)
const fixedMenu = computed(() => appStore.getFixedMenu)
const routers = computed(() => permissionStore.routers)
const tabRouters = computed(() => unref(routers).filter((v) => !v?.meta?.hidden))

// refs
const showTitle = ref(true)
const showMenu = ref(unref(fixedMenu) ? true : false)
const tabActive = ref('')

// methods
const setCollapse = () => {
  appStore.setCollapse(!unref(collapse))
}

const tabClick = (item: AppRouteRecordRaw) => {
  if (isUrl(item.path)) {
    window.open(item.path)
    return
  }
  const newPath = item.children ? item.path : item.path.split('/')[0]
  const oldPath = unref(tabActive)
  tabActive.value = item.children ? item.path : item.path.split('/')[0]

  if (item.children) {
    if (newPath === oldPath || !unref(showMenu)) {
      showMenu.value = !unref(showMenu)
    }
    if (unref(showMenu)) {
      permissionStore.menuTabRouters = cloneDeep(item.children).map((v) => {
        v.path = pathResolve(unref(tabActive), v.path)
        return v
      })
    }
  } else {
    push(item.path)
    permissionStore.menuTabRouters = []
    showMenu.value = false
  }
}

const isActive = (currentPath: string) => {
  const { path } = unref(currentRoute)
  if (tabPathMap[currentPath].includes(path)) {
    return true
  }
  return false
}

const clickOut = () => {
  if (!unref(fixedMenu)) {
    showMenu.value = false
  }
}

const getItem = (item: AppRouteRecordRaw | any) => {
  return item.meta?.alwaysShow || (item?.children?.length && item?.children?.length > 1)
    ? item
    : {
        ...(item?.children && item?.children[0]),
        path: pathResolve(item.path, (item?.children && item?.children[0])?.path as string)
      }
}

// lifecycle
onMounted(() => {
  if (unref(fixedMenu)) {
    const path = `/${unref(currentRoute).path.split('/')[1]}`
    const children = unref(tabRouters).find(
      (v) =>
        (v.meta?.alwaysShow || (v?.children?.length && v?.children?.length > 1)) && v.path === path
    )?.children

    tabActive.value = path
    if (children) {
      permissionStore.menuTabRouters = cloneDeep(children).map((v) => {
        v.path = pathResolve(unref(tabActive), v.path)
        return v
      })
    }
  }
})

// watches
watch(
  () => routers.value,
  (routers: AppRouteRecordRaw[]) => {
    initTabMap(routers)
    filterMenusPath(routers, routers)
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => collapse.value,
  (collapse: boolean) => {
    if (!collapse) {
      setTimeout(() => {
        showTitle.value = !collapse
      }, 200)
    } else {
      showTitle.value = !collapse
    }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <div
    :id="`${variables.namespace}-menu`"
    v-click-outside="clickOut"
    :class="[
      prefixCls,
      'relative bg-[var(--left-menu-bg-color)] top-1px layout-border__right',
      {
        'w-[var(--tab-menu-max-width)]': !unref(collapse),
        'w-[var(--tab-menu-min-width)]': unref(collapse)
      }
    ]"
  >
    <ElScrollbar class="!h-[calc(100%-var(--tab-menu-collapse-height)-1px)]">
      <div>
        <template v-for="v in tabRouters" :key="v.path">
          <div
            :class="[
              `${prefixCls}__item`,
              'text-center text-12px relative py-12px cursor-pointer',
              {
                'is-active': isActive(getItem(v).path)
              }
            ]"
            @click="tabClick(getItem(v))"
          >
            <div>
              <Icon :icon="getItem(v).meta?.icon" />
            </div>
            <p v-if="unref(showTitle)" class="break-words mt-5px px-2px">
              {{ t(getItem(v).meta?.title || '') }}
            </p>
          </div>
        </template>
      </div>
    </ElScrollbar>
    <div
      :class="[
        `${prefixCls}--collapse`,
        'text-center h-[var(--tab-menu-collapse-height)] leading-[var(--tab-menu-collapse-height)] cursor-pointer'
      ]"
      @click="setCollapse"
    >
      <Icon :icon="unref(collapse) ? 'ep:d-arrow-right' : 'ep:d-arrow-left'" />
    </div>
    <Menu
      :class="[
        '!absolute top-0 z-3000',
        {
          '!left-[var(--tab-menu-min-width)]': unref(collapse),
          '!left-[var(--tab-menu-max-width)]': !unref(collapse),
          '!w-[var(--left-menu-max-width)] border-r-1 border-r-solid border-[var(--el-border-color)]':
            unref(showMenu) || unref(fixedMenu),
          '!w-0': !unref(showMenu) && !unref(fixedMenu)
        }
      ]"
      style="
        transition:
          width var(--transition-time-02),
          left var(--transition-time-02);
      "
    />
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{adminNamespace}-tab-menu';

.@{prefix-cls} {
  transition: all var(--transition-time-02);

  &__item {
    color: var(--left-menu-text-color);
    transition: all var(--transition-time-02);

    &:hover {
      color: var(--left-menu-text-active-color);
    }
  }

  &--collapse {
    color: var(--left-menu-text-color);
    background-color: var(--left-menu-bg-light-color);
  }

  .is-active {
    color: var(--left-menu-text-active-color);
    background-color: var(--left-menu-bg-active-color);
  }
}
</style>
