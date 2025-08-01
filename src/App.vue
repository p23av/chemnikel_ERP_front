<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { RouterView } from 'vue-router'

const route = useRoute()

// Определяем макет (layout), если он задан в meta, иначе используем AuthLayout по умолчанию
const layout = computed(() => {
  return route.meta.layout || 'AuthLayout'
})
</script>

<template>
  <!-- Без Vuetify: больше нет <v-app>, просто обёртка с layout -->
  <component :is="layout">
    <RouterView />
  </component>
</template>

<style scoped>
/* Базовая стилизация может быть адаптирована под дизайн без Vuetify */

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: system-ui, sans-serif;
}

.component-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
