<!-- components/processes/ProcessCalendar.vue -->
<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  selectedDate: Date // ДОБАВЬ ЭТОТ ПРОПС
}>()

const emit = defineEmits<{
  (e: 'add', payload: { line: number; subline: number }): void
  (
    e: 'add-correction',
    payload: {
      line: number
      subline: number
      date: Date
    },
  ): void
  (e: 'add-boiling', payload: { line: number; subline: number; date: Date }): void
  (e: 'edit', id: number): void
  (e: 'delete', id: number): void
  (e: 'edit-correction', correction: Correction): void
  (e: 'delete-correction', id: number): void
  (e: 'edit-boiling', boiling: Boiling): void
  (e: 'delete-boiling', id: number): void
  (e: 'update:selectedDate', date: Date): void
}>()

onMounted(async () => {
  await linesStore.init()
})

/* ---------------------------
   ЛИНИИ (обновлённые)
---------------------------- */

const lines = computed(() => linesStore.activeLines)

function getLineName(lineId: number): string {
  return linesStore.getLineName(lineId)
}

/* ---------------------------
   УПРАВЛЕНИЕ ДАТОЙ И ВРЕМЕНЕМ
---------------------------- */
const currentDate = computed({
  get: () => props.selectedDate,
  set: (val: Date) => emit('update:selectedDate', val),
})
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

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
  currentDate.value = normalizeDate(newDate)
}

const goToNext = () => {
  const newDate = new Date(currentDate.value)
  const today = normalizeDate(new Date())

  if (viewMode.value === 'day') {
    newDate.setDate(newDate.getDate() + 1)
  } else {
    newDate.setDate(newDate.getDate() + 7)
  }

  // Нельзя уходить в будущее
  if (normalizeDate(newDate) <= today) {
    currentDate.value = normalizeDate(newDate)
  }
}

const goToToday = () => {
  currentDate.value = normalizeDate(new Date())
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
   ФИЛЬТРАЦИЯ КОРРЕКЦИЙ ПО ДАТЕ
---------------------------- */
const filteredCorrections = computed(() => {
  const startOfDay = new Date(currentDate.value)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(currentDate.value)
  endOfDay.setHours(23, 59, 59, 999)

  return props.corrections.filter((corr) => {
    const correctionDate = new Date(corr.correction_time)
    return correctionDate >= startOfDay && correctionDate <= endOfDay
  })
})

/* ---------------------------
   ФИЛЬТРАЦИЯ КИПЕНИЙ ПО ДАТЕ
---------------------------- */
const filteredBoilings = computed(() => {
  const startOfDay = new Date(currentDate.value)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(currentDate.value)
  endOfDay.setHours(23, 59, 59, 999)

  return props.boilings.filter((boil) => {
    const boilDate = new Date(boil.start_time)
    return boilDate >= startOfDay && boilDate <= endOfDay
  })
})

/* ---------------------------
   ТАБЛИЧНАЯ СТРУКТУРА
---------------------------- */
const columns = computed(() => {
  return lines.value.flatMap((line) => {
    const sublines = linesStore.getSublinesByLine(line.id)
    return sublines.map((sub) => ({
      line: line.id, // ТЕПЕРЬ ID, а не code
      subline: sub.id, // ТЕПЕРЬ ID ванны, а не номер
      label: sub.name || `№ ${sub.number}`,
      lineName: line.name,
    }))
  })
})

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
function handleAdd(line: number, subline: number) {
  if (props.availableQuantity !== undefined && props.availableQuantity <= 0) {
    alert('Нет доступного количества для работы!')
    return
  }
  emit('add', { line, subline })
}

// Функция для добавления коррекции - открывает модалку
function handleAddCorrection(line: number, subline: number) {
  // Передаем только линию и ванну, дата берется из currentDate
  emit('add-correction', {
    line,
    subline,
    // hour больше не нужен, так как время выбирается в форме
    date: currentDate.value, // передаем дату из календаря
  })
}

function getProcessesAt(line: number, subline: number, hour: number) {
  return filteredProcesses.value.filter((proc) => {
    if (proc.line !== line || proc.subline !== subline) {
      return false
    }

    if (!proc.start_time) return false

    const start = new Date(proc.start_time)
    const startHour = start.getHours()

    return hour === startHour
  })
}

// Получить коррекции для конкретной ячейки (по линии, саблине и часу)
function getCorrectionsAt(line: number, subline: number, hour: number) {
  return filteredCorrections.value.filter((corr) => {
    // Было: proc.line !== line
    // Стало: corr.line !== line
    if (corr.line !== line || corr.subline !== subline) {
      return false
    }

    const correctionHour = new Date(corr.correction_time).getHours()
    return correctionHour === hour
  })
}
// Получить кипения для конкретной ячейки
function getBoilingsAt(subline: number, hour: number) {
  return filteredBoilings.value.filter((boil) => {
    if (boil.subline !== subline) return false

    const start = new Date(boil.start_time)
    const startHour = start.getHours()

    // Кипение может занимать несколько часов, поэтому показываем в часе начала
    return hour === startHour
  })
}

/* ---------------------------
   ВСПОМОГАТЕЛЬНЫЕ
---------------------------- */
// function getLineName(lineCode: string) {
//   const line = lines.value.find((l) => l.code === lineCode)
//   return line ? line.name : `Линия ${lineCode}`
// }

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
  const today = normalizeDate(new Date())
  return normalizeDate(date).getTime() === today.getTime()
}

