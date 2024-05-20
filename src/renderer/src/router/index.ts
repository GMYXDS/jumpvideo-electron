import { createRouter, createWebHashHistory } from 'vue-router'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/main' },
    { path: '/main', component: () => import('../views/main.vue') },
    { path: '/setting', component: () => import('../views/setting.vue') },
    { path: '/about', component: () => import('../views/about.vue') },
    { path: '/srt_trans', component: () => import('../views/srt_trans.vue') },
    { path: '/from_m2p', component: () => import('../views/from_m2p.vue') },
    { path: '/from_old_jv', component: () => import('../views/from_old_jv.vue') },
    {
      path: '/:pathMatch(.*)',
      component: () => import('../views/NotFound.vue')
    }
  ]
})
export default router
