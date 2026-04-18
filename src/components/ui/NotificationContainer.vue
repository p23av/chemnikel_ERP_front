<!-- components/ui/NotificationContainer.vue -->
<template>
  <!-- Top-right notifications (category 0) -->
  <div class="notification-container top-right">
    <NotificationItem
      v-for="notification in topNotifications"
      :key="notification.id"
      :notification="notification"
      :position-class="'top-right'"
      @close="handleClose"
    />
  </div>

  <!-- Bottom-right notifications (category 1) -->
  <div class="notification-container bottom-right">
    <NotificationItem
      v-for="notification in bottomNotifications"
      :key="notification.id"
      :notification="notification"
      :position-class="'bottom-right'"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications'
import { computed } from 'vue'
import NotificationItem from './NotificationItem.vue'

const notificationsStore = useNotificationsStore()

const topNotifications = computed(() =>
  notificationsStore.activeNotifications.filter((n) => n.category === 0),
)

const bottomNotifications = computed(() =>
  notificationsStore.activeNotifications.filter((n) => n.category === 1),
)

const handleClose = (id: string) => {
  notificationsStore.close(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-right {
  top: 20px;
  right: 20px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}
</style>
