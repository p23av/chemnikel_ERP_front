<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script lang="ts" setup>
import { ref, computed, type Ref, onMounted, watch } from 'vue'
import { useOrdersStore } from '@/stores/orders'
import { useProcessesStore } from '@/stores/processes'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useCorrectionsStore } from '@/stores/corrections'
import { useBoilingsStore } from '@/stores/boilings'
import { useLinesStore } from '@/stores/lines'

import type { Order } from '@/stores/orders'
import type { Process } from '@/stores/processes'
import type { Correction } from '@/stores/corrections'
import type { Boiling } from '@/stores/boilings'

import OrderForm from '@/components/orders/OrderForm.vue'
import ProcessCalendar from '@/components/processes/ProcessCalendar.vue'
import ProcessForm from '@/components/processes/ProcessForm.vue'
import CorrectionForm from '@/components/processes/CorrectionForm.vue'
import BoilingForm from '@/components/processes/BoilingForm.vue'

const selectedProcessDate = ref<Date>(resetTime(new Date()))

// хранилища
const ordersStore = useOrdersStore()
const processesStore = useProcessesStore()
const productsStore = useProductsStore()
const customerStore = useCustomersStore()
const correctionsStore = useCorrectionsStore()
const boilingsStore = useBoilingsStore()
const linesStore = useLinesStore()

// состояния загрузки
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// загружаем данные при монтировании
onMounted(async () => {
  await loadInitialData()
  console.log('Прогресс заказов:', debugProgress.value)
})

