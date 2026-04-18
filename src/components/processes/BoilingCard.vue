<script lang="ts" setup>
import { computed } from 'vue'
import type { Boiling } from '@/stores/boilings'

const props = defineProps<{
  boiling: Boiling
  cellHeight?: number // высота одного часа, по умолчанию 48px
}>()

const emit = defineEmits<{
  (e: 'edit', boiling: Boiling): void
  (e: 'delete', id: number): void
}>()

// Вычисляем смещение по вертикали (как в ProcessCard и CorrectionCard)
const cellHeight = computed(() => props.cellHeight ?? 48)

const topOffset = computed(() => {
  const startDate = new Date(props.boiling.start_time)
  const minutes = startDate.getMinutes()

  // Смещение внутри ячейки: минуты / 60 * высота ячейки
  const minutesOffset = (minutes / 60) * cellHeight.value
  return minutesOffset
})

const height = computed(() => {
  const start = new Date(props.boiling.start_time)
  const end = new Date(props.boiling.end_time)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  return Math.max(durationHours * cellHeight.value, 25) // минимальная высота 25px
})

// Время кипения для отображения
const displayTime = computed(() => {
  const start = new Date(props.boiling.start_time)
  const end = new Date(props.boiling.end_time)

  const startStr = start.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const endStr = end.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${startStr} - ${endStr}`
})

function handleClick() {
  emit('edit', props.boiling)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  if (confirm('Удалить запись о кипении?')) {
    emit('delete', props.boiling.id)
  }
}
</script>

<template>
  <div
    class="boiling-card"
    :style="{
      top: `${topOffset}px`,
      height: `${height}px`,
    }"
    @click="handleClick"
  >
    <div class="boiling-header">
      <span class="boiling-title">🔥 Кипение</span>
      <button class="delete-btn" @click="handleDelete" title="Удалить">×</button>
    </div>
    <div class="boiling-time">{{ displayTime }}</div>
  </div>
</template>

<style scoped>
.boiling-card {
  position: absolute;
  left: 2px;
  right: 2px;
  background: #fef3c7; /* желтый фон */
  border: 1px solid #fbbf24;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 0.7rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.15s;
  z-index: 97; /* ниже процессов (99) и коррекций (98) */
  color: #92400e;
  display: flex;
  justify-content: space-around;
}

.boiling-card:hover {
  background: #fde68a;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
}

.boiling-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.boiling-title {
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.boiling-time {
  font-size: 0.6rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(251, 191, 36, 0.2);
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
  opacity: 0.7;
  z-index: 10;
}

.delete-btn:hover {
  background: rgba(251, 191, 36, 0.4);
  opacity: 1;
}
</style>
