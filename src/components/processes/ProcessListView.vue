<!-- components/processes/ProcessListView.vue -->
<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import type { Process } from '@/stores/processes'
import type { Correction } from '@/stores/corrections'
import type { Boiling } from '@/stores/boilings'
import ProcessCard from './ProcessCard.vue'
import CorrectionCard from './CorrectionCard.vue'
import BoilingCard from './BoilingCard.vue'

import { useLinesStore } from '@/stores/lines'
const linesStore = useLinesStore()

const props = defineProps<{
  processes: Process[]
  corrections: Correction[]
  boilings: Boiling[]
  availableQuantity?: number
  selectedDate: Date
}>()

const emit = defineEmits<{
  (e: 'add', payload: { line: number; subline: number }): void
  (e: 'add-correction', payload: { line: number; subline: number; date: Date }): void
  (e: 'add-boiling', payload: { line: number; subline: number; date: Date }): void
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
  (e: 'edit-correction', correction: Correction): void
  (e: 'delete-correction', id: number): void
  (e: 'edit-boiling', boiling: Boiling): void
  (e: 'delete-boiling', id: number): void
}>()

onMounted(async () => {
  await linesStore.init()
})

const lines = computed(() => linesStore.activeLines)

function getLineName(lineId: number): string {
  return linesStore.getLineName(lineId)
}

/* ---------------------------
   ФИЛЬТРАЦИЯ ПО ДАТЕ
---------------------------- */
const startOfDay = computed(() => {
  const date = new Date(props.selectedDate)
  date.setHours(0, 0, 0, 0)
  return date
})

const endOfDay = computed(() => {
  const date = new Date(props.selectedDate)
  date.setHours(23, 59, 59, 999)
  return date
})

const filteredProcesses = computed(() => {
  return props.processes.filter((proc) => {
    if (!proc.start_time) return false
    const processDate = new Date(proc.start_time)
    return processDate >= startOfDay.value && processDate <= endOfDay.value
  })
})

const filteredCorrections = computed(() => {
  return props.corrections.filter((corr) => {
    const correctionDate = new Date(corr.correction_time)
    return correctionDate >= startOfDay.value && correctionDate <= endOfDay.value
  })
})

const filteredBoilings = computed(() => {
  return props.boilings.filter((boil) => {
    const boilDate = new Date(boil.start_time)
    return boilDate >= startOfDay.value && boilDate <= endOfDay.value
  })
})

/* ---------------------------
   ФОРМИРОВАНИЕ КОЛОНОК (линии + ванны)
---------------------------- */
const columns = computed(() => {
  return lines.value.flatMap((line) => {
    const sublines = linesStore.getSublinesByLine(line.id)
    return sublines.map((sub) => ({
      line: line.id,
      subline: sub.id,
      label: sub.name || `Ванна №${sub.number}`,
      lineName: line.name,
    }))
  })
})

/* ---------------------------
   ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ ДЛЯ КОЛОНКИ
   (процессы + коррекции + кипения вместе, отсортированные по времени)
---------------------------- */
interface TimelineItem {
  type: 'process' | 'correction' | 'boiling'
  id: number
  time: Date
  data: Process | Correction | Boiling
}

function getTimelineItemsForColumn(sublineId: number): TimelineItem[] {
  const items: TimelineItem[] = []

  // Добавляем процессы
  filteredProcesses.value
    .filter((proc) => proc.subline === sublineId)
    .forEach((proc) => {
      if (proc.start_time) {
        items.push({
          type: 'process',
          id: proc.id,
          time: new Date(proc.start_time),
          data: proc,
        })
      }
    })

  // Добавляем коррекции
  filteredCorrections.value
    .filter((corr) => corr.subline === sublineId)
    .forEach((corr) => {
      items.push({
        type: 'correction',
        id: corr.id,
        time: new Date(corr.correction_time),
        data: corr,
      })
    })

  // Добавляем кипения
  filteredBoilings.value
    .filter((boil) => boil.subline === sublineId)
    .forEach((boil) => {
      items.push({
        type: 'boiling',
        id: boil.id,
        time: new Date(boil.start_time),
        data: boil,
      })
    })

  // Сортируем по времени
  items.sort((a, b) => a.time.getTime() - b.time.getTime())

  return items
}