// Функция для сброса времени (только дата)
function resetTime(date: Date): Date {
  const newDate = new Date(date)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

async function loadInitialData() {
  isLoading.value = true
  loadError.value = null

  try {
    // Загружаем все данные параллельно
    const startOfMonth = new Date(
      selectedProcessDate.value.getFullYear(),
      selectedProcessDate.value.getMonth(),
      1,
    )
    const endOfMonth = new Date(
      selectedProcessDate.value.getFullYear(),
      selectedProcessDate.value.getMonth() + 1,
      0,
    )
    await Promise.all([
      ordersStore.fetchOrders(),
      processesStore.fetchProcesses(),
      productsStore.fetchProducts(),
      correctionsStore.fetchCorrections(startOfMonth, endOfMonth),
      boilingsStore.fetchBoilings(startOfMonth, endOfMonth),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    loadError.value = error.message || 'Ошибка загрузки данных'
    console.error('Ошибка загрузки:', error)
  } finally {
    isLoading.value = false
  }
}

const boilings = computed(() => boilingsStore.boilings)

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
const allCorrections = computed(() => correctionsStore.corrections)

// модалки
const showOrderForm = ref(false)
const showProcessForm = ref(false)
const showCorrectionForm = ref(false)
const showBoilingForm = ref(false)

// Данные для формы коррекции
const correctionFormData = ref({
  line: null as number | null,
  subline: 0,
  date: new Date(),
})
const boilingFormData = ref({
  line: null as number | null,
  subline: null as number | null,
  date: new Date(),
})

// Обработчик добавления коррекции из календаря
const handleAddCorrection = (payload: { line: number; subline: number; date: Date }) => {
  // Для новой коррекции очищаем editingCorrection
  editingCorrection.value = null
  correctionFormData.value = {
    line: payload.line,
    subline: payload.subline,
    date: payload.date,
  }

  showCorrectionForm.value = true
}
const handleAddBoiling = (payload: { line: number; subline: number; date: Date }) => {
  editingBoiling.value = null
  boilingFormData.value = {
    line: payload.line,
    subline: payload.subline,
    date: payload.date,
  }
  showBoilingForm.value = true
}

// Сохранение коррекции
const saveCorrection = async (correctionData: Correction) => {
  try {
    console.log('💾 Сохранение коррекции из формы:', correctionData) // <-- ДОБАВЬТЕ

    const saveData = {
      amount: correctionData.amount,
      line: correctionData.line,
      subline: correctionData.subline,
      correction_time: correctionData.correction_time,
      worker: correctionData.worker,
    }

    console.log('📤 Данные для отправки:', saveData) // <-- ДОБАВЬТЕ

    if (correctionData.id) {
      await correctionsStore.updateCorrection(correctionData.id, saveData)
    } else {
      await correctionsStore.createCorrection(saveData)
    }

    showCorrectionForm.value = false
    editingCorrection.value = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Ошибка при сохранении коррекции:', error)
    alert(error.message || 'Не удалось сохранить коррекцию')
  }
}
const saveBoiling = async (boilingData: Boiling) => {
  try {
    const saveData = {
      subline: boilingData.subline,
      date: boilingData.date,
      start_time: boilingData.start_time,
      end_time: boilingData.end_time,
      worker: boilingData.worker,
    }

    if (boilingData.id) {
      await boilingsStore.updateBoiling(boilingData.id, saveData)
    } else {
      await boilingsStore.createBoiling(saveData)
    }

    showBoilingForm.value = false
    editingBoiling.value = null
  } catch (error: any) {
    console.error('Ошибка при сохранении кипения:', error)
    alert(error.message || 'Не удалось сохранить запись о кипении')
  }
}

// редактируемые объекты
const editingOrder: Ref<Order | null> = ref(null)
const editingProcess: Ref<Process | null> = ref(null)
const editingCorrection: Ref<Correction | null> = ref(null)
const editingBoiling: Ref<Boiling | null> = ref(null)

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
// const orderCompletion = computed(() => {
//   const completion: { [orderId: number]: number } = {}

//   orders.value.forEach((order) => {
//     // Фильтруем процессы этого заказа с заполненным end_time
//     const orderProcesses = allProcesses.value.filter(
//       (p) => p.order === order.id && p.end_time !== null,
//     )
//     // Суммируем quantity завершенных процессов
//     const completedQuantity = orderProcesses.reduce((sum, process) => sum + process.quantity, 0)
//     completion[order.id] = completedQuantity
//   })

//   return completion
// })

// Обработчик редактирования коррекции
const handleEditCorrection = async (correction: Correction) => {
  editingCorrection.value = correction
  showCorrectionForm.value = true
}
const handleEditBoiling = (boiling: Boiling) => {
  editingBoiling.value = boiling
  showBoilingForm.value = true
}

// Обработчик удаления коррекции
const handleDeleteCorrection = async (id: number) => {
  if (!confirm('Удалить эту коррекцию?')) return

  try {
    await correctionsStore.deleteCorrection(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Ошибка при удалении коррекции:', error)
    alert(error.message || 'Не удалось удалить коррекцию')
  }
}
const handleDeleteBoiling = async (id: number) => {
  if (!confirm('Удалить запись о кипении?')) return
  try {
    await boilingsStore.deleteBoiling(id)
  } catch (error: any) {
    console.error('Ошибка при удалении кипения:', error)
    alert(error.message || 'Не удалось удалить запись о кипении')
  }
}

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
function addProcess(payload: { line: number; subline: number }) {
  // console.log('Add process called:', payload)

  // Процессы можно добавлять без выбора заказа
  editingProcess.value = {
    order: null, // Может быть null
    quantity: 1,
    line: payload.line,
    subline: payload.subline,
    start_time: null,
    end_time: null,
  } as unknown as Process

  // console.log('Setting editingProcess:', editingProcess.value)
  showProcessForm.value = true
  // console.log('Setting showProcessForm to true')
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
    // if (data.order) {
    //   await checkOrderCompletion(data.order)
    // }

    showProcessForm.value = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Ошибка при сохранении процесса:', err)
    alert(err.message || 'Не удалось сохранить процесс')
  }
}

// ======== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ========

// Получаем название продукта для заказа
// const getProductName = (productId: number) => {
//   const product = productsStore.getProductById(productId)
//   return product ? product.name : `Продукт #${productId}`
// }

// Получаем статус заказа
// const getOrderStatus = (status: number) => {
//   return status === 0 ? 'Активный' : 'Выполнен'
// }

// Вычисляем статусы слоев для каждого заказа
// const orderLayerStatus = computed(() => {
//   const statusMap: Record<number, { [layer: string]: { done: number; total: number } }> = {}

//   orders.value.forEach((order) => {
//     const processesByOrder = allProcesses.value.filter((p) => p.order === order.id)
//     const layerCounts: Record<string, { done: number; total: number }> = {}

//     processesByOrder.forEach((p) => {
//       if (!layerCounts[p.line_display || p.line]) {
//         layerCounts[p.line_display || p.line] = { done: 0, total: 0 }
//       }
//       layerCounts[p.line_display || p.line].total += p.quantity
//       if (p.end_time) layerCounts[p.line_display || p.line].done += p.quantity
//     })

//     statusMap[order.id] = layerCounts
//   })

//   return statusMap
// })

// async function checkOrderCompletion(orderId: number) {
//   const order = ordersStore.getOrderById(orderId)
//   if (!order || order.status === 1) return

//   const layers = orderLayerStatus.value[orderId] || {}
//   const completed = Object.values(layers).reduce((sum, l) => sum + l.done, 0)
//   const total = Object.values(layers).reduce((sum, l) => sum + l.total, 0)

//   if (total > 0 && completed >= total) {
//     try {
//       await ordersStore.updateOrder(orderId, {
//         ...order,
//         status: 1,
//         updated_at: new Date().toISOString(),
//       })
//       console.log(`✅ Заказ #${orderId} выполнен!`)
//     } catch (err) {
//       console.error('Ошибка при обновлении статуса заказа:', err)
//     }
//   }
// }

// Обновление данных
async function refreshData() {
  await loadInitialData()
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

      // Увеличиваем общее количество
      coatingProgress[coatingName].total += process.quantity

      // Увеличиваем выполненные, если есть end_time
      if (process.end_time) {
        coatingProgress[coatingName].completed += process.quantity
      }
    })

    // Ограничиваем значения количеством в заказе
    Object.keys(coatingProgress).forEach((coating) => {
      coatingProgress[coating].total = Math.min(coatingProgress[coating].total, order.quantity)
      coatingProgress[coating].completed = Math.min(
        coatingProgress[coating].completed,
        order.quantity,
      )
    })

    progress[order.id] = coatingProgress
  })

  return progress
})

