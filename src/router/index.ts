import { createRouter, createWebHistory } from 'vue-router'

import LoginView  from '@/views/LoginView.vue'
import Dashboard  from '@/views/DashboardView.vue'
import Customers  from '@/views/CustomersView.vue'
import Workers    from '@/views/WorkersView.vue'

// import { useAuthStore } from '@/stores/auth'
// const store = useAuthStore

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
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
    },
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
    },
  },
  {
    path: '/workers',
    name: 'Workers',
    component: Workers,
    meta: {
      layout: 'MainLayout',
      requiresAuth: true,
    },
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
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('access_token')
    console.log(`token from beforeEach: ${token}`)

    if (!token) return '/login'

    try {
      // await fetch('/api/users/me/', {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // })
      return true
    } catch {
      return '/login'
    }
  }
})

export default router
