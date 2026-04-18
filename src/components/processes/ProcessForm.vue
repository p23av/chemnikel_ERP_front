<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch, type PropType } from 'vue'
import type { Process } from '@/stores/processes'
import type { Order } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/auth'

import { useLinesStore } from '@/stores/lines'
const linesStore = useLinesStore()

const productsStore = useProductsStore()
const customersStore = useCustomersStore()
const authStore = useAuthStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  process: {
    type: Object as PropType<Process | null>,
    default: null,
  },
  orders: {
    type: Array as PropType<Order[]>,
    default: () => [],
  },
  selectedDate: {
    type: Date,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: Omit<Process, 'id'> & { id?: number }): void
}>()

// Состояние для выбранного заказчика
const selectedCustomerId = ref<number | null>(null)

// Состояние для хранения пользователей
const users = ref<User[]>([])

// Флаг монтирования компонента
const isComponentMounted = ref(false)

type ProcessFormData = {
  order: number | null
  line?: number | null
  subline?: number | null
  quantity: number
  start_time: string | null
  end_time: string | null
  line_display?: string
  created_at?: string
  worker: number | null
}

// Форма
const form = ref<ProcessFormData>({
  order: props.process?.order || null,
  line: props.process?.line || null,
  subline: props.process?.subline || null,
  quantity: props.process?.quantity || 1,
  start_time: props.process?.start_time || null,
  end_time: props.process?.end_time || null,
  line_display: props.process?.line_display,
  worker: props.process?.worker || null,
})

const combineDateTime = (date: Date, timeString: string | null): string | null => {
  if (!timeString) return null

  const [hours, minutes] = timeString.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result.toISOString()
}

const getTimeFromISO = (isoString: string | null): string | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Computed свойства для форматирования времени
// const startTimeForInput = computed({
//   get: () => {
//     if (form.value.start_time) {
//       return form.value.start_time.slice(0, 16)
//     }
//     // Если это создание нового процесса и нет времени - ставим текущее
//     if (!props.process?.order) {
//       return getCurrentDateTime()
//     }
//     return null
//   },
//   set: (val) => {
//     form.value.start_time = val
//   },
// })

// const endTimeForInput = computed({
//   get: () => (form.value.end_time ? form.value.end_time.slice(0, 16) : null),
//   set: (val) => {
//     form.value.end_time = val
//   },
// })

const startTime = computed({
  get: () => {
    const time = getTimeFromISO(form.value.start_time)
    return time
      ? { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }
      : null
  },
  set: (val: { hours: number; minutes: number } | null) => {
    if (val) {
      const timeString = `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`
      form.value.start_time = combineDateTime(props.selectedDate, timeString)
    } else {
      form.value.start_time = null
    }
  },
})

const endTime = computed({
  get: () => {
    const time = getTimeFromISO(form.value.end_time)
    return time
      ? { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }
      : null
  },
  set: (val: { hours: number; minutes: number } | null) => {
    if (val) {
      const timeString = `${val.hours.toString().padStart(2, '0')}:${val.minutes.toString().padStart(2, '0')}`
      form.value.end_time = combineDateTime(props.selectedDate, timeString)
    } else {
      form.value.end_time = null
    }
  },
})

// Отфильтрованные заказы с учетом всех условий
const filteredOrders = computed(() => {
  let filtered = props.orders

  // 1. Только активные заказы (status: 0)
  filtered = filtered.filter((order) => order.status === 0)

  // 2. Фильтрация по заказчику
  if (selectedCustomerId.value) {
    filtered = filtered.filter((order) => {
      const product = productsStore.getProductById(order.product)
      return product?.customer === selectedCustomerId.value
    })
  }

  // 3. Фильтрация по покрытию (выбранной линии)
  if (form.value.line) {
    const currentLineId = form.value.line
    const selectedLine = linesStore.getLineById(currentLineId)
    const lineCode = selectedLine?.code // Получаем код линии для проверки в coating_data

    filtered = filtered.filter((order) => {
      const product = productsStore.getProductById(order.product)
      if (!product?.coating_data) return false

      // Проверяем наличие ключа (кода линии) в объекте coating_data
      return lineCode ? Object.prototype.hasOwnProperty.call(product.coating_data, lineCode) : false
    })
  }

  // 4. При редактировании добавляем текущий заказ (если его нет)
  if (props.process?.order != null) {
    const currentOrder = props.orders.find((o) => o.id === props.process?.order)
    if (currentOrder && !filtered.some((o) => o.id === currentOrder.id)) {
      filtered = [...filtered, currentOrder]
    }
  }

  return filtered
})

