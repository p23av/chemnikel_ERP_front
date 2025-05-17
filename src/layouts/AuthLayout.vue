<template>
  <slot />
</template>

<script setup lang="ts">
// В данном случае не нужно никаких скриптов, так как это просто layout
</script>

<style scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9f9f9;
}

.auth-layout__header {
  background-color: #333;
  color: white;
  padding: 20px;
  text-align: center;
}

.auth-layout__main {
  flex-grow: 1;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-layout__footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 10px;
}
</style>
