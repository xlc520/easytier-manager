import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import { NO_RESET_WHITE_LIST } from '@/constants'

const { t } = useI18n()

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    name: 'Root',
    meta: {},
    children: [
      {
        path: '',
        component: () => import('@/views/UserPeer/index.vue'),
        name: 'UserPeer',
        meta: {
          title: t('router.workplace'),
          icon: 'tabler:home-stats'
        }
      }
    ]
  },
  {
    path: '/config',
    component: Layout,
    name: 'config',
    meta: {},
    children: [
      {
        path: '',
        component: () => import('@/views/UserConfig/index.vue'),
        name: 'UserConfig',
        meta: {
          title: t('easytier.config'),
          icon: 'mdi:file-document-plus-outline'
        }
      }
    ]
  },
  {
    path: '/setting',
    component: Layout,
    name: 'setting',
    meta: {},
    children: [
      {
        path: '',
        component: () => import('@/views/UserSetting/index.vue'),
        name: 'UserSetting',
        meta: {
          title: t('common.setting'),
          icon: 'uil:setting'
        }
      }
    ]
  },
  // {
  //   path: '/login',
  //   component: () => import('@/views/Login/Login.vue'),
  //   name: 'Login',
  //   meta: {
  //     hidden: true,
  //     title: t('router.login'),
  //     noTagsView: true
  //   }
  // },
  {
    path: '/redirect',
    component: Layout,
    name: 'Redirect',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    name: 'NotFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  }
]

export const asyncRouterMap: AppRouteRecordRaw[] = []

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: constantRouterMap as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string) && router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