// Получаем название покрытия по коду линии
const getCoatingName = (lineId: number) => {
  const line = linesStore.getLineById(lineId)
  return line?.name || `Покрытие ${lineId}`
}

// Получаем общий прогресс заказа
const getTotalProgress = (orderId: number) => {
  const order = ordersStore.getOrderById(orderId)
  if (!order) return { completed: 0, total: 0 } // Исправлено здесь

  const coatingProgress = orderCoatingProgress.value[orderId] || {}

  // Если нет данных о процессах, значит ничего не выполнено
  if (Object.keys(coatingProgress).length === 0) {
    return {
      completed: 0,
      total: order.quantity,
    }
  }

  // Для многослойных покрытий - берем минимальное выполненное количество
  let totalCompleted = order.quantity // Максимум - весь заказ

  if (Object.keys(coatingProgress).length > 0) {
    // Ищем минимальное значение среди всех покрытий
    const coatingValues = Object.values(coatingProgress).map((coating) => coating.completed)
    // Если все покрытия имеют прогресс, берем минимальное
    if (coatingValues.length > 0 && coatingValues.every((val) => val >= 0)) {
      totalCompleted = Math.min(...coatingValues)
    } else {
      totalCompleted = 0
    }
  }

  return {
    completed: Math.min(totalCompleted, order.quantity),
    total: order.quantity,
  }
}

const formatCoating = (coatingData: unknown) => {
  if (!coatingData || typeof coatingData !== 'object') return 'Без покрытия'

  return Object.entries(coatingData)
    .map(([materialCode, thickness]) => {
      const line = linesStore.lines.find((l) => l.code === materialCode)
      const shortName = line?.short_name || materialCode
      return `${shortName}${thickness}`
    })
    .join('.')
}

// Переключение статуса заказа
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toggleOrderStatus(order: any) {
  const newStatus = order.status === 0 ? 1 : 0
  const action = newStatus === 1 ? 'завершить' : 'вернуть в работу'

  if (!confirm(`Вы уверены, что хотите ${action} заказ #${order.id}?`)) {
    return
  }

  try {
    await ordersStore.updateOrder(order.id, {
      ...order,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })

    // Обновляем локальные данные
    refreshData()

    alert(`Заказ #${order.id} ${newStatus === 1 ? 'завершен' : 'возвращен в работу'}!`)
  } catch (err: unknown) {
    console.error('Ошибка при изменении статуса заказа:', err)
    alert('Не удалось изменить статус заказа')
  }
}

