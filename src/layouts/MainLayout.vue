<script setup lang="ts">
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

// Выход из системы
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

interface NavItem {
  title: string
  icon: string
  value: string
  to: string
}
const navItems: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/dashboard' },
  { title: 'Customers', icon: 'mdi-folder', value: 'customers', to: '/customers' },
  { title: 'Projects', icon: 'mdi-folder', value: 'projects', to: '/projects' },
  { title: 'Team', icon: 'mdi-account-group', value: 'workers', to: '/workers' },
  { title: 'Calendar', icon: 'mdi-calendar', value: 'calendar', to: '/calendar' },
]
</script>

<template>

  <v-navigation-drawer>
    <v-list-item title="Химникель ERP"></v-list-item>
    <v-divider></v-divider>
    <v-list nav>
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :title="item.title"
        :value="item.value"
        :to="item.to"
        active-color="primary"
      />
      <!-- <v-list-item title="Dashboard" value="dashboard"></v-list-item>
      <v-list-item active title="Customers" value="customers"></v-list-item>
      <v-list-item title="Human resource" value="workers"></v-list-item>
      <v-list-item title="About" value="about"></v-list-item> -->
    </v-list>
  </v-navigation-drawer>

  <v-app-bar title="Химникель ERP">
    <!-- Логотип и название -->
    <v-btn icon class="mr-2">
      <v-icon>mdi-alpha-m-box</v-icon>
    </v-btn>

    <!-- Поиск -->
    <v-text-field
      flat
      hide-details
      prepend-inner-icon="mdi-magnify"
      label="Search"
      single-line
      dense
      class="mx-5"
    />

    <!-- Навигационные кнопки -->
    <!-- <v-btn text> Dashboard </v-btn>
    <v-btn text> Config </v-btn> -->

    <v-spacer />

    <!-- Кнопка настроек -->
    <v-btn icon>
      <v-icon>mdi-cog</v-icon>
    </v-btn>

    <!-- Информация о пользователе -->
    <v-avatar size="32" class="ml-4">
      <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="User" />
    </v-avatar>

    <v-btn @click="handleLogout" text class="ml-2"> Logout </v-btn>
  </v-app-bar>

  <v-main>
    <slot></slot>
  </v-main>

  <footer class="main-layout__footer">
    <p>© 2024 Мой сайт — Все права защищены</p>
  </footer>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header> -->
  <!-- <header>
    <div class="logo">Химникель_ERP</div>
    <div class="user">
      <div class="user-name">User</div>
      <div class="user-logout">
        <button>X</button>
      </div>
    </div>
  </header> -->
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px 2px #ccc;
}
.logo {
  padding: 8px;
}
ul {
  display: flex;
}
li {
  margin: 0 8px;
  padding: 8px;
}
.user {
  display: flex;
}
</style>