// Проверка, является ли выбранная дата будущей
const isFuture = computed(() => {
  const today = normalizeDate(new Date())
  const selected = normalizeDate(currentDate.value)

  if (viewMode.value === 'day') {
    return selected > today
  } else {
    const lastDayOfWeek = new Date(daysInWeek.value[daysInWeek.value.length - 1])
    lastDayOfWeek.setHours(23, 59, 59, 999)
    return lastDayOfWeek > today
  }
})

function handleAddBoiling(line: number, subline: number) {
  emit('add-boiling', {
    line,
    subline,
    date: currentDate.value,
  })
}
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
              :key="line.id"
              :colspan="linesStore.getSublinesByLine(line.id).length"
              class="line-header"
            >
              {{ line.name }}
            </th>
          </tr>

          <tr>
            <th v-for="col in columns" :key="col.line + '-' + col.subline" class="subline-header">
              <div class="subline-actions">
                <button
                  class="add-btn-header"
                  @click="handleAdd(col.line, col.subline)"
                  title="Добавить процесс"
                  :disabled="availableQuantity !== undefined && availableQuantity <= 0"
                >
                  + Процесс
                </button>
                <button
                  v-if="linesStore.getLineById(col.line)?.has_corrections"
                  class="add-correction-header-btn"
                  @click="handleAddCorrection(col.line, col.subline)"
                  title="Добавить коррекцию"
                >
                  🧪
                </button>
                <button
                  v-if="linesStore.getLineById(col.line)?.can_boil"
                  class="add-boiling-header-btn"
                  @click="handleAddBoiling(col.line, col.subline)"
                  title="Добавить кипение"
                >
                  🔥
                </button>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="hour in hours" :key="hour">
            <td class="time-col">{{ hour.toString().padStart(2, '0') }}:00</td>

            <td
              v-for="col in columns"
              :key="col.line + '-' + col.subline + '-' + hour"
              class="cell"
            >
              <div class="cell-inner">
                <!-- Кипения (на всю ширину, под процессами и коррекциями) -->
                <div class="boilings-layer">
                  <BoilingCard
                    v-for="boil in getBoilingsAt(col.subline, hour)"
                    :key="boil.id"
                    :boiling="boil"
                    :cell-height="60"
                    @edit="emit('edit-boiling', boil)"
                    @delete="emit('delete-boiling', boil.id)"
                  />
                </div>

                <!-- Процессы (слева, 80%) -->
                <div class="processes-column">
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

                <!-- Коррекции (справа, 20%) -->
                <div class="corrections-column">
                  <CorrectionCard
                    v-for="corr in getCorrectionsAt(col.line, col.subline, hour)"
                    :key="corr.id"
                    :correction="corr"
                    @edit="emit('edit-correction', corr)"
                    @delete="emit('delete-correction', corr.id)"
                  />
                </div>
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
.subline-actions {
  display: flex;
  justify-content: space-between;
}
.calendar-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
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
  overflow-y: auto;
  flex: 1;
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
  min-width: 300px;
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
  /* margin-top: 1rem; */
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

/* Планшеты в ландшафтной ориентации */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .calendar-container {
    gap: 4px;
  }
  .control-panel {
    padding: 0;
  }
  .line-header {
    padding: 0;
  }
  .view-controls {
    display: none;
  }
  .calendar-table td {
    height: 40px;
  }
}

/* .cell-inner {
  display: grid;
  grid-template-columns: 4fr 1fr; */ /*80% | 20% */
/*  height: 100%;
  gap: 2px;
  padding: 2px;
} */
.cell-inner {
  position: relative;
  height: 100%;
  width: 100%;
}

.boilings-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* z-index: 1; */
  pointer-events: none; /* чтобы не мешать кликам по процессам */
}

.boilings-layer > * {
  pointer-events: auto; /* чтобы на карточки кипения можно было кликать */
}

/* .processes-column {
  position: relative;
  min-height: 56px; */ /* Высота ячейки минус padding */ /*
} */
.processes-column {
  position: relative;
  width: 80%;
  height: 100%;
  float: left;
  z-index: 2;
}

/* .corrections-column {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 56px;
  overflow-y: auto;
  padding-right: 2px;
} */
.corrections-column {
  position: relative;
  width: 20%;
  height: 100%;
  float: right;
  z-index: 2;
  /* overflow-y: auto; */
}

.add-boiling-header-btn {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0 0.35rem;
  font-size: 0.75rem;
  margin-left: 0.2rem;
  cursor: pointer;
  transition: background 0.2s;
}

.add-boiling-header-btn:hover {
  background: #ea580c;
}

.corrections-column::-webkit-scrollbar {
  width: 3px;
}

.corrections-column::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.add-correction-btn {
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 2px;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  align-self: flex-end;
  transition: background 0.2s;
}

.add-correction-btn:hover {
  background: #d97706;
}
</style>
