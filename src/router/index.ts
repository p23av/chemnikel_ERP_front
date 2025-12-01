import { createRouter, createWebHistory, type RouteMeta } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginView from '@/views/LoginView.vue'
import Dashboard from '@/views/DashboardView.vue'
import Customers from '@/views/CustomersView.vue'
import Workers from '@/views/WorkersView.vue'

// import { useAuthStore } from '@/stores/auth'
// const store = useAuthStore

interface AuthMeta extends RouteMeta {
  layout?: string
  requiresAuth?: boolean
  allowedRoles?: string[] // ← ДОБАВЛЯЕМ ТИП
}

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      layout: 'AuthLayout',
      requiresAuth: false,
    } as AuthMeta,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
      allowedRoles: ['manager'],
    } as AuthMeta,
  },
  // {
  //   path: '/dashboard',
  //   name: 'Dashboard',
  //   component: Dashboard,
  //   meta: {
  //     layout: 'MainLayout',
  //     requiresAuth: true,
  //   },
  // },
  {
    path: '/customers',
    name: 'Customers',
    component: Customers,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
      allowedRoles: ['manager', 'worker'],
    } as AuthMeta,
  },
  {
    path: '/workers',
    name: 'Workers',
    component: Workers,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
      allowedRoles: ['manager'],
    } as AuthMeta,
  },
  // {
  //   path: '/config',
  //   name: 'Config',
  //   component: Config,
  //   meta: {
  //     layout: 'MainLayout',
  //     requiresAuth: true,
  //   },
  // },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // ЕСЛИ УЖЕ ИДЕМ НА LOGIN - ПРОПУСКАЕМ ПРОВЕРКИ
  if (to.name === 'Login') {
    return true
  }

  // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('access_token')
    console.log(`token from beforeEach: ${token}`)

    if (!token) return '/login'

    try {
      if (!authStore.user) {
        await authStore.fetchUser()
      }
    } catch {
      return '/login'
    }
  }

  // 2. ПРОВЕРКА РОЛЕЙ
  const allowedRoles = to.meta.allowedRoles as string[] | undefined
  if (allowedRoles) {
    const userRole = authStore.user?.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      // ВАЖНО: проверяем чтобы не редиректить на самого себя
      if (to.name !== 'Customers') {
        return '/customers'
      }
      // Если уже на customers - разрешаем
      return true
    }
  }

  return true
})

export default router
