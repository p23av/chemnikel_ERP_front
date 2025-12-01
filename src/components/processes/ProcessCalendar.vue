<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue'
import type { Process } from '@/stores/processes'

import ProcessCard from './ProcessCard.vue'

const props = defineProps<{
  processes: Process[]
  availableQuantity?: number
}>()

const emit = defineEmits<{
  (e: 'add', payload: { line: string; subline: number }): void
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
}>()

/* ---------------------------
   ЛИНИИ (как на бэкенде)
---------------------------- */
const lines = [
  { name: 'Никель', code: '0', sublines: [1, 2, 3] },
  { name: 'Медь', code: '1', sublines: [1] },
  { name: 'О-Ви', code: '2', sublines: [1, 2] },
]

/* -----------------------------------
   Табличная структура
-------------------------------------- */
const columns = computed(() =>
  lines.flatMap((line) =>
    line.sublines.map((sub) => ({
      line: line.code,
      subline: sub,
      label: `№ ${sub}`,
      lineName: line.name,
    })),
  ),
)

/* ---------------------------
   ЧАСЫ
---------------------------- */
const startHour = 0
const endHour = 23
const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

let timer: number | null = null
onMounted(() => {
  timer = window.setInterval(() => {}, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

/* -------------------------------------
   HANDLERS
-------------------------------------- */
function handleAdd(line: string, subline: number) {
  console.log('🟢 ProcessCalendar: Add button clicked', { line, subline })
  console.log('🟢 ProcessCalendar: availableQuantity', props.availableQuantity)

  if (props.availableQuantity !== undefined && props.availableQuantity <= 0) {
    alert('Нет доступного количества для работы!')
    return
  }

  console.log('🟢 ProcessCalendar: Emitting add event')
  emit('add', { line, subline })
}

function handleEdit(id: number) {
  emit('edit', id)
}

function handleDelete(id: number) {
  if (confirm('Удалить этот процесс?')) emit('delete', id)
}

/* ------------------------------------------------------
   Получение процессов для ячейки
------------------------------------------------------- */
function getProcessesAt(line: string, subline: number, hour: number) {
  const nowHour = new Date().getHours()
  return props.processes.filter((proc) => {
    if (String(proc.line) !== String(line) || proc.subline !== subline) {
      return false
    }

    if (!proc.start_time) {
      return hour === nowHour
    }

    const start = new Date(proc.start_time)
    const startHour = start.getHours()

    // Показываем процесс ТОЛЬКО в ячейке часа начала
    return hour === startHour
  })
}

/* Получение имени линии */
function getLineName(lineCode: string) {
  const line = lines.find((l) => l.code === lineCode)
  return line ? line.name : `Линия ${lineCode}`
}
</script>

<template>
  <div class="calendar-container">
    <table class="calendar-table">
      <thead>
        <!-- Первый уровень заголовков -->
        <tr>
          <th class="time-col" rowspan="2">Время</th>
          <th
            v-for="line in lines"
            :key="line.code"
            :colspan="line.sublines.length"
            class="line-header"
          >
            {{ line.name }}
          </th>
        </tr>

        <!-- Второй уровень заголовков -->
        <tr>
          <th v-for="col in columns" :key="col.line + col.subline" class="subline-header">
            {{ col.label }}
            <button
              class="add-btn-header"
              @click="handleAdd(col.line, col.subline)"
              title="Добавить процесс"
              :disabled="availableQuantity !== undefined && availableQuantity <= 0"
            >
              +
            </button>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="hour in hours" :key="hour">
          <td class="time-col">{{ hour.toString().padStart(2, '0') }}:00</td>

          <td v-for="col in columns" :key="col.line + col.subline" class="cell">
            <div class="cell-inner">
              <ProcessCard
                v-for="proc in getProcessesAt(col.line, col.subline, hour)"
                :key="proc.id"
                :process="proc"
                :start-hour="8"
                :end-hour="20"
                :cell-height="60"
                :line-name="getLineName(proc.line)"
                @edit="handleEdit(proc.id)"
                @delete="handleDelete(proc.id)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Статистика -->
    <div class="process-stats">
      <div class="stat-item">
        <span class="stat-label">Всего процессов:</span>
        <span class="stat-value">{{ processes.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Завершено:</span>
        <span class="stat-value">
          {{ processes.filter((p) => p.end_time).length }}
        </span>
      </div>
      <div v-if="availableQuantity !== undefined" class="stat-item">
        <span class="stat-label">Доступно для работы:</span>
        <span class="stat-value" :class="{ warning: availableQuantity <= 0 }">
          {{ availableQuantity }} шт.
        </span>
      </div>
    </div>

    <div v-if="availableQuantity === undefined" class="empty-hint">
      Выберите заказ слева, чтобы добавить процессы
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  overflow-x: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.85rem;
}

.calendar-table thead {
  background: #f1f5f9;
}

.line-header {
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  font-weight: 600;
}

.subline-header {
  border: 1px solid #e2e8f0;
  padding: 0.3rem;
  font-weight: 500;
  background: #f8fafc;
  position: relative;
}

.add-btn-header {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 0.35rem;
  font-size: 0.75rem;
  margin-left: 0.4rem;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn-header:hover:not(:disabled) {
  background: #2563eb;
}

.add-btn-header:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.calendar-table td {
  border: 1px solid #e2e8f0;
  height: 60px;
  vertical-align: middle;
  position: relative;
}

.time-col {
  width: 70px;
  background: #f8fafc;
  font-weight: 500;
}

.process-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 6px;
  border-top: 1px solid #e2e8f0;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
}

.stat-value.warning {
  color: #dc2626;
}

.empty-hint {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
}
</style>
