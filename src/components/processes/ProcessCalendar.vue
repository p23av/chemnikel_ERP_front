<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
   ЛИНИИ (обновлённые)
---------------------------- */
const lines = [
  { name: 'Никель', code: '0', sublines: [1, 2, 3] }, // 3 ванны
  { name: 'Медь', code: '1', sublines: [1] }, // 1 ванна
  { name: 'О-Ви', code: '2', sublines: [1, 2] }, // 2 ванны
]

/* ---------------------------
   УПРАВЛЕНИЕ ДАТОЙ И ВРЕМЕНЕМ
---------------------------- */
const currentDate = ref(new Date())
const viewMode = ref<'day' | 'week'>('day')
const timeRange = ref({ start: 8, end: 20 }) // по умолчанию 08-20

// Переключение дат
const goToPrevious = () => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'day') {
    newDate.setDate(newDate.getDate() - 1)
  } else {
    newDate.setDate(newDate.getDate() - 7)
  }
  currentDate.value = newDate
}

const goToNext = () => {
  const newDate = new Date(currentDate.value)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (viewMode.value === 'day') {
    newDate.setDate(newDate.getDate() + 1)
  } else {
    newDate.setDate(newDate.getDate() + 7)
  }

  // Нельзя уходить в будущее
  if (newDate <= today) {
    currentDate.value = newDate
  }
}

const goToToday = () => {
  currentDate.value = new Date()
}

// Форматирование даты для отображения
const displayDate = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

/* ---------------------------
   ФИЛЬТРАЦИЯ ПРОЦЕССОВ ПО ДАТЕ
---------------------------- */
const filteredProcesses = computed(() => {
  const startOfDay = new Date(currentDate.value)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(currentDate.value)
  endOfDay.setHours(23, 59, 59, 999)

  return props.processes.filter((proc) => {
    if (!proc.start_time) return false

    const processDate = new Date(proc.start_time)
    return processDate >= startOfDay && processDate <= endOfDay
  })
})

/* ---------------------------
   ТАБЛИЧНАЯ СТРУКТУРА
---------------------------- */
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
   ЧАСЫ (динамический диапазон)
---------------------------- */
const hours = computed(() => {
  const { start, end } = timeRange.value
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

/* ---------------------------
   ГОРИЗОНТАЛЬНАЯ ЛЕНТА ДНЕЙ
---------------------------- */
const daysInWeek = computed(() => {
  const days = []
  const startOfWeek = new Date(currentDate.value)

  if (viewMode.value === 'week') {
    // Начало недели (понедельник)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
  }

  const daysCount = viewMode.value === 'day' ? 1 : 7

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    days.push(date)
  }

  return days
})

/* ---------------------------
   ФУНКЦИИ
---------------------------- */
function handleAdd(line: string, subline: number) {
  if (props.availableQuantity !== undefined && props.availableQuantity <= 0) {
    alert('Нет доступного количества для работы!')
    return
  }
  emit('add', { line, subline })
}

function getProcessesAt(line: string, subline: number, hour: number) {
  return filteredProcesses.value.filter((proc) => {
    if (String(proc.line) !== String(line) || proc.subline !== subline) {
      return false
    }

    if (!proc.start_time) return false

    const start = new Date(proc.start_time)
    const startHour = start.getHours()

    return hour === startHour
  })
}

/* ---------------------------
   ВСПОМОГАТЕЛЬНЫЕ
---------------------------- */
function getLineName(lineCode: string) {
  const line = lines.find((l) => l.code === lineCode)
  return line ? line.name : `Линия ${lineCode}`
}

// Таймер для автообновления
let timer: number | null = null
onMounted(() => {
  timer = window.setInterval(() => {}, 60000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Проверка, является ли дата сегодняшней
const isToday = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Проверка, является ли выбранная дата будущей
const isFuture = computed(() => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // конец сегодняшнего дня

  if (viewMode.value === 'day') {
    return currentDate.value > today
  } else {
    // Для недельного режима проверяем последний день недели
    const lastDayOfWeek = new Date(daysInWeek.value[daysInWeek.value.length - 1])
    lastDayOfWeek.setHours(23, 59, 59, 999)
    return lastDayOfWeek > today
  }
})
</script>

<template>
  <div class="calendar-container">
    <!-- ПАНЕЛЬ УПРАВЛЕНИЯ -->
    <div class="control-panel">
      <div class="date-controls">
        <button @click="goToPrevious" class="control-btn">◀</button>
        <button @click="goToToday" class="today-btn">Сегодня</button>
        <button @click="goToNext" class="control-btn" :disabled="isFuture">▶</button>
        <span class="current-date">{{ displayDate }}</span>
      </div>

      <div class="view-controls">
        <button @click="viewMode = 'day'" :class="{ active: viewMode === 'day' }" class="view-btn">
          День
        </button>
        <button
          @click="viewMode = 'week'"
          :class="{ active: viewMode === 'week' }"
          class="view-btn"
        >
          Неделя
        </button>
      </div>

      <div class="time-controls">
        <label>Время от:</label>
        <input v-model.number="timeRange.start" type="number" min="0" max="23" class="time-input" />
        <label>до:</label>
        <input v-model.number="timeRange.end" type="number" min="1" max="24" class="time-input" />
      </div>
    </div>

    <!-- ГОРИЗОНТАЛЬНАЯ ЛЕНТА ДНЕЙ (для недельного режима) -->
    <div v-if="viewMode === 'week'" class="days-ribbon">
      <div
        v-for="(day, index) in daysInWeek"
        :key="index"
        :class="{ today: isToday(day) }"
        class="day-column"
      >
        <div class="day-header">
          {{ day.toLocaleDateString('ru-RU', { weekday: 'short' }) }}
        </div>
        <div class="day-date">
          {{ day.getDate() }}
        </div>
      </div>
    </div>

    <!-- ОСНОВНАЯ ТАБЛИЦА -->
    <div class="table-container">
      <table class="calendar-table">
        <thead>
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
                  :start-hour="timeRange.start"
                  :end-hour="timeRange.end"
                  :cell-height="60"
                  :line-name="getLineName(proc.line)"
                  @edit="emit('edit', proc.id)"
                  @delete="emit('delete', proc.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="process-stats">
      <div class="stat-item">
        <span class="stat-label">Процессов сегодня:</span>
        <span class="stat-value">{{ filteredProcesses.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Завершено:</span>
        <span class="stat-value">
          {{ filteredProcesses.filter((p) => p.end_time).length }}
        </span>
      </div>
      <div v-if="availableQuantity !== undefined" class="stat-item">
        <span class="stat-label">Доступно:</span>
        <span class="stat-value" :class="{ warning: availableQuantity <= 0 }">
          {{ availableQuantity }} шт.
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}

.control-btn:hover:not(:disabled) {
  background: #f1f5f9;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.today-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}

.today-btn:hover {
  background: #2563eb;
}

.current-date {
  font-weight: 600;
  margin-left: 8px;
}

.view-controls {
  display: flex;
  gap: 4px;
}

.view-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.view-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.time-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.days-ribbon {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  overflow-x: auto;
}

.day-column {
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 8px;
  border-right: 1px solid #e2e8f0;
}

.day-column:last-child {
  border-right: none;
}

.day-column.today {
  background: #dbeafe;
}

.day-header {
  font-weight: 600;
  color: #475569;
}

.day-date {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.table-container {
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
</style>