/* ---------------------------
   ФУНКЦИИ ДОБАВЛЕНИЯ
---------------------------- */
function handleAdd(line: number, subline: number) {
  if (props.availableQuantity !== undefined && props.availableQuantity <= 0) {
    alert('Нет доступного количества для работы!')
    return
  }
  emit('add', { line, subline })
}

function handleAddCorrection(line: number, subline: number) {
  emit('add-correction', {
    line,
    subline,
    date: props.selectedDate,
  })
}

function handleAddBoiling(line: number, subline: number) {
  emit('add-boiling', {
    line,
    subline,
    date: props.selectedDate,
  })
}
</script>

<template>
  <div class="list-view-container">
    <div class="columns-wrapper">
      <!-- КОЛОНКИ -->
      <div v-for="col in columns" :key="col.line + '-' + col.subline" class="column">
        <!-- ЗАГОЛОВОК КОЛОНКИ -->
        <div class="column-header">
          <div class="column-title">
            <span class="line-name">{{ col.lineName }}</span>
            <span class="subline-name">{{ col.label }}</span>
          </div>
          <div class="column-actions">
            <button
              class="add-btn"
              @click="handleAdd(col.line, col.subline)"
              title="Добавить процесс"
              :disabled="availableQuantity !== undefined && availableQuantity <= 0"
            >
              + Процесс
            </button>
            <button
              v-if="linesStore.getLineById(col.line)?.has_corrections"
              class="add-correction-btn"
              @click="handleAddCorrection(col.line, col.subline)"
              title="Добавить коррекцию"
            >
              🧪
            </button>
            <button
              v-if="linesStore.getLineById(col.line)?.can_boil"
              class="add-boiling-btn"
              @click="handleAddBoiling(col.line, col.subline)"
              title="Добавить кипение"
            >
              🔥
            </button>
          </div>
        </div>

        <!-- КОНТЕНТ КОЛОНКИ (список карточек) -->
        <div class="column-content">
          <div
            v-for="item in getTimelineItemsForColumn(col.subline)"
            :key="item.type + '-' + item.id"
            class="timeline-item"
          >
            <!-- Карточка процесса -->
            <ProcessCard
              v-if="item.type === 'process'"
              :process="item.data as Process"
              :cell-height="60"
              :line-name="getLineName((item.data as Process).line)"
              style="position: relative; width: 100%; margin-bottom: 8px"
              @edit="emit('edit', (item.data as Process).id)"
              @delete="emit('delete', (item.data as Process).id)"
            />

            <!-- Карточка коррекции -->
            <CorrectionCard
              v-else-if="item.type === 'correction'"
              :correction="item.data as Correction"
              style="position: relative; width: 100%; margin-bottom: 8px"
              @edit="emit('edit-correction', item.data as Correction)"
              @delete="emit('delete-correction', (item.data as Correction).id)"
            />

            <!-- Карточка кипения -->
            <BoilingCard
              v-else-if="item.type === 'boiling'"
              :boiling="item.data as Boiling"
              style="position: relative; width: 100%; margin-bottom: 8px"
              @edit="emit('edit-boiling', item.data as Boiling)"
              @delete="emit('delete-boiling', (item.data as Boiling).id)"
            />
          </div>

          <div v-if="getTimelineItemsForColumn(col.subline).length === 0" class="empty-column">
            Нет событий
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-view-container {
  height: 100%;
  overflow-x: auto;
}

.columns-wrapper {
  display: flex;
  gap: 16px;
  padding: 8px;
  min-width: 100%;
  height: 100%;
}

.column {
  flex: 1;
  min-width: 280px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.column-header {
  background: #f8fafc;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.column-title {
  display: flex;
  flex-direction: column;
}

.line-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.subline-name {
  font-size: 0.7rem;
  color: #64748b;
}

.column-actions {
  display: flex;
  gap: 4px;
}

.add-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.7rem;
  cursor: pointer;
}

.add-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.add-correction-btn {
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.7rem;
  cursor: pointer;
}

.add-boiling-btn {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.7rem;
  cursor: pointer;
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  width: 100%;
}

.empty-column {
  text-align: center;
  color: #94a3b8;
  font-size: 0.8rem;
  padding: 20px;
}
</style>
