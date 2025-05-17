import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
import ManagerDashboard from '@/views/ManagerDashboardView.vue'

import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      layout: 'AuthLayout',
      requiresAuth: false,
    },
  },
  {
    path: '/manager',
    name: 'Manager',
    component: ManagerDashboard,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('access_token')
    console.log(`token from beforeEach: ${token}`)

    if (!token) return '/login'

    try {
      await fetch('/api/user/me/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return true
    } catch {
      return '/login'
    }
  }
})

export default router
