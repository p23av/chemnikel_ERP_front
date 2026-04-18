<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import type { Process } from '@/stores/processes'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/auth'

const props = defineProps<{
  process: Process
  startHour: number // начало шкалы, например 8
  endHour: number // конец шкалы, например 20
  cellHeight?: number // высота одного часа, по умолчанию 60px
  lineName?: string // название линии (никель, медь и т.д.)
}>()

const emit = defineEmits<{
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}>()

const ordersStore = useOrdersStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const users = ref<User[]>([])

// Загрузить пользователей при монтировании
onMounted(async () => {
  try {
    users.value = await authStore.fetchAllUsers()
  } catch (error: unknown) {
    console.error('Error loading users:', error)
  }
})

const order = computed(() => ordersStore.getOrderById(props.process.order))
const product = computed(() => {
  if (!order.value) return null
  return productsStore.getProductById(order.value.product)
})

// Исполнитель процесса
const worker = computed(() => {
  if (!props.process.worker) return null
  return users.value.find((user: User) => user.id === props.process.worker)
})

// Название для отображения
const displayTitle = computed(() => {
  if (!order.value || !product.value) return `Заказ #${props.process.order}`
  return `#${order.value.id} ${product.value.name}`
})

const cellHeight = computed(() => props.cellHeight ?? 48)

// Вычисляем смещение и высоту карточки
const topOffset = computed(() => {
  if (!props.process.start_time) return 0

  const start = new Date(props.process.start_time)
  const startMinutes = start.getMinutes()

  // Смещение внутри ячейки: минуты / 60 * высота ячейки
  const minutesOffset = (startMinutes / 60) * cellHeight.value

  return minutesOffset
})

const height = computed(() => {
  if (!props.process.start_time || !props.process.end_time) return cellHeight.value

  const start = new Date(props.process.start_time)
  const end = new Date(props.process.end_time)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  return Math.max(durationHours * cellHeight.value, 25) // минимальная высота 25px
})

// Цвет по статусу (теперь по наличию end_time)
const bgColor = computed(() => {
  return props.process.end_time ? '#16a34a' : '#3b82f6' // Зеленый = завершен, Синий = в работе
})

// Время процесса
const processTime = computed(() => {
  if (!props.process.start_time) return 'Не начат'

  const startTime = new Date(props.process.start_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!props.process.end_time) return `${startTime} - ...`

  const endTime = new Date(props.process.end_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${startTime} - ${endTime}`
})

function handleEdit() {
  emit('edit', props.process.id)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  if (confirm('Удалить этот процесс?')) {
    emit('delete', props.process.id)
  }
}
</script>

<template>
  <div
    class="process-card"
    :style="{
      top: `${topOffset}px`,
      height: `${height}px`,
      background: bgColor,
    }"
    @click="handleEdit"
  >
    <div class="process-header">
      <div class="process-title">{{ displayTitle }}</div>

      <span>{{ process.quantity }} шт.</span>
      <button class="delete-btn" @click="handleDelete" title="Удалить">×</button>
    </div>

    <div class="process-info">
      <div class="process-time">{{ processTime }}</div>
      <div class="process-details">
        <span v-if="lineName" class="process-line"> • {{ lineName }}</span>
        <span class="process-subline"> • Ванна № {{ process.subline }}</span>
      </div>
      <div v-if="worker" class="process-worker">👤 {{ worker.full_name }}</div>
    </div>
  </div>
</template>

<style scoped>
.process-card {
  position: absolute;
  /* left: 2px; */
  /* right: 2px; */
  border-radius: 4px;
  color: #fff;
  font-size: 0.7rem;
  padding: 4px 6px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.15s;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-height: 80px;
  z-index: 99;
  width: 100%;
}

.process-card:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2px;
}

.process-title {
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1.2;
  flex: 1;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 4px;
}

.delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.process-info {
  font-size: 0.65rem;
  opacity: 0.9;
}

.process-time {
  font-weight: 500;
  margin-bottom: 1px;
}

.process-details {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.process-line,
.process-subline {
  opacity: 0.8;
}
.process-worker {
  font-size: 0.65rem;
  opacity: 0.8;
  margin-top: 2px;
}
</style>
