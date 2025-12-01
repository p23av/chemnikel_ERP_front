<script lang="ts" setup>
import { ref, computed, type Ref, onMounted, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProcessesStore } from '@/stores/processes'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'

import type { Order } from '@/stores/orders'
import type { Process } from '@/stores/processes'

import OrderForm from '@/components/orders/OrderForm.vue'
import ProcessCalendar from '@/components/processes/ProcessCalendar.vue'
import ProcessForm from '@/components/processes/ProcessForm.vue'

// хранилища
const ordersStore = useOrdersStore()
const processesStore = useProcessesStore()
const productsStore = useProductsStore()
const customerStore = useCustomersStore()

// состояния загрузки
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// загружаем данные при монтировании
onMounted(async () => {
  await loadInitialData()
})
async function loadInitialData() {
  isLoading.value = true
  loadError.value = null

  try {
    // Загружаем все данные параллельно
    await Promise.all([
      ordersStore.fetchOrders(),
      processesStore.fetchProcesses(),
      productsStore.fetchProducts(),
    ])
  } catch (error: any) {
    loadError.value = error.message || 'Ошибка загрузки данных'
    console.error('Ошибка загрузки:', error)
  } finally {
    isLoading.value = false
  }
}

// данные
const orders = computed(() => {
  return ordersStore.orders.map((order) => {
    // Получаем полную информацию о продукте по ID из заказа
    const productData = productsStore.getProductById(order.product)

    // Возвращаем заказ с добавленной информацией о продукте
    return {
      ...order, // Копируем все поля заказа
      productData: productData, // Добавляем полные данные о продукте
    }
  })
})
const selectedOrder: Ref<Order | null> = ref(null)
// Все процессы (без фильтрации по заказу)
const allProcesses = computed(() => processesStore.processes)

const lines = [
  { name: 'Никель', code: '0', sublines: [1, 2] },
  { name: 'Медь', code: '1', sublines: [1] },
  { name: 'О-Ви', code: '2', sublines: [1] },
]

// модалки
const showOrderForm = ref(false)
const showProcessForm = ref(false)

// редактируемые объекты
const editingOrder: Ref<Order | null> = ref(null)
const editingProcess: Ref<Process | null> = ref(null)

// ======== ВЫЧИСЛЯЕМЫЕ ДАННЫЕ ========

watch(showProcessForm, (val) => {
  console.log('🟡 showProcessForm changed:', val)
})
watch(
  editingProcess,
  (val) => {
    console.log('🟡 editingProcess changed:', val)
  },
  { deep: true },
)

