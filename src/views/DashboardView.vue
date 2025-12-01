<script lang="ts" setup>
import { ref, computed, type Ref, onMounted } from 'vue'
// import { useAuthStore } from '@/stores/auth'
import { useCustomersStore } from '@/stores/customers'
import { useProductsStore } from '@/stores/products'
import api from '@/plugins/ofetch'
import type { Customer } from '@/stores/customers'
import type { Product } from '@/stores/products'

import CustomerForm from '@/components/customers/CustomerForm.vue'
import ProductForm from '@/components/products/ProductForm.vue'
// const authStore = useAuthStore()

const customersStore = useCustomersStore()
const productsStore = useProductsStore()

// Загружаем данные при монтировании компонента
onMounted(async () => {
  await customersStore.fetchCustomers()
  await productsStore.fetchProducts()
})

const customers = computed(() => customersStore.customers)
const products = computed(() => productsStore.products)
// const products = [
//   {
//     id: 1,
//     name: 'Корпус МВ',
//     material: 'Алюминий',
//     surface_area: 28,
//     coating: 'Н12',
//     customer: 5, // Заказчик 1
//   },
//   {
//     id: 2,
//     name: '10.001',
//     material: 'Алюминий',
//     surface_area: 0.6,
//     coating: 'Н6.М3.О-Ви(99,8)9',
//     customer: 2, // Заказчик 2
//   },
//   {
//     id: 3,
//     name: 'Кронштейн',
//     material: 'Сталь',
//     surface_area: 6,
//     coating: 'Н9',
//     customer: 3, // Заказчик 3
//   },
//   {
//     id: 4,
//     name: 'Втулка',
//     material: 'Латунь',
//     surface_area: 2,
//     coating: 'Н6.М3',
//     customer: 6, // Заказчик 4
//   },
// ]

// Функция для форматирования покрытия из JSON
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

// Управление модалками
const showCustomerForm = ref(false)
const showProductForm = ref(false)

// Для редактирования
const selectedCustomer: Ref<Customer | null> = ref(null)
const selectedProduct: Ref<Product | null> = ref(null)
// const selectedProduct = ref<number | null>(null)

function addCustomer() {
  selectedCustomer.value = null
  showCustomerForm.value = true
}
function addProduct() {
  selectedProduct.value = null
  showProductForm.value = true
}

function editCustomer(id: number) {
  selectedCustomer.value = customersStore.getCustomerById(id) || null
  showCustomerForm.value = true
}
function editProduct(id: number) {
  selectedProduct.value = productsStore.getProductById(id) || null
  showProductForm.value = true
}

function saveCustomer(data: Omit<Customer, 'id'> & { id?: number }) {
  if (data.id !== undefined) {
    customersStore.updateCustomer(data.id, data)
  } else {
    customersStore.addCustomer(data)
  }
}
function saveProduct(data: Omit<Product, 'id'> & { id?: number }) {
  if (data.id !== undefined) {
    productsStore.updateProduct(data.id, data)
  } else {
    productsStore.createProduct(data)
  }
}

// Удаление заказчика
const deleteCustomer = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить этого заказчика?')) return

  try {
    await api(`/customers/${id}/`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message || 'Не удалось удалить заказчика'
      console.error('Ошибка при удалении заказчика:', err)
    } else {
      console.log('Неизвестная ошибка:', err)
    }
  }
}
const error = ref<string | null>(null)
// Удаление продукта
const deleteProduct = async (id: number) => {
  if (!confirm('Вы уверены, что хотите удалить этого заказчика?')) return

  try {
    await api(`/products/${id}/`, {
      method: 'DELETE',
    })
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message || 'Не удалось удалить деталь'
      console.error('Ошибка при удалении детали:', err)
    } else {
      console.log('Неизвестная ошибка:', err)
    }
  }
}
</script>