const debugProgress = computed(() => {
  return activeOrders.value.map((order) => {
    const progress = getTotalProgress(order.id)
    console.log(`Заказ #${order.id}: ${progress.completed}/${progress.total}`)
    return { orderId: order.id, progress }
  })
})
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
              <li
                v-for="order in activeOrders"
                :key="order.id"
                :class="{
                  'completed-ready':
                    getTotalProgress(order.id).completed === getTotalProgress(order.id).total,
                }"
              >
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
                    <button
                      @click.stop="toggleOrderStatus(order)"
                      title="Завершить заказ"
                      class="complete-btn"
                    >
                      ✅
                    </button>
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
                    <!-- Заголовок заказа как в активных -->
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

                    <!-- Общий прогресс (может быть 100%) -->
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

                    <div class="order-date completed-date">
                      Завершён:
                      {{
                        new Date(order.updated_at || order.created_at).toLocaleDateString('ru-RU')
                      }}
                    </div>
                  </div>
                  <div class="order-actions">
                    <button
                      @click.stop="toggleOrderStatus(order)"
                      title="Вернуть в работу"
                      class="return-btn"
                    >
                      🔄
                    </button>
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
            :corrections="allCorrections"
            :boilings="boilings"
            :selected-date="selectedProcessDate"
            @update:selected-date="selectedProcessDate = resetTime($event)"
            @add="addProcess"
            @add-correction="handleAddCorrection"
            @add-boiling="handleAddBoiling"
            @edit="editProcess"
            @delete="deleteProcess"
            @edit-correction="handleEditCorrection"
            @delete-correction="handleDeleteCorrection"
            @edit-boiling="handleEditBoiling"
            @delete-boiling="handleDeleteBoiling"
          />
        </div>

        <!-- Модалка формы процесса -->
        <ProcessForm
          v-model="showProcessForm"
          :process="editingProcess"
          :orders="orders"
          :selected-date="selectedProcessDate"
          @save="saveProcess"
        />
        <CorrectionForm
          v-model="showCorrectionForm"
          :form-data="correctionFormData"
          :correction="editingCorrection"
          @save="saveCorrection"
        />
        <BoilingForm
          v-model="showBoilingForm"
          :form-data="boilingFormData"
          :boiling="editingBoiling"
          @save="saveBoiling"
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

/* Основной лейаут */
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

/* Панели */
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
  min-width: 40px;
}

.order-product {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
  flex: 1;
  min-width: 150px;
}

.customer-name {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: normal;
}

.order-coating {
  color: #475569;
  font-size: 0.8rem;
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  white-space: nowrap;
}

.order-quantity {
  color: #64748b;
  font-size: 0.8rem;
  background: #e2e8f0;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  white-space: nowrap;
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

/* Стили для завершенных заказов */
.completed-title {
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.completed-item {
  opacity: 0.7;
}

.completed-date {
  color: #cbd5e1;
}

.section-title {
  margin-top: 8px;
  margin-left: 32px;
}

.orders-list li.completed-ready .order-item {
  background: #d1fae5;
  border-left: 3px solid #10b981;
}

.complete-btn,
.return-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
}

.complete-btn:hover {
  background: #10b981;
  color: white;
}

.return-btn:hover {
  background: #3b82f6;
  color: white;
}

/* ======== АДАПТИВНОСТЬ ДЛЯ ПЛАНШЕТОВ ======== */

/* Мобильное/планшетное меню */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100%;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: left 0.3s ease;
  display: none;
}

.mobile-menu--open {
  left: 0;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.mobile-menu-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  margin-right: 1rem;
  cursor: pointer;
}

.mobile-menu-content {
  padding: 1rem;
}

.mobile-menu-btn {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  text-align: left;
}

.mobile-menu-btn:hover {
  background: #2563eb;
}

