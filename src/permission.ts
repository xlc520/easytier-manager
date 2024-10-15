import router from './router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import type { RouteRecordRaw } from 'vue-router'
import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded
} from 'vue-router'
import { usePermissionStoreWithOut } from '@/store/modules/permission'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    next: NavigationGuardNext
  ) => {
    start()
    loadStart()
    // next()
    const permissionStore = usePermissionStoreWithOut()
    if (permissionStore.getIsAddRouters) {
      next()
      return
    }
    // 是否使用动态路由
    await permissionStore.generateRoutes()

    permissionStore.getAddRouters.forEach((route) => {
      router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
    })
    const redirectPath = from.query.redirect || to.path
    const redirect = decodeURIComponent(redirectPath as string)
    const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
    permissionStore.setIsAddRouters(true)
    next(nextData)

    // 不需要权限验证
    // const appStore = useAppStoreWithOut()
    // const userStore = useUserStoreWithOut()
    // if (userStore.getUserInfo) {
    //   if (to.path === '/login') {
    //     next({ path: '/' })
    //   } else {
    //     if (permissionStore.getIsAddRouters) {
    //       next()
    //       return
    //     }
    //
    //     // 开发者可根据实际情况进行修改
    //     const roleRouters = userStore.getRoleRouters || []
    //
    //     // 是否使用动态路由
    //     if (appStore.getDynamicRouter) {
    //       appStore.serverDynamicRouter
    //         ? await permissionStore.generateRoutes(
    //             'server',
    //             roleRouters as AppCustomRouteRecordRaw[]
    //           )
    //         : await permissionStore.generateRoutes('frontEnd', roleRouters as string[])
    //     } else {
    //       await permissionStore.generateRoutes('static')
    //     }
    //
    //     permissionStore.getAddRouters.forEach((route) => {
    //       router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
    //     })
    //     const redirectPath = from.query.redirect || to.path
    //     const redirect = decodeURIComponent(redirectPath as string)
    //     const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect }
    //     permissionStore.setIsAddRouters(true)
    //     next(nextData)
    //   }
    // } else {
    //   if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
    //     next()
    //   } else {
    //     next(`/login?redirect=${to.path}`) // 否则全部重定向到登录页
    //   }
    // }
  }
)

router.afterEach(
  (
    to: RouteLocationNormalized
    // from: RouteLocationNormalizedLoaded,
    // failure?: NavigationFailure | void
  ) => {
    useTitle(to?.meta?.title as string)
    done() // 结束Progress
    loadDone()
  }
)
