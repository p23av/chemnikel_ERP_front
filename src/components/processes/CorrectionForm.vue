<!-- components/processes/CorrectionForm.vue -->
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import type { Correction } from '@/stores/corrections'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/auth'

import { useLinesStore } from '@/stores/lines'
const linesStore = useLinesStore()

const authStore = useAuthStore()

interface FormDataProps {
  line: number | null
  subline: number | null
  date: Date
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  correction: {
    type: Object as () => Correction | null,
    default: null,
  },
  formData: {
    type: Object as () => FormDataProps,
    default: () => ({
      line: null,
      subline: null,
      date: new Date(),
    }),
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', correction: Correction): void
}>()

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
const getTimeFromISO = (isoString: string | null): string | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const combineDateTime = (date: Date, timeString: string | null): string | null => {
  if (!timeString) return null
  const [hours, minutes] = timeString.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result.toISOString()
}

// ========== СОСТОЯНИЕ КОМПОНЕНТА ==========
const users = ref<User[]>([])
const correctionType = ref<'volume' | 'refresh'>('volume')

const form = ref({
  amount: null as number | null,
  line: null as number | null, // ИЗМЕНЕНО: теперь number | null
  subline: null as number | null, // ИЗМЕНЕНО: теперь number | null
  correction_time: '',
  worker: null as number | null,
})

const correctionTime = computed({
  get: () => {
    const time = getTimeFromISO(form.value.correction_time)
    return time
      ? { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }
      : { hours: 8, minutes: 0 }
  },
  set: (val: { hours: number; minutes: number } | null) => {
    if (val) {
      const timeString = `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`
      const date = form.value.correction_time
        ? new Date(form.value.correction_time)
        : props.formData.date
      const combined = combineDateTime(date, timeString)
      if (combined) {
        form.value.correction_time = combined
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

// onMounted(async () => {
//   try {
//     users.value = await authStore.fetchAllUsers()
//   } catch (error) {
//     console.error('Error loading users:', error)
//   }
// })
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

// КЛЮЧЕВОЙ МОМЕНТ: Инициализация формы
watch(show, async (val) => {
  if (val) {
    // Убедимся, что линии загружены
    if (linesStore.lines.length === 0) {
      await linesStore.init()
    }

    // Открываем форму - инициализируем данные
    if (props.correction) {
      // РЕДАКТИРОВАНИЕ: берем ВСЕ данные из существующей коррекции
      correctionType.value = props.correction.type
      form.value.amount = props.correction.amount
      form.value.line = props.correction.line // Теперь число
      form.value.subline = props.correction.subline // Теперь число
      form.value.correction_time = props.correction.correction_time
      form.value.worker = props.correction.worker
    } else {
      // СОЗДАНИЕ: берем данные из formData
      correctionType.value = 'volume'
      form.value.amount = null
      form.value.line = props.formData.line // Теперь число
      form.value.subline = props.formData.subline // Теперь число

      // Устанавливаем время
      const date = new Date(props.formData.date)
      date.setHours(8, 0, 0, 0) // По умолчанию 8 утра
      form.value.correction_time = date.toISOString()
      form.value.worker = null
    }
  }
})

watch(correctionType, (type) => {
  if (type === 'refresh') {
    form.value.amount = null
  } else if (!props.correction) {
    form.value.amount = 0
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
  if (correctionType.value === 'volume' && (!form.value.amount || form.value.amount <= 0)) {
    alert('Введите количество для долива')
    return
  }

  const saveData: Correction = {
    id: props.correction?.id || 0,
    type: correctionType.value,
    amount: correctionType.value === 'volume' ? form.value.amount : null,
    line: form.value.line as number, // утверждаем тип
    subline: form.value.subline as number, // утверждаем тип
    correction_time: form.value.correction_time,
    worker: form.value.worker,
    created_at: props.correction?.created_at || new Date().toISOString(),
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
        {{ correction ? '✏️ Редактировать коррекцию' : '🧪 Добавить коррекцию' }}
      </h2>

      <div class="correction-info">
        <div class="info-item">
          <strong>Ванна:</strong>
          {{ form.line ? linesStore.getLineName(form.line) : 'Не выбрана' }}
          №{{ form.subline ? linesStore.getSublineById(form.subline)?.number : '?' }}
        </div>
        <div class="info-item">
          <strong>Дата:</strong>
          {{ new Date(form.correction_time).toLocaleDateString('ru-RU') }}
        </div>
      </div>

      <form @submit.prevent="save" class="form">
        <div class="form-group">
          <label for="line">Линия покрытия</label>
          <select id="line" v-model="form.line" required :disabled="!!correction">
            <option disabled :value="null">Выберите линию</option>
            <option v-for="line in linesStore.activeLines" :key="line.id" :value="line.id">
              {{ line.name }}
            </option>
          </select>
          <div v-if="correction" class="field-hint">Линию нельзя изменить при редактировании</div>
        </div>

        <!-- Ванна -->
        <div class="form-group">
          <label for="subline">Ванна</label>
          <select
            id="subline"
            v-model="form.subline"
            required
            :disabled="!form.line || !!correction"
          >
            <option disabled :value="null">Выберите ванну</option>
            <option
              v-for="sub in form.line ? linesStore.getSublinesByLine(form.line) : []"
              :key="sub.id"
              :value="sub.id"
            >
              {{ sub.name || `Ванна №${sub.number}` }}
            </option>
          </select>
          <div v-if="correction" class="field-hint">Ванну нельзя изменить при редактировании</div>
        </div>
        <div class="form-group">
          <label>Тип коррекции</label>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                v-model="correctionType"
                value="volume"
                :disabled="!!correction"
              />
              <span class="radio-text">💧 Долив</span>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                v-model="correctionType"
                value="refresh"
                :disabled="!!correction"
              />
              <span class="radio-text">🔄 Обновление ванны</span>
            </label>
          </div>
          <div v-if="correction" class="field-hint">
            Тип коррекции нельзя изменить при редактировании
          </div>
        </div>

        <div class="form-group">
          <label for="correction_time">Время коррекции</label>
          <VueDatePicker v-model="correctionTime" placeholder="Выберите время" time-picker />
          <div class="field-hint">Обязательно для заполнения</div>
        </div>

        <div v-if="correctionType === 'volume'" class="form-group">
          <label for="amount">Количество (литры)</label>
          <input
            id="amount"
            v-model.number="form.amount"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="Введите количество"
            required
          />
          <div class="field-hint">Положительное число, например: 5.0</div>
        </div>

        <div class="form-group">
          <label for="worker">Исполнитель</label>
          <select id="worker" v-model="form.worker">
            <option :value="null">Не назначен</option>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.full_name }} ({{ worker.username }})
            </option>
          </select>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn save-btn">
            {{ correction ? '💾 Сохранить' : '➕ Добавить' }}
          </button>
          <button type="button" class="btn cancel-btn" @click="cancel">❌ Отмена</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Стили без изменений */
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

.correction-info {
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 4px;
  color: #92400e;
}

.info-item:last-child {
  margin-bottom: 0;
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label input[type='radio'] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.radio-text {
  font-size: 0.95rem;
  color: #334155;
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
  background: #3b82f6;
  color: #fff;
}

.save-btn:hover {
  background: #2563eb;
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

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