/* Мобильные контролы */
.mobile-controls {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mobile-menu-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.mobile-refresh-btn {
  background: #e2e8f0;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}

/* Планшетная версия (768px - 1024px) */
@media (max-width: 1024px) {
  .orders-processes {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 4px;
  }

  .panel--orders {
    grid-row: 1;
    max-height: 50vh;
  }

  .panel--processes {
    grid-row: 2;
    max-height: 50vh;
  }

  .mobile-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .mobile-menu-overlay,
  .mobile-menu {
    display: block;
  }

  .header-actions--mobile {
    display: none;
  }

  .add-btn--mobile {
    display: none;
  }

  .order-header {
    gap: 0.3rem;
  }

  .order-product {
    font-size: 0.85rem;
    min-width: 120px;
  }

  .customer-name {
    display: block;
    margin-top: 0.1rem;
  }

  .order-coating {
    font-size: 0.75rem;
    padding: 0.1rem 0.3rem;
  }

  .order-quantity {
    font-size: 0.75rem;
    padding: 0.1rem 0.3rem;
  }

  .coating-item {
    grid-template-columns: auto auto;
    gap: 0.3rem;
  }

  .coating-bar {
    grid-column: 1 / -1;
  }

  .order-actions {
    flex-direction: column;
    gap: 0.2rem;
  }
}

/* Мобильная версия (до 768px) */
@media (max-width: 768px) {
  .orders-processes {
    gap: 2px;
  }

  .panel-header {
    padding: 0.5rem 0.75rem;
  }

  .order-item {
    padding: 0.6rem 0.75rem;
    flex-direction: column;
  }

  .order-actions {
    flex-direction: row;
    margin-top: 0.5rem;
    justify-content: flex-end;
    width: 100%;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .order-number {
    align-self: flex-start;
  }

  .order-product {
    min-width: 100%;
  }

  .total-progress {
    padding: 0.4rem;
  }

  .progress-info {
    font-size: 0.75rem;
  }

  .coating-progress {
    margin: 0.3rem 0;
  }

  .coating-item {
    grid-template-columns: 1fr auto;
    gap: 0.25rem;
  }

  .coating-name {
    min-width: 60px;
    font-size: 0.7rem;
  }

  .coating-stats {
    font-size: 0.7rem;
    min-width: 50px;
  }

  .order-date {
    font-size: 0.7rem;
  }

  .section-title {
    margin-left: 16px;
    font-size: 0.9rem;
  }
}

/* Маленькие планшеты в портретной ориентации */
@media (max-width: 600px) and (orientation: portrait) {
  .mobile-menu {
    width: 250px;
    left: -250px;
  }

  .panel--orders,
  .panel--processes {
    max-height: 45vh;
  }

  .order-coating,
  .order-quantity {
    font-size: 0.7rem;
  }
}

/* Маленький ноут */
@media (min-width: 1024px) and (max-width: 1370px) and (orientation: landscape) {
  .order-item {
    padding: 4px;
  }
  .order-product {
    min-width: 100%;
    font-size: 0.75rem;
  }
  .order-header {
    margin: 0;
  }
  .total-progress {
    margin: 8px 0 0;
    padding: 0;
  }
  .coating-progress {
    margin: 0;
  }
  .panel-header {
    padding: 0;
  }
  .orders-processes {
    grid-template-columns: 1fr 2.5fr;
    grid-template-rows: 1fr;
  }

  .panel--orders {
    grid-row: 1;
    max-height: 100%;
  }

  .panel--processes {
    grid-row: 1;
    max-height: 100%;
  }

  .mobile-controls {
    grid-column: 1 / -1;
  }
}

/* Планшеты в ландшафтной ориентации */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .order-item {
    padding: 4px;
  }
  .order-product {
    min-width: 100%;
    font-size: 0.75rem;
  }
  .order-header {
    margin: 0;
  }
  .total-progress {
    margin: 8px 0 0;
    padding: 0;
  }
  .coating-progress {
    margin: 0;
  }
  .panel-header {
    padding: 0;
  }
  .orders-processes {
    grid-template-columns: 1fr 2.5fr;
    grid-template-rows: 1fr;
  }

  .panel--orders {
    grid-row: 1;
    max-height: 100%;
  }

  .panel--processes {
    grid-row: 1;
    max-height: 100%;
  }

  .mobile-controls {
    grid-column: 1 / -1;
  }
}
</style>
