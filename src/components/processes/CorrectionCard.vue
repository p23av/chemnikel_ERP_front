<!-- components/processes/CorrectionCard.vue -->
<script lang="ts" setup>
import { computed } from 'vue'
import type { Correction } from '@/stores/corrections'

const props = defineProps<{
  correction: Correction
  cellHeight?: number // высота одного часа, по умолчанию 48px
}>()

const emit = defineEmits<{
  (e: 'edit', correction: Correction): void
  (e: 'delete', id: number): void
}>()

// Вычисляем смещение по вертикали (как в ProcessCard)
const cellHeight = computed(() => props.cellHeight ?? 48)

const topOffset = computed(() => {
  const correctionDate = new Date(props.correction.correction_time)
  const minutes = correctionDate.getMinutes()

  // Смещение внутри ячейки: минуты / 60 * высота ячейки
  const minutesOffset = (minutes / 60) * cellHeight.value
  return minutesOffset
})

// Текст для отображения в зависимости от типа
const displayText = computed(() => {
  if (props.correction.type === 'volume' && props.correction.amount !== null) {
    return `+${props.correction.amount.toFixed(1)}л`
  } else {
    return '🔄'
  }
})

// Время коррекции (часы:минуты)
const displayTime = computed(() => {
  const date = new Date(props.correction.correction_time)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

function handleClick() {
  emit('edit', props.correction)
}

function handleDelete(event: Event) {
  event.stopPropagation()
  if (confirm('Удалить эту коррекцию?')) {
    emit('delete', props.correction.id)
  }
}
</script>

<template>
  <div
    class="correction-card"
    :style="{
      top: `${topOffset}px`,
    }"
    @click="handleClick"
  >
    <span class="correction-time">{{ displayTime }}</span>
    <span class="correction-value">{{ displayText }}</span>
    <button class="delete-btn" @click="handleDelete" title="Удалить">×</button>
  </div>
</template>

<style scoped>
.correction-card {
  position: absolute;
  right: 0px;
  width: 100%;
  background: #f0f9ff;
  border: 1px solid #7dd3fc;
  border-radius: 3px;
  padding: 2px 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.65rem;
  box-sizing: border-box;
  z-index: 98; /* Ниже чем процессы */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.correction-card:hover {
  background: #e0f2fe;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(3, 105, 161, 0.2);
}

.correction-time {
  font-weight: 600;
  color: #0369a1;
  white-space: nowrap;
  font-size: 0.6rem;
  line-height: 1;
}

.correction-value {
  font-weight: 600;
  color: #0c4a6e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.65rem;
  line-height: 1;
}

.delete-btn {
  position: absolute;
  top: 1px;
  right: 1px;
  background: rgba(3, 105, 161, 0.1);
  border: none;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  cursor: pointer;
  font-size: 0.6rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0369a1;
  opacity: 0.7;
  z-index: 10;
}

.delete-btn:hover {
  background: rgba(3, 105, 161, 0.2);
  opacity: 1;
}
</style>