// Список рабочих
const workers = computed(() => {
  if (props.process?.worker) {
    // При редактировании показываем всех рабочих (включая неактивных)
    return users.value.filter((user) => user.role === 'worker')
  }
  // При создании показываем только активных рабочих
  return users.value.filter((user) => user.role === 'worker' && user.is_active)
})

// Синхронизация с modelValue
const show = ref(props.modelValue)
watch(
  () => props.modelValue,
  (val) => {
    show.value = val
  },
)
watch(show, (val) => {
  emit('update:modelValue', val)
})

// Lifecycle hooks
onMounted(async () => {
  isComponentMounted.value = true

  await linesStore.init()

  // Добавить значения по умолчанию для новой формы
  if (!props.process && linesStore.activeLines.length > 0) {
    const firstLine = linesStore.activeLines[0]
    const firstSubline = linesStore.getSublinesByLine(firstLine.id)[0]
    form.value.line = firstLine.id
    form.value.subline = firstSubline?.id || null
  }

  try {
    // Загружаем пользователей и заказчиков параллельно
    await Promise.all([
      authStore.fetchAllUsers().then((fetchedUsers) => {
        if (isComponentMounted.value) {
          users.value = fetchedUsers
        }
      }),
      customersStore.fetchCustomers(), // Загружаем заказчиков, результат сохраняется в store
    ])
  } catch (error: unknown) {
    console.error('Error loading data:', error)
  }
})

onUnmounted(() => {
  isComponentMounted.value = false
})

// Обновляем форму при изменении процесса
watch(
  () => props.process,
  (proc) => {
    if (proc) {
      form.value = {
        order: proc.order || null,
        line: proc.line || null, // ИЗМЕНЕНО: null вместо '0'
        subline: proc.subline || null, // ИЗМЕНЕНО: null вместо 1
        quantity: proc.quantity || 1,
        start_time: proc.start_time || null,
        end_time: proc.end_time || null,
        line_display: proc.line_display,
        worker: proc.worker || null,
      }

      // Установить заказчика для текущего заказа
      if (proc.order) {
        const order = props.orders.find((o) => o.id === proc.order)
        if (order) {
          const product = productsStore.getProductById(order.product)
          selectedCustomerId.value = product?.customer || null

          // Здесь нужно использовать код линии для проверки в coating_data
          if (proc.line) {
            const lineCode = linesStore.getLineById(proc.line)?.code
            if (
              lineCode &&
              product?.coating_data &&
              !Object.prototype.hasOwnProperty.call(product.coating_data, lineCode)
            ) {
              form.value.order = null
            }
          }
        }
      }
    } else {
      // Сбросить форму при создании нового процесса
      form.value = {
        order: null,
        line: null, // ИЗМЕНЕНО: null вместо '0'
        subline: null, // ИЗМЕНЕНО: null вместо 1
        quantity: 1,
        start_time: null,
        end_time: null,
        line_display: undefined,
        worker: null,
      }
      selectedCustomerId.value = null
    }
  },
  { immediate: true },
)

// Функция для получения информации о заказе для отображения
const getOrderDisplayInfo = (order: Order) => {
  const product = productsStore.getProductById(order.product)
  const productName = product?.name || `Продукт #${order.product}`

  const customerName = product?.customer
    ? customersStore.getCustomerById(product.customer)?.name || 'Не указан'
    : 'Не указан'

  return `Заказ #${order.id} - ${productName} (Заказчик: ${customerName})`
}

