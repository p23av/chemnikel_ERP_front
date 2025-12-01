<script lang="ts" setup>
import { computed, onMounted, ref, watch, type PropType } from 'vue'
import type { Process } from '@/stores/processes'
import type { Order } from '@/stores/orders'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/stores/auth'

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
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: Omit<Process, 'id'> & { id?: number }): void
}>()

// const activeOrders = computed(() => {
//   return props.orders.filter((order) => order.status === 0)
// })
const filteredOrders = computed(() => {
  // При редактировании показываем все заказы (чтобы видеть текущий)
  if (props.process?.order != null) {
    return props.orders.filter((order) => order.status === 0 || order.id === props.process?.order)
  }
  // При создании показываем только активные
  return props.orders.filter((order) => order.status === 0)
})

// Добавить состояние для хранения пользователей
const users = ref<User[]>([])
// Загрузить пользователей при монтировании
onMounted(async () => {
  try {
    users.value = await authStore.fetchAllUsers()
  } catch (error: unknown) {
    console.error('Error loading users:', error)
  }
})
const workers = computed(() => {
  // При редактировании показываем всех рабочих (включая неактивных)
  if (props.process?.worker) {
    return users.value.filter((user) => user.role === 'worker')
  }

  // При создании показываем только активных рабочих
  return users.value.filter((user) => user.role === 'worker' && user.is_active)
})

// Синхронизируем с modelValue
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

// Линии покрытий
const lines = [
  { name: 'Никель', code: '0', sublines: [1, 2] },
  { name: 'Медь', code: '1', sublines: [1] },
  { name: 'О-Ви', code: '2', sublines: [1] },
]

type ProcessFormData = {
  order: number | null
  line: string
  subline: number
  quantity: number
  start_time: string | null
  end_time: string | null
  line_display?: string
  created_at?: string
  worker: number | null
}

// Функция для получения текущего времени в нужном формате
const getCurrentDateTime = () => {
  return new Date().toISOString().slice(0, 16)
}

const form = ref<ProcessFormData>({
  order: props.process?.order || (props.orders[0]?.id ?? null),
  line: props.process?.line || '0',
  subline: props.process?.subline || 1,
  quantity: props.process?.quantity || 1,
  start_time: props.process?.start_time || getCurrentDateTime(),
  end_time: props.process?.end_time || null,
  line_display: props.process?.line_display,
  worker: props.process?.worker || null,
})
const startTimeForInput = computed({
  get: () => {
    if (form.value.start_time) {
      return form.value.start_time.slice(0, 16)
    }
    // Если это создание нового процесса и нет времени - ставим текущее
    if (!props.process?.order) {
      return getCurrentDateTime()
    }
    return null
  },
  set: (val) => {
    form.value.start_time = val
  },
})

const endTimeForInput = computed({
  get: () => (form.value.end_time ? form.value.end_time.slice(0, 16) : null),
  set: (val) => {
    form.value.end_time = val
  },
})

// Обновляем форму при изменении процесса
watch(
  () => props.process,
  (proc) => {
    if (proc) {
      // Только если процесс изменился, обновляем форму
      form.value = {
        order: proc.order || (props.orders[0]?.id ?? null),
        line: proc.line || '0',
        subline: proc.subline || 1,
        quantity: proc.quantity || 1,
        start_time: proc.start_time || null, // Сохраняем оригинальное время
        end_time: proc.end_time || null, // Сохраняем оригинальное время
        line_display: proc.line_display,
        worker: proc.worker || null,
      }
    }
  },
  { immediate: true },
)

// Получаем название продукта для заказа
// const getProductName = (productId: number) => {
//   const product = productsStore.getProductById(productId)
//   return product ? product.name : `Продукт #${productId}`
// }

// Функция для получения информации о заказе для отображения
const getOrderDisplayInfo = (order: Order) => {
  // Получаем продукт
  const product = productsStore.getProductById(order.product)
  const productName = product?.name || `Продукт #${order.product}`

  // Получаем заказчика
  const customerName = product?.customer
    ? customersStore.getCustomerById(product.customer)?.name || 'Не указан'
    : 'Не указан'

  return `Заказ #${order.id} - ${productName} (Заказчик: ${customerName})` // - ${order.quantity} шт.`
}

function save() {
  if (!form.value.order) {
    alert('Выберите заказ')
    return
  }

  // Создаем данные для сохранения
  const saveData: Omit<Process, 'id'> & { id?: number } = {
    order: form.value.order,
    line: form.value.line,
    subline: form.value.subline,
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
  <div v-if="show" class="modal-overlay" @click="cancel">
    <div class="modal" @click.stop>
      <h2 class="modal-title">
        {{ props.process ? '✏️ Редактировать процесс' : '➕ Добавить процесс' }}
      </h2>

      <form @submit.prevent="save" class="form">
        <div class="form-group">
          <label for="order">Заказ</label>
          <select id="order" v-model="form.order" required>
            <option disabled :value="null">Выберите заказ</option>
            <option v-for="order in filteredOrders" :key="order.id" :value="order.id">
              {{ getOrderDisplayInfo(order) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="line">Линия покрытия</label>
          <select id="line" v-model="form.line" required>
            <option v-for="line in lines" :key="line.code" :value="line.code">
              {{ line.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="subline">Номер ванны</label>
          <select id="subline" v-model="form.subline" required>
            <option
              v-for="sub in lines.find((l: any) => l.code === form.line)?.sublines || []"
              :key="sub"
              :value="sub"
            >
              №{{ sub }}
            </option>
          </select>
        </div>

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

        <div class="form-group">
          <label for="worker">Исполнитель</label>
          <select id="worker" v-model="form.worker">
            <option :value="null">Не назначен</option>
            <option v-for="worker in workers" :key="worker.id" :value="worker.id">
              {{ worker.full_name }} ({{ worker.username }})
            </option>
          </select>
        </div>

        <!-- Время начала и окончания -->
        <div class="form-row">
          <div class="form-group">
            <label for="start_time">Время начала</label>
            <input
              id="start_time"
              v-model="startTimeForInput"
              type="datetime-local"
              class="time-input"
            />
            <div class="field-hint">Необязательно</div>
          </div>

          <div class="form-group">
            <label for="end_time">Время окончания</label>
            <input
              id="end_time"
              v-model="endTimeForInput"
              type="datetime-local"
              class="time-input"
            />
            <div class="field-hint">Необязательно</div>
          </div>
        </div>

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