// Активные заказы (статус 0)
const activeOrders = computed(() => {
  return orders.value
    .filter((order) => order.status === 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

// Выполненные заказы (статус 1)
const completedOrders = computed(() => {
  return orders.value
    .filter((order) => order.status === 1)
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime(),
    )
})

// Вычисляем выполненные количества для каждого заказа
const orderCompletion = computed(() => {
  const completion: { [orderId: number]: number } = {}

  orders.value.forEach((order) => {
    // Фильтруем процессы этого заказа с заполненным end_time
    const orderProcesses = allProcesses.value.filter(
      (p) => p.order === order.id && p.end_time !== null,
    )
    // Суммируем quantity завершенных процессов
    const completedQuantity = orderProcesses.reduce((sum, process) => sum + process.quantity, 0)
    completion[order.id] = completedQuantity
  })

  return completion
})

// ======== Заказы ========
function addOrder() {
  editingOrder.value = null
  showOrderForm.value = true
}

function editOrder(id: number) {
  editingOrder.value = ordersStore.getOrderById(id) || null
  showOrderForm.value = true
}

async function deleteOrder(id: number) {
  if (!confirm('Удалить этот заказ?')) return
  try {
    await ordersStore.deleteOrder(id)
    if (selectedOrder.value?.id === id) selectedOrder.value = null
  } catch (err) {
    console.error('Ошибка при удалении заказа:', err)
    alert('Не удалось удалить заказ')
  }
}

function saveOrder(data: Omit<Order, 'id'> & { id?: number }) {
  if (data.id !== undefined) {
    ordersStore.updateOrder(data.id, data)
  } else {
    ordersStore.createOrder(data)
  }
}

// ======== Процессы ========
function addProcess(payload: { line: string; subline: number }) {
  console.log('Add process called:', payload)

  // Процессы можно добавлять без выбора заказа
  editingProcess.value = {
    order: null, // Может быть null
    quantity: 1,
    line: payload.line,
    subline: payload.subline,
    start_time: null,
    end_time: null,
  } as unknown as Process

  console.log('Setting editingProcess:', editingProcess.value)
  showProcessForm.value = true
  console.log('Setting showProcessForm to true')
}

function editProcess(id: number) {
  editingProcess.value = processesStore.getProcessById(id) || null
  showProcessForm.value = true
}

async function deleteProcess(id: number) {
  if (!confirm('Удалить этот процесс?')) return
  try {
    await processesStore.deleteProcess(id)
  } catch (err) {
    console.error('Ошибка при удалении процесса:', err)
    alert('Не удалось удалить процесс')
  }
}

async function saveProcess(data: Omit<Process, 'id'> & { id?: number }) {
  try {
    if (data.id !== undefined) {
      await processesStore.updateProcess(data.id, data)
    } else {
      await processesStore.createProcess(data)
    }

    // После сохранения процесса проверяем статус заказа (если заказ указан)
    if (data.order) {
      await checkOrderCompletion(data.order)
    }

    showProcessForm.value = false
  } catch (err: any) {
    console.error('Ошибка при сохранении процесса:', err)
    alert(err.message || 'Не удалось сохранить процесс')
  }
}

// ======== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ========

// Получаем название продукта для заказа
const getProductName = (productId: number) => {
  const product = productsStore.getProductById(productId)
  return product ? product.name : `Продукт #${productId}`
}

// Получаем статус заказа
// const getOrderStatus = (status: number) => {
//   return status === 0 ? 'Активный' : 'Выполнен'
// }

// Вычисляем статусы слоев для каждого заказа
const orderLayerStatus = computed(() => {
  const statusMap: Record<number, { [layer: string]: { done: number; total: number } }> = {}

  orders.value.forEach((order) => {
    const processesByOrder = allProcesses.value.filter((p) => p.order === order.id)
    const layerCounts: Record<string, { done: number; total: number }> = {}

    processesByOrder.forEach((p) => {
      if (!layerCounts[p.line_display || p.line]) {
        layerCounts[p.line_display || p.line] = { done: 0, total: 0 }
      }
      layerCounts[p.line_display || p.line].total += p.quantity
      if (p.end_time) layerCounts[p.line_display || p.line].done += p.quantity
    })

    statusMap[order.id] = layerCounts
  })

  return statusMap
})

async function checkOrderCompletion(orderId: number) {
  const order = ordersStore.getOrderById(orderId)
  if (!order || order.status === 1) return

  const layers = orderLayerStatus.value[orderId] || {}
  const completed = Object.values(layers).reduce((sum, l) => sum + l.done, 0)
  const total = Object.values(layers).reduce((sum, l) => sum + l.total, 0)

  if (total > 0 && completed >= total) {
    try {
      await ordersStore.updateOrder(orderId, {
        ...order,
        status: 1,
        updated_at: new Date().toISOString(),
      })
      console.log(`✅ Заказ #${orderId} выполнен!`)
    } catch (err) {
      console.error('Ошибка при обновлении статуса заказа:', err)
    }
  }
}

// Обновление данных
function refreshData() {
  loadInitialData()
}

// Вычисляем прогресс по покрытиям для каждого заказа
const orderCoatingProgress = computed(() => {
  const progress: {
    [orderId: number]: {
      [coating: string]: { completed: number; total: number }
    }
  } = {}

  orders.value.forEach((order) => {
    const orderProcesses = allProcesses.value.filter((p) => p.order === order.id)
    const coatingProgress: { [coating: string]: { completed: number; total: number } } = {}

    // Группируем по линиям покрытия
    orderProcesses.forEach((process) => {
      const coatingName = getCoatingName(process.line)
      if (!coatingProgress[coatingName]) {
        coatingProgress[coatingName] = { completed: 0, total: 0 }
      }

      coatingProgress[coatingName].total += process.quantity
      if (process.end_time) {
        coatingProgress[coatingName].completed += process.quantity
      }
    })

    progress[order.id] = coatingProgress
  })

  return progress
})

// Получаем название покрытия по коду линии
const getCoatingName = (lineCode: string) => {
  const line = lines.find((l) => l.code === lineCode)
  return line ? line.name : `Покрытие ${lineCode}`
}

// Получаем общий прогресс заказа
const getTotalProgress = (orderId: number) => {
  const order = ordersStore.getOrderById(orderId)
  if (!order) return { completed: 0, total: 0 }

  const coatingProgress = orderCoatingProgress.value[orderId] || {}
  const totalCompleted = Object.values(coatingProgress).reduce(
    (sum, coating) => sum + coating.completed,
    0,
  )

  return {
    completed: totalCompleted,
    total: order.quantity,
  }
}

const formatCoating = (coatingData: unknown) => {
  if (!coatingData || typeof coatingData !== 'object') return 'Без покрытия'

  const materialNames: { [key: string]: string } = {
    '0': 'Н', // Никель
    '1': 'М', // Медь
    '2': 'О-Ви', // Олово-висмут
  }

  return Object.entries(coatingData)
    .map(([materialId, thickness]) => {
      const materialCode = materialNames[materialId] || `М${materialId}`
      return `${materialCode}${thickness}`
    })
    .join('.')
}
</script>

<template>
  <div class="orders-processes-layout">
    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">Загрузка данных...</div>

    <!-- Ошибка загрузки -->
    <div v-else-if="loadError" class="error-overlay">
      <div class="error-message">
        {{ loadError }}
        <button @click="refreshData" class="retry-btn">Повторить</button>
      </div>
    </div>
    <div class="orders-processes" v-else>
      <!-- === ЗАКАЗЫ === -->
      <section class="panel">
        <header class="panel-header">
          <h2>Заказы</h2>
          <div class="header-actions">
            <button @click="refreshData" class="refresh-btn" title="Обновить">🔄</button>
            <button @click="addOrder" class="add-btn">➕ Добавить</button>
          </div>
        </header>

        <div class="orders-container">
          <!-- Активные заказы -->
          <div v-if="activeOrders.length > 0" class="orders-section">
            <h3 class="section-title">Активные заказы</h3>
            <ul class="orders-list">
              <li v-for="order in activeOrders" :key="order.id">
                <div class="order-item">
                  <div class="order-info">
                    <!-- Заголовок заказа -->
                    <div class="order-header">
                      <span class="order-number">Заказ #{{ order.id }}</span>
                      <span class="order-product">
                        {{ order.productData?.name || `Продукт #${order.product}` }}
                        (Заказчик:
                        {{
                          customerStore.getCustomerById(order.productData?.customer || 0)?.name ||
                          'Не указан'
                        }})
                      </span>
                      <span class="order-coating"
                        >Покрытие: {{ formatCoating(order.productData?.coating_data) }}</span
                      >
                      <span class="order-quantity">{{ order.quantity }} шт.</span>
                    </div>

                    <!-- Общий прогресс -->
                    <div class="total-progress">
                      <div class="progress-info">
                        <span>Всего выполнено: </span>
                        <strong
                          >{{ getTotalProgress(order.id).completed }}/{{
                            getTotalProgress(order.id).total
                          }}
                          шт.</strong
                        >
                      </div>
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          :style="{
                            width:
                              Math.round(
                                (getTotalProgress(order.id).completed /
                                  getTotalProgress(order.id).total) *
                                  100,
                              ) + '%',
                          }"
                        ></div>
                      </div>
                    </div>

                    <!-- Прогресс по покрытиям -->
                    <div class="coating-progress" v-if="orderCoatingProgress[order.id]">
                      <div
                        v-for="(coating, name) in orderCoatingProgress[order.id]"
                        :key="name"
                        class="coating-item"
                      >
                        <div class="coating-name">{{ name }}:</div>
                        <div class="coating-stats">
                          {{ coating.completed }}/{{ coating.total }} шт.
                        </div>
                        <div class="coating-bar">
                          <div
                            class="coating-fill"
                            :style="{
                              width:
                                coating.total > 0
                                  ? Math.round((coating.completed / coating.total) * 100) + '%'
                                  : '0%',
                            }"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div class="order-date">
                      Создан: {{ new Date(order.created_at).toLocaleDateString('ru-RU') }}
                    </div>
                  </div>
                  <div class="order-actions">
                    <button @click.stop="editOrder(order.id)" title="Редактировать">✏️</button>
                    <button @click.stop="deleteOrder(order.id)" title="Удалить">🗑️</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Выполненные заказы -->
          <div v-if="completedOrders.length > 0" class="orders-section">
            <h3 class="section-title completed-title">Выполненные заказы</h3>
            <ul class="orders-list completed-list">
              <li v-for="order in completedOrders" :key="order.id">
                <div class="order-item completed-item">
                  <div class="order-info">
                    <div class="order-product completed-product">
                      {{ getProductName(order.product) }}
                    </div>
                    <div class="order-details completed-details">
                      {{ order.quantity }} шт. • Выполнен
                    </div>
                    <div class="order-date completed-date">
                      Завершён:
                      {{
                        new Date(order.updated_at || order.created_at).toLocaleDateString('ru-RU')
                      }}
                    </div>
                  </div>
                  <div class="order-actions">
                    <button @click.stop="editOrder(order.id)" title="Просмотреть">👁️</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div v-if="orders.length === 0" class="empty-state">Нет заказов</div>
        </div>
      </section>
      <!-- === ПРОЦЕССЫ === -->
      <section class="panel">
        <header class="panel-header">
          <h2>Процессы</h2>
          <div class="header-actions">
            <button @click="refreshData" class="refresh-btn" title="Обновить">🔄</button>
          </div>
        </header>

        <div class="processes-content">
          <!-- Процессы отображаются всегда, без привязки к выбранному заказу -->
          <ProcessCalendar
            :processes="allProcesses"
            @add="addProcess"
            @edit="editProcess"
            @delete="deleteProcess"
          />
        </div>

        <!-- Модалка формы процесса -->
        <ProcessForm
          v-model="showProcessForm"
          :process="editingProcess"
          :orders="orders"
          @save="saveProcess"
        />
      </section>
      <!-- Модалка формы заказа -->
      <OrderForm
        v-model="showOrderForm"
        :order="editingOrder"
        :products="productsStore.products"
        @save="saveOrder"
      />
    </div>
  </div>
