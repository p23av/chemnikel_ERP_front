<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { Boiling } from '@/stores/boilings'
import { useAuthStore } from '@/stores/auth'
import { useLinesStore } from '@/stores/lines'
import type { User } from '@/stores/auth'

const authStore = useAuthStore()
const linesStore = useLinesStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  boiling: {
    type: Object as () => Boiling | null,
    default: null,
  },
  formData: {
    type: Object,
    default: () => ({
      line: null as number | null,
      subline: null as number | null,
      date: new Date(),
    }),
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', boiling: Boiling): void
}>()

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
const getTimeFromISO = (isoString: string | null): string | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  // Получаем ЛОКАЛЬНЫЕ часы и минуты
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const combineDateTime = (date: Date, timeString: string | null): string | null => {
  if (!timeString) return null

  const [hours, minutes] = timeString.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)

  // Формируем строку с локальным часовым поясом
  const year = result.getFullYear()
  const month = (result.getMonth() + 1).toString().padStart(2, '0')
  const day = result.getDate().toString().padStart(2, '0')
  const hour = hours.toString().padStart(2, '0')
  const minute = minutes.toString().padStart(2, '0')

  // Получаем смещение часового пояса (+03:00 для Москвы)
  const offset = -result.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset >= 0 ? '+' : '-'
  const offsetStr = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`

  return `${year}-${month}-${day}T${hour}:${minute}:00${offsetStr}`
}

// const parseDateFromAPI = (dateStr: string): Date => {
//   const [year, month, day] = dateStr.split('-').map(Number)
//   return new Date(year, month - 1, day, 0, 0, 0, 0)
// }

// ========== СОСТОЯНИЕ КОМПОНЕНТА ==========
const users = ref<User[]>([])

const form = ref({
  line: null as number | null,
  subline: null as number | null,
  start_time: '',
  end_time: '',
  worker: null as number | null,
})

const startTime = computed({
  get: () => {
    const time = getTimeFromISO(form.value.start_time)
    return time
      ? { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }
      : { hours: 8, minutes: 0 }
  },
  set: (val: { hours: number; minutes: number } | null) => {
    if (val) {
      const timeString = `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`

      // Определяем базовую дату
      let baseDate: Date
      if (props.boiling) {
        // При редактировании - берём дату из существующего start_time
        baseDate = new Date(form.value.start_time)
      } else {
        // При создании - берём дату из formData (selectedDate)
        baseDate = new Date(props.formData.date)
      }

      const combined = combineDateTime(baseDate, timeString)
      if (combined) {
        form.value.start_time = combined
      }
    }
  },
})

const endTime = computed({
  get: () => {
    const time = getTimeFromISO(form.value.end_time)
    return time
      ? { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }
      : { hours: 10, minutes: 0 }
  },
  set: (val: { hours: number; minutes: number } | null) => {
    if (val) {
      const timeString = `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`

      // Определяем базовую дату
      let baseDate: Date
      if (props.boiling) {
        // При редактировании - берём дату из существующего end_time
        baseDate = new Date(form.value.end_time)
      } else {
        // При создании - берём дату из formData (selectedDate)
        baseDate = new Date(props.formData.date)
      }

      const combined = combineDateTime(baseDate, timeString)
      if (combined) {
        form.value.end_time = combined
      }
    }
  },
})

const workers = computed(() => {
  return users.value.filter((user) => user.role === 'worker' && user.is_active)
})

// ========== LIFECYCLE ==========
const show = ref(props.modelValue)
watch(
  () => props.modelValue,
  (val) => {
    show.value = val
  },
)
watch(show, (val) => emit('update:modelValue', val))

onMounted(async () => {
  try {
    await Promise.all([
      linesStore.init(),
      authStore.fetchAllUsers().then((fetchedUsers) => {
        users.value = fetchedUsers
      }),
    ])
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

// Инициализация формы при открытии
watch(show, async (val) => {
  if (val) {
    // Убедимся, что линии загружены
    if (linesStore.lines.length === 0) {
      await linesStore.init()
    }

    if (props.boiling) {
      // РЕДАКТИРОВАНИЕ
      // const boilingDate = parseDateFromAPI(props.boiling.date)

      form.value = {
        line: props.boiling.line_id,
        subline: props.boiling.subline,
        // date: boilingDate,
        start_time: props.boiling.start_time,
        end_time: props.boiling.end_time,
        worker: props.boiling.worker,
      }
    } else {
      // СОЗДАНИЕ
      const baseDate = new Date(props.formData.date)

      form.value = {
        line: props.formData.line,
        subline: props.formData.subline,
        // date: baseDate,
        start_time: combineDateTime(baseDate, '08:00') || '',
        end_time: combineDateTime(baseDate, '10:00') || '',
        worker: null,
      }
    }
  }
})

// ========== МЕТОДЫ ==========
function save() {
  if (!form.value.line) {
    alert('Выберите линию')
    return
  }
  if (!form.value.subline) {
    alert('Выберите ванну')
    return
  }
  if (!form.value.start_time || !form.value.end_time) {
    alert('Укажите время начала и окончания')
    return
  }

  // Проверка, что время начала меньше времени окончания
  const start = new Date(form.value.start_time)
  const end = new Date(form.value.end_time)
  if (start >= end) {
    alert('Время окончания должно быть позже времени начала')
    return
  }

  // Получаем дату из start_time (она уже правильная, с учётом часового пояса)
  const startDate = new Date(form.value.start_time)
  const year = startDate.getFullYear()
  const month = (startDate.getMonth() + 1).toString().padStart(2, '0')
  const day = startDate.getDate().toString().padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  const saveData: Boiling = {
    id: props.boiling?.id || 0,
    subline: form.value.subline as number,
    subline_number: 0,
    subline_name: '',
    line_id: form.value.line as number,
    line_name: '',
    date: dateStr, // ← ДОБАВЛЕНО
    start_time: form.value.start_time,
    end_time: form.value.end_time,
    worker: form.value.worker,
    created_at: props.boiling?.created_at || new Date().toISOString(),
  }

  emit('save', saveData)
  show.value = false
}

function cancel() {
  show.value = false
}
</script>

<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal" @click.stop>
      <h2 class="modal-title">
        {{ boiling ? '✏️ Редактировать кипение' : '🔥 Добавить кипение' }}
      </h2>

      <form @submit.prevent="save" class="form">
        <!-- Линия покрытия -->
        <div class="form-group">
          <label for="line">Линия покрытия</label>
          <select id="line" v-model="form.line" required :disabled="!!boiling">
            <option disabled :value="null">Выберите линию</option>
            <option v-for="line in linesStore.linesThatCanBoil" :key="line.id" :value="line.id">
              {{ line.name }}
            </option>
          </select>
          <div v-if="boiling" class="field-hint">Линию нельзя изменить при редактировании</div>
        </div>

        <!-- Ванна -->
        <div class="form-group">
          <label for="subline">Ванна</label>
          <select id="subline" v-model="form.subline" required :disabled="!form.line || !!boiling">
            <option disabled :value="null">Выберите ванну</option>
            <option
              v-for="sub in form.line ? linesStore.getSublinesByLine(form.line) : []"
              :key="sub.id"
              :value="sub.id"
            >
              {{ sub.name || `Ванна №${sub.number}` }}
            </option>
          </select>
          <div v-if="boiling" class="field-hint">Ванну нельзя изменить при редактировании</div>
        </div>

        <!-- Время начала -->
        <div class="form-group">
          <label for="start_time">Время начала</label>
          <VueDatePicker v-model="startTime" placeholder="Выберите время" time-picker />
        </div>

        <!-- Время окончания -->
        <div class="form-group">
          <label for="end_time">Время окончания</label>
          <VueDatePicker v-model="endTime" placeholder="Выберите время" time-picker />
        </div>

        <!-- Исполнитель -->
        <div class="form-group">
          <label for="worker">Исполнитель</label>
          <select id="worker" v-model="form.worker">
            <option :value="null">Не назначен</option>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.full_name }} ({{ worker.username }})
            </option>
          </select>
        </div>

        <!-- Кнопки -->
        <div class="form-actions">
          <button type="submit" class="btn save-btn">
            {{ boiling ? '💾 Сохранить' : '🔥 Добавить' }}
          </button>
          <button type="button" class="btn cancel-btn" @click="cancel">❌ Отмена</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 41, 59, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 480px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.25s ease;
}

.modal-title {
  margin-bottom: 1.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: #334155;
}

.form-group input,
.form-group select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  outline: none;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.1s ease;
}

.btn:active {
  transform: scale(0.97);
}

.save-btn {
  background: #f97316;
  color: #fff;
}

.save-btn:hover {
  background: #ea580c;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
