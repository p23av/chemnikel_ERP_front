<script setup lang="ts">
// import router from '../router'
</script>

<template>
  <v-app-bar title="Химникель ERP">
    <v-toolbar app color="primary" dark>
      <!-- Логотип и название -->
      <v-btn icon class="mr-2">
        <v-icon>mdi-alpha-m-box</v-icon>
      </v-btn>
      <v-toolbar-title>MyApp</v-toolbar-title>

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
      <v-btn text> Dashboard </v-btn>
      <v-btn text> Projects </v-btn>
      <v-btn text> Team </v-btn>

      <v-spacer />

      <!-- Кнопка настроек -->
      <v-btn icon>
        <v-icon>mdi-cog</v-icon>
      </v-btn>

      <!-- Информация о пользователе -->
      <v-avatar size="32" class="ml-4">
        <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="User" />
      </v-avatar>

      <v-btn text class="ml-2"> Logout </v-btn>
    </v-toolbar>
  </v-app-bar>

  <v-navigation-drawer>
    <v-list>
      <v-list-item title="Navigation drawer"></v-list-item>
    </v-list>
  </v-navigation-drawer>

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
  height: 36px;
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
