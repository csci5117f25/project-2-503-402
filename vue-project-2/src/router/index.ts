import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from '@/views/ProfileView.vue'
import HomeView from '@/views/HomeView.vue'
import QRview from '@/views/QRview.vue'
import FormView from '@/views/FormView.vue'
// import ReportView from '@/views/ReportView.vue'
import { getCurrentUser } from 'vuefire'
import LoginView from '@/views/LoginView.vue'
import TestView from '@/views/TestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/form',
      name: 'form',
      component: FormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/report',
      name: 'report',
      component: QRview,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/report/:id',
    //   name: 'report',
    //   props: true,
    //   component: ReportView,
    // },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    // {
    //   path: '/test',
    //   name: 'test',
    //   component: TestView,
    // },
  ],
})

// Verify user login before loading
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      }
    }
  }
})

export default router