</template>

<style scoped>
/* Стили для состояний загрузки и ошибок */
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 2rem;
  border-radius: 8px;
  z-index: 100;
}

.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.refresh-btn {
  background: #e2e8f0;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #cbd5e1;
}

/* Остальные стили остаются без изменений */
.orders-processes-layout {
  height: 100%;
  position: relative;
}

.orders-processes {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.panel {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.orders-container {
  flex: 1;
  overflow-y: auto;
}

.orders-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.order-item:hover {
  background: #f9fafb;
}

.orders-list li.active .order-item {
  background: #e0f2fe;
  border-left: 3px solid #3b82f6;
}

.order-info {
  flex: 1;
}

.order-product {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.2rem;
}

.order-details {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.order-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.order-actions {
  display: flex;
  gap: 0.3rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.order-item:hover .order-actions {
  opacity: 1;
}

.order-actions button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
}

.order-actions button:hover {
  background: #f1f5f9;
}

.add-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.add-btn:hover {
  background: #2563eb;
}

.processes-content {
  flex: 1;
  overflow: auto;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

/* Стили для прогресс-бара */
.order-progress {
  margin: 0.5rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
}

/* Стили для завершенных заказов */
.completed-title {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.completed-item {
  opacity: 0.7;
}

.completed-product {
  color: #94a3b8;
}

.completed-details {
  color: #94a3b8;
}

.completed-date {
  color: #cbd5e1;
}

.order-progress-layers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 0.3rem;
}

.layer-progress {
  font-size: 0.75rem;
  color: #475569;
}

.layer-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 1px;
}

.layer-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.section-title {
  margin-top: 8px;
  margin-left: 32px;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.order-number {
  font-weight: 600;
  color: #1e293b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.order-product {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.order-quantity {
  color: #64748b;
  font-size: 0.8rem;
  background: #e2e8f0;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.total-progress {
  margin: 0.75rem 0;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
}

.progress-info span {
  color: #64748b;
}

.progress-info strong {
  color: #1e293b;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.3s ease;
}

.coating-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.coating-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.coating-name {
  color: #475569;
  font-weight: 500;
  min-width: 80px;
}

.coating-stats {
  color: #64748b;
  text-align: right;
  min-width: 60px;
}

.coating-bar {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 2px;
  overflow: hidden;
}

.coating-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.order-date {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .coating-item {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .coating-stats {
    text-align: left;
  }
}
</style>
