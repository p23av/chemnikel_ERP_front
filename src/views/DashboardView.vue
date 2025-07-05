<template>
  <div class="manager-dashboard">
    <header class="dashboard-header">
      <h2>Панель управления менеджера</h2>
    </header>

    <div class="content-section">
      <div class="section-header">
        <h2>Список заказчиков</h2>
        <button @click="fetchCustomers" class="refresh-btn">Обновить список</button>
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
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ofetch } from 'ofetch'

const router = useRouter()
const authStore = useAuthStore()

// Состояния для данных
const customers = ref([])
const isLoading = ref(false)
const error = ref(null)
const showAddForm = ref(false)

// Данные для нового заказчика
const newCustomer = ref({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
})

// Загрузка списка заказчиков
const fetchCustomers = async () => {
  try {
    isLoading.value = true
    error.value = null
    customers.value = await ofetch('/api/customers/', {
      baseURL: 'http://localhost:8000',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить список заказчиков'
    console.error('Ошибка при загрузке заказчиков:', err)

    // Если ошибка 401 (не авторизован), перенаправляем на страницу входа
    if (err.status === 401) {
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

// Добавление нового заказчика
const addCustomer = async () => {
  try {
    const createdCustomer = await ofetch('/api/customers/', {
      method: 'POST',
      body: newCustomer.value,
      baseURL: 'http://localhost:8000',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    customers.value.push(createdCustomer)
    showAddForm.value = false
    newCustomer.value = { name: '', contact_person: '', phone: '', email: '' }
  } catch (err) {
    error.value = err.message || 'Не удалось добавить заказчика'
    console.error('Ошибка при добавлении заказчика:', err)
  }
}

// Редактирование заказчика
const editCustomer = (id) => {
  router.push(`/customers/${id}/edit`)
}

// Удаление заказчика
const deleteCustomer = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить этого заказчика?')) return

  try {
    await ofetch(`/api/customers/${id}/`, {
      method: 'DELETE',
      baseURL: 'http://localhost:8000',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`,
      },
    })

    customers.value = customers.value.filter((c) => c.id !== id)
  } catch (err) {
    error.value = err.message || 'Не удалось удалить заказчика'
    console.error('Ошибка при удалении заказчика:', err)
  }
}

// Загружаем данные при монтировании компонента
onMounted(() => {
  fetchCustomers()
})
</script>

<style scoped>
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
</style>
