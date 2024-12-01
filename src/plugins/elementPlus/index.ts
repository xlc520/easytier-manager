import type { App } from 'vue'
import ElementPlus, { ClickOutside } from 'element-plus'

export const setupElementPlus = (app: App<Element>) => {
  // 注册所有 Element Plus 的全局组件，包括 ElMessage、ElLoading、ElNotification 等
  app.use(ElementPlus)
  // 注册指令，检测点击元素外部的事件
  app.directive('click-outside', ClickOutside)
  // 为了开发环境启动更快，一次性引入所有样式
  if (import.meta.env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === 'true') {
    import('element-plus/dist/index.css')
    return
  }
}

// 部分注册
// 需要全局引入一些组件，如ElScrollbar，不然一些下拉项样式有问题
// import {
//   ElButton,
//   ElCol,
//   ElDescriptions,
//   ElDivider,
//   ElForm,
//   ElFormItem,
//   ElInput,
//   ElLoading,
//   ElMessage,
//   ElMessageBox,
//   ElNotification,
//   ElOption,
//   ElPagination,
//   ElRow,
//   ElScrollbar,
//   ElSelect,
//   ElSwitch,
//   ElTable,
//   ElTableColumn,
//   ElTag,
//   ElText,
//   ElTooltip,
//   ElCard,
//   ElDialog,
//   ElMenu,
//   ElMenuItem,
//   ElSubMenu,
//   ElDropdown,
//   ElDropdownItem,
//   ElDropdownMenu,
//   ElDescriptionsItem
// } from 'element-plus'

// 需要使用 app.use() 注册的插件组件
// const plugins = [ElLoading, ElMessage, ElMessageBox, ElNotification]

// 需要使用 app.component() 注册的普通组件
// const components = [
//   ElDialog,
//   ElInput,
//   ElButton,
//   ElSelect,
//   ElOption,
//   ElForm,
//   ElFormItem,
//   ElSwitch,
//   ElTooltip,
//   ElDropdown,
//   ElDropdownMenu,
//   ElDropdownItem,
//   ElScrollbar,
//   ElDescriptions,
//   ElTag,
//   ElTable,
//   ElTableColumn,
//   ElDivider,
//   ElRow,
//   ElCol,
//   ElText,
//   ElPagination,
//   ElCard,
//   ElMenu,
//   ElMenuItem,
//   ElSubMenu,
//   ElDescriptions,
//   ElDescriptionsItem
// ]

/**
 * plugins： app.use()：用于注册带有install方法的插件组件，通常这些组件会带有全局功能或指令。例如：
 * ElLoading（全局加载指令）
 * ElMessage（全局消息提示）
 * ElNotification（全局通知）
 * ElMessageBox（全局对话框）
 *
 * components： app.component()：用于注册普通的组件，这些组件主要用于UI展示。例如：
 * ElScrollbar（滚动条组件）
 * ElCard（卡片组件）
 * ElDescriptions（描述列表组件）
 */
// export const setupElementPlus = (app: App<Element>) => {
//   // 注册插件组件
//   plugins.forEach((plugin) => {
//     app.use(plugin)
//   })

//   // 为了开发环境启动更快，一次性引入所有样式
//   if (import.meta.env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === 'true') {
//     import('element-plus/dist/index.css')
//     return
//   }

//   // 注册普通组件
//   components.forEach((component) => {
//     app.component(component.name!, component)
//   })
// }
