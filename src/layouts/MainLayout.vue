<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

import { useCustomersStore } from '@/stores/customers'
import { useProductsStore } from '@/stores/products'

import { useNotificationsStore } from '@/stores/notifications'
const notifications = useNotificationsStore()

const authStore = useAuthStore()
const router = useRouter()

const customersStore = useCustomersStore()
const productsStore = useProductsStore()

// Загружаем данные при монтировании компонента
onMounted(async () => {
  try {
    await customersStore.fetchCustomers()
    await productsStore.fetchProducts()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.status === 401) {
      router.push('/login')
    }
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

interface NavItem {
  title: string
  icon: string
  value: string
  to: string
  roles: string[] // Каким ролям доступен этот пункт
}

const allNavItems: NavItem[] = [
  {
    title: 'Заказчики/Детали',
    icon: '📊',
    value: 'dashboard',
    to: '/dashboard',
    roles: ['manager'], // Только менеджер
  },
  {
    title: 'Заказы',
    icon: '👥',
    value: 'customers',
    to: '/customers',
    roles: ['manager', 'worker'], // Менеджер и рабочий
  },
  {
    title: 'Сотрудники',
    icon: '🧑‍🤝‍🧑',
    value: 'workers',
    to: '/workers',
    roles: ['manager'], // Только менеджер
  },
]

// Фильтруем навигацию по роли пользователя
const navItems = authStore.user
  ? allNavItems.filter((item) => item.roles.includes(authStore.user!.role))
  : []

// const navItems: NavItem[] = [
//   { title: 'Заказчики/Детали', icon: '📊', value: 'dashboard', to: '/dashboard' },
//   { title: 'Заказы', icon: '👥', value: 'customers', to: '/customers' },
//   // { title: 'Projects', icon: '📁', value: 'projects', to: '/projects' },
//   { title: 'Сотрудники', icon: '🧑‍🤝‍🧑', value: 'workers', to: '/workers' },
//   // { title: 'Calendar', icon: '📅', value: 'calendar', to: '/calendar' },
// ]

const alert = () => {
  notifications.info('Рекомендуется заменить раствор в ванне №2')
}
</script>

<template>
  <div class="main-layout">
    <aside class="sidebar">
      <!-- <div class="sidebar-header">Химникель ERP</div> -->
      <nav class="nav">
        <RouterLink v-for="item in navItems" :key="item.title" :to="item.to" class="nav-item">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-title">{{ item.title }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="content-area">
      <header class="topbar">
        <div class="topbar-left">
          <!-- <div class="logo">🔷Заголовок</div> -->
          <div class="logo">Химникель ERP</div>
        </div>
        <div class="topbar-right">
          <button @click="alert" class="settings-btn">⚙️</button>
          <div class="user-info">
            <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="User" class="avatar" />
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>

      <footer class="footer">
        <p>© 2024 Мой сайт — Все права защищены</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100%;
}

.sidebar {
  width: 240px;
  background-color: #1e293b;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.sidebar-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.nav-item:hover {
  background-color: #334155;
}

.nav-icon {
  margin-right: 0.5rem;
}

.content-area {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
}

.topbar {
  height: 60px;
  background-color: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 1.25rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.logout-btn {
  background: none;
  border: none;
  color: #1e293b;
  font-weight: bold;
  cursor: pointer;
}

.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f1f5f9;
  width: 100%;
}

.footer {
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
  background-color: #f8fafc;
}
/* Маленький ноут */
@media (min-width: 1024px) and (max-width: 1370px) and (orientation: landscape) {
  .sidebar {
    width: 32px;
    padding: 0;
  }
  .main-content {
    padding: 0;
  }
  .footer {
    padding: 0;
  }
}

/* Планшеты в ландшафтной ориентации */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .sidebar {
    width: 32px;
    padding: 0;
  }
  .main-content {
    padding: 0;
  }
  .footer {
    padding: 0;
  }
}

/*  */
</style>