function save() {
  if (!form.value.order) {
    alert('Выберите заказ')
    return
  }
  if (!form.value.line) {
    alert('Выберите линию покрытия')
    return
  }
  if (!form.value.subline) {
    alert('Выберите ванну')
    return
  }

  const saveData: Omit<Process, 'id'> & { id?: number } = {
    order: form.value.order,
    line: form.value.line as number, // Добавить as number
    subline: form.value.subline as number, // Добавить as number
    quantity: form.value.quantity,
    start_time: form.value.start_time,
    end_time: form.value.end_time,
    line_display: form.value.line_display,
    worker: form.value.worker,
    created_at: props.process?.created_at || new Date().toISOString(),
  }

  emit('save', { ...saveData, id: props.process?.id })
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
        {{ props.process ? '✏️ Редактировать процесс' : '➕ Добавить процесс' }}
      </h2>

      <form @submit.prevent="save" class="form">
        <!-- 1. Выбор заказчика -->
        <div class="form-group">
          <label for="customer">Заказчик</label>
          <select id="customer" v-model="selectedCustomerId" @change="form.order = null">
            <option :value="null">Все заказчики</option>
            <option
              v-for="customer in customersStore.customers || []"
              :key="customer.id"
              :value="customer.id"
            >
              {{ customer.name }}
            </option>
          </select>
        </div>

        <!-- 2. Выбор заказа -->
        <div class="form-group">
          <label for="order">Заказ</label>
          <select id="order" v-model="form.order" required>
            <option disabled :value="null">Выберите заказ</option>
            <option v-for="order in filteredOrders" :key="order.id" :value="order.id">
              {{ getOrderDisplayInfo(order) }}
            </option>
          </select>
        </div>

        <!-- 3. Линия покрытия (редактируемая только при создании) -->
        <div class="form-group">
          <label for="line">Линия покрытия</label>
          <select
            id="line"
            v-model="form.line"
            :disabled="!!props.process"
            required
            @change="((form.order = null), (form.subline = null))"
          >
            <option disabled :value="null">Выберите линию</option>
            <option v-for="line in linesStore.activeLines" :key="line.id" :value="line.id">
              {{ line.name }}
            </option>
          </select>
          <div v-if="props.process" class="field-hint">
            Линию покрытия нельзя изменить при редактировании
          </div>
        </div>

        <!-- 4. Номер ванны -->
        <div class="form-group">
          <label for="subline">Ванна</label>
          <select id="subline" v-model="form.subline" required :disabled="!form.line">
            <option disabled :value="null">Выберите ванну</option>
            <option
              v-for="sub in form.line ? linesStore.getSublinesByLine(form.line) : []"
              :key="sub.id"
              :value="sub.id"
            >
              {{ sub.name || `Ванна №${sub.number}` }}
            </option>
          </select>
        </div>

        <!-- 5. Количество -->
        <div class="form-group">
          <label for="quantity">Количество</label>
          <input
            id="quantity"
            v-model.number="form.quantity"
            type="number"
            min="1"
            placeholder="Введите количество"
            required
          />
        </div>

        <!-- 6. Исполнитель -->
        <div class="form-group">
          <label for="worker">Исполнитель</label>
          <select id="worker" v-model="form.worker">
            <option :value="null">Не назначен</option>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.full_name }} ({{ worker.username }})
            </option>
          </select>
        </div>

        <!-- 7. Время начала и окончания -->
        <div class="form-row">
          <div class="form-group">
            <label for="start_time">Время начала</label>
            <!-- <input
              id="start_time"
              v-model="startTimeForInput"
              type="datetime-local"
              class="time-input"
            /> -->
            <VueDatePicker v-model="startTime" placeholder="Выберите время" time-picker />
            <div class="field-hint">Необязательно</div>
          </div>

          <div class="form-group">
            <label for="end_time">Время окончания</label>
            <!-- <input
              id="end_time"
              v-model="endTimeForInput"
              type="datetime-local"
              class="time-input"
            /> -->
            <VueDatePicker v-model="endTime" placeholder="Выберите время" time-picker />
            <div class="field-hint">Необязательно</div>
          </div>
        </div>

        <!-- 8. Кнопки действий -->
        <div class="form-actions">
          <button type="submit" class="btn save-btn">💾 Сохранить</button>
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-input {
  font-family: inherit;
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