<!-- <template>
  <div class="manager-dashboard">
    <header class="dashboard-header">
      <h2>Панель управления менеджера</h2>
    </header>

    <div class="content-section">
      <div class="section-header">
        <h2>Список заказчиков</h2>
        <button @click="customersStore.fetchCustomers()" class="refresh-btn">
          Обновить список
        </button>
      </div>

      <div v-if="isLoading" class="loading-indicator">Загрузка данных...</div>

      <div v-else-if="error" class="error-message">Ошибка при загрузке данных: {{ error }}</div>

      <div v-else>
        <v-table class="customers-table" height="300px" fixed-header>
          <thead>
            <tr>
              <th class="text-left">ID</th>
              <th class="text-right">Название</th>
              <th>Контактное лицо</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in customers" :key="customer.id">
              <td>{{ customer.id }}</td>
              <td>{{ customer.name }}</td>
              <td>{{ customer.contact_person }}</td>
              <td>{{ customer.phone }}</td>
              <td>{{ customer.email }}</td>
              <td>
                <button @click="editCustomer(customer.id)" class="action-btn edit-btn">
                  Редактировать
                </button>
                <button @click="deleteCustomer(customer.id)" class="action-btn delete-btn">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="add-customer">
          <button @click="showAddForm = true" class="add-btn">Добавить нового заказчика</button>
        </div>

        <div v-if="showAddForm" class="customer-form">
          <h3>Добавить заказчика</h3>
          <form @submit.prevent="addCustomer">
            <div class="form-group">
              <label>Название:</label>
              <input v-model="newCustomer.name" required />
            </div>
            <div class="form-group">
              <label>Контактное лицо:</label>
              <input v-model="newCustomer.contact_person" required />
            </div>
            <div class="form-group">
              <label>Телефон:</label>
              <input v-model="newCustomer.phone" type="tel" required />
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input v-model="newCustomer.email" type="email" required />
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">Сохранить</button>
              <button type="button" @click="showAddForm = false" class="cancel-btn">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template> -->

<template>
  <div class="customers-details-layout">
    <!-- Левая колонка: заказчики -->
    <section class="panel">
      <header class="panel-header">
        <h2>Заказчики</h2>
        <div class="panel-actions">
          <input type="text" placeholder="Поиск..." class="search-input" />
          <button @click="addCustomer" class="add-btn">➕ Добавить</button>
        </div>
      </header>

      <table class="data-table">
        <thead>
          <tr>
            <!-- <th>ID ⬍</th> -->
            <th>Название ⬍</th>
            <th>ИНН ⬍</th>
            <th>Контактное лицо ⬍</th>
            <th>Телефон ⬍</th>
            <th>Email ⬍</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id">
            <!-- <td>{{ customer.id }}</td> -->
            <td>{{ customer.name }}</td>
            <td>{{ customer.tax_id }}</td>
            <td>{{ customer.contact_person }}</td>
            <td>{{ customer.phone }}</td>
            <td>{{ customer.email }}</td>
            <td>
              <button
                @click="editCustomer(customer.id)"
                class="action-btn edit-btn"
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                @click="deleteCustomer(customer.id)"
                class="action-btn delete-btn"
                title="Удалить"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Правая колонка: детали -->
    <section class="panel">
      <header class="panel-header">
        <h2>Детали</h2>
        <div class="panel-actions">
          <input type="text" placeholder="Поиск..." class="search-input" />
          <button @click="addProduct" class="add-btn">➕ Добавить</button>
        </div>
      </header>

      <table class="data-table">
        <thead>
          <tr>
            <th>Название ⬍</th>
            <th>Материал ⬍</th>
            <th>Площадь поверхности ⬍</th>
            <th>Покрытие ⬍</th>
            <th>Заказчик ⬍</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.name }}</td>
            <td>{{ product.material }}</td>
            <td>{{ product.surface_area }}</td>
            <td>{{ formatCoating(product.coating_data) }}</td>
            <td>{{ customersStore.getCustomerById(product.customer)?.name }}</td>
            <td>
              <button
                @click="editProduct(product.id)"
                class="action-btn edit-btn"
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                @click="deleteProduct(product.id)"
                class="action-btn delete-btn"
                title="Удалить"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <!-- Модалки -->
    <CustomerForm v-model="showCustomerForm" :customer="selectedCustomer" @save="saveCustomer" />
    <ProductForm
      v-model="showProductForm"
      :product="selectedProduct"
      :customers="customersStore.customers"
      @save="saveProduct"
    />
  </div>
</template>

<style scoped>
.customers-details-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100%;
}

.panel {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
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

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table thead {
  background: #f1f5f9;
}

.data-table th,
.data-table td {
  padding: 0.6rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.data-table th {
  cursor: pointer;
  color: #334155;
  font-weight: 600;
}

.data-table tr:hover td {
  background: #f9fafb;
}
</style>

<!-- <style scoped>
.manager-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.logout-btn {
  padding: 8px 16px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.customers-table th,
.customers-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.customers-table th {
  background-color: #f2f2f2;
}

.action-btn {
  padding: 6px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #ffc107;
  color: black;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.add-btn {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.customer-form {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  margin-top: 20px;
}

.submit-btn {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.cancel-btn {
  padding: 10px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading-indicator {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error-message {
  padding: 20px;
  color: #dc3545;
  background-color: #f8d7da;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style> -->
