<!-- components/ui/NotificationItem.vue -->
<script setup lang="ts">
import type { Notification } from '@/stores/notifications'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  close: [id: string]
}>()

const handleClose = () => {
  emit('close', props.notification.id)
}
</script>

<template>
  <div class="notification-item" :class="`notification--${notification.type}`">
    <div class="notification-content">
      <div class="notification-title">{{ notification.title }}</div>
      <div class="notification-message">{{ notification.message }}</div>
      <div v-if="notification.errorCode" class="notification-code">
        Код: {{ notification.errorCode }}
      </div>
    </div>
    <button @click="handleClose" class="close-btn">×</button>
  </div>
</template>

<style scoped>
.notification-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-width: 300px;
  max-width: 400px;
}

.notification--info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.notification--success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.notification--error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.notification-message {
  margin-bottom: 4px;
}

.notification-code {
  font-size: 12px;
  font-family: monospace;
  opacity: 0.7;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
  margin-left: 10px;
}

.close-btn:hover {
  opacity: 1;
}
</style>
