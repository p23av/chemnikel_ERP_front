<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

import type { User } from '@/stores/auth'

const authStore = useAuthStore()
const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const showAddForm = ref(false)
const editingUser = ref<User | null>(null)

interface UserForm {
  username: string
  full_name: string
  email: string
  role: 'owner' | 'manager' | 'worker'
  password: string
  is_active: boolean
}

const newUser = ref<UserForm>({
  username: '',
  full_name: '',
  email: '',
  role: 'worker',
  password: '',
  is_active: true,
})

// Получение реальных пользователей с сервера
const fetchUsers = async () => {
  isLoading.value = true
  error.value = null
  try {
    users.value = await authStore.fetchAllUsers()
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message)
    } else {
      console.error('Unknown error:', err)
    }
  } finally {
    isLoading.value = false
  }
}

// Заглушка сотрудников
// const placeholderUsers: User[] = [
//   {
//     id: 1,
//     full_name: 'Иванов Иван',
//     phone: '+7 900 111-22-33',
//     email: 'ivanov@example.com',
//     role: 'Собственник',
//   },
//   {
//     id: 2,
//     full_name: 'Петров Пётр',
//     phone: '+7 900 222-33-44',
//     email: 'petrov@example.com',
//     role: 'Менеджер',
//   },
//   {
//     id: 3,
//     full_name: 'Сидоров Алексей',
//     phone: '+7 900 333-44-55',
//     email: 'sidorov@example.com',
//     role: 'Гальваник',
//   },
//   {
//     id: 4,
//     full_name: 'Кузнецов Дмитрий',
//     phone: '+7 900 444-55-66',
//     email: 'kuznetsov@example.com',
//     role: 'Гальваник',
//   },
//   {
//     id: 5,
//     full_name: 'Фёдоров Николай',
//     phone: '+7 900 555-66-77',
//     email: 'fedorov@example.com',
//     role: 'Гальваник',
//   },
//   {
//     id: 6,
//     full_name: 'Морозов Сергей',
//     phone: '+7 900 666-77-88',
//     email: 'morozov@example.com',
//     role: 'Гальваник',
//   },
//   {
//     id: 7,
//     full_name: 'Васильев Андрей',
//     phone: '+7 900 777-88-99',
//     email: 'vasiliev@example.com',
//     role: 'Гальваник',
//   },
//   {
//     id: 8,
//     full_name: 'Николаев Олег',
//     phone: '+7 900 888-99-00',
//     email: 'nikolaev@example.com',
//     role: 'Гальваник',
//   },
// ]

// Создание нового пользователя
const addUser = async () => {
  try {
    const createdUser = await authStore.createUser({ ...newUser.value })

    // Добавляем в локальный список
    users.value.push(createdUser)

    // Сбрасываем форму
    resetForm()
    showAddForm.value = false

    alert('Пользователь успешно создан!')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message || 'Ошибка при создании пользователя'
      console.error('Error creating user:', err.message)
    } else {
      error.value = 'Ошибка при создании пользователя'
      console.error('Unknown error:', err)
    }
  }
}

// Обновление пользователя
const updateUser = async () => {
  if (!editingUser.value) return

  try {
    const updatedUser = await authStore.updateUser(editingUser.value.id, {
      username: editingUser.value.username,
      full_name: editingUser.value.full_name,
      email: editingUser.value.email,
      role: editingUser.value.role,
      is_active: editingUser.value.is_active,
    })

    // Обновляем в локальном списке
    const index = users.value.findIndex((u) => u.id === updatedUser.id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }

    resetForm()
    showAddForm.value = false
    editingUser.value = null

    alert('Пользователь успешно обновлен!')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message || 'Ошибка при обновлении пользователя'
      console.error('Error updating user:', err.message)
    } else {
      error.value = 'Ошибка при обновлении пользователя'
      console.error('Unknown error:', err)
    }
  }
}

// Удаление пользователя
const deleteUser = async (user: User) => {
  if (!confirm(`Вы уверены, что хотите удалить пользователя "${user.full_name}"?`)) {
    return
  }

  try {
    await authStore.deleteUser(user.id)

    // Удаляем из локального списка
    users.value = users.value.filter((u) => u.id !== user.id)

    alert('Пользователь успешно удален!')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message || 'Ошибка при удалении пользователя'
      console.error('Error deleting user:', err.message)
    } else {
      error.value = 'Ошибка при удалении пользователя'
      console.error('Unknown error:', err)
    }
  }
}

// Деактивация/активация пользователя
const toggleUserStatus = async (user: User) => {
  try {
    const updatedUser = await authStore.updateUser(user.id, {
      is_active: !user.is_active,
    })

    // Обновляем в локальном списке
    const index = users.value.findIndex((u) => u.id === updatedUser.id)
    if (index !== -1) {
      users.value[index] = updatedUser
    }

    alert(`Пользователь ${user.is_active ? 'деактивирован' : 'активирован'}!`)
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message || 'Ошибка при изменении статуса пользователя'
      console.error('Error toggling user status:', err)
    } else {
      error.value = 'Ошибка при изменении статуса пользователя'
      console.error('Unknown error:', err)
    }
  }
}

// Начало редактирования пользователя
const startEdit = (user: User) => {
  editingUser.value = { ...user }
  showAddForm.value = true
}

// Сброс формы
const resetForm = () => {
  newUser.value.username = ''
  newUser.value.full_name = ''
  newUser.value.email = ''
  newUser.value.role = 'worker'
  newUser.value.password = ''
  newUser.value.is_active = true
  editingUser.value = null
}

// Закрытие формы
const closeForm = () => {
  showAddForm.value = false
  resetForm()
}

// Функция для перевода роли на русский
const getRoleDisplayName = (role: string) => {
  const roleNames: { [key: string]: string } = {
    owner: 'Собственник',
    manager: 'Менеджер',
    worker: 'Оператор линии',
  }
  return roleNames[role] || role
}

// Функция для перевода статуса
const getStatusDisplay = (isActive: boolean) => {
  return isActive ? '🟢 Активен' : '🔴 Неактивен'
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="manager-dashboard">
    <header class="dashboard-header">
      <h2>Сотрудники</h2>
      <p class="subtitle">Управление сотрудниками системы</p>
    </header>

    <div class="content-section">
      <div class="section-header">
        <h3>Список сотрудников</h3>
        <div class="header-actions">
          <button @click="fetchUsers" class="btn refresh-btn" :disabled="isLoading">
            {{ isLoading ? '🔄 Загрузка...' : '🔄 Обновить' }}
          </button>
          <button @click="showAddForm = true" class="btn add-btn">➕ Добавить сотрудника</button>
        </div>
      </div>

      <div v-if="isLoading && users.length === 0" class="loading-indicator">Загрузка данных...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else>
        <table class="data-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Должность</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.full_name }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ getRoleDisplayName(user.role) }}
                </span>
              </td>
              <td>
                <button
                  @click="toggleUserStatus(user)"
                  class="status-btn"
                  :class="{ active: user.is_active }"
                  :title="user.is_active ? 'Деактивировать' : 'Активировать'"
                >
                  {{ getStatusDisplay(user.is_active) }}
                </button>
              </td>
              <td>
                <button @click="startEdit(user)" class="action-btn edit-btn" title="Редактировать">
                  ✏️
                </button>
                <button
                  @click="deleteUser(user)"
                  class="action-btn delete-btn"
                  title="Удалить"
                  :disabled="user.id === authStore.user?.id"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="users.length === 0 && !isLoading" class="empty-state">
          Нет данных о сотрудниках
        </div>
      </div>

      <!-- Форма добавления/редактирования пользователя -->
      <div v-if="showAddForm" class="form-overlay" @click.self="closeForm">
        <div class="form-modal">
          <h3>{{ editingUser ? 'Редактировать сотрудника' : 'Добавить сотрудника' }}</h3>

          <!-- Форма для создания нового пользователя -->
          <form v-if="!editingUser" @submit.prevent="addUser">
            <div class="form-group">
              <label>ФИО *</label>
              <input v-model="newUser.full_name" required placeholder="Иванов Иван Иванович" />
            </div>
            <div class="form-group">
              <label>Логин *</label>
              <input v-model="newUser.username" required placeholder="ivanov.ii" />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input
                v-model="newUser.email"
                type="email"
                required
                placeholder="ivanov@example.com"
              />
            </div>
            <div class="form-group">
              <label>Пароль *</label>
              <input v-model="newUser.password" type="password" required placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Должность *</label>
              <select v-model="newUser.role" required>
                <option value="worker">Оператор линии</option>
                <option value="manager">Менеджер</option>
                <option value="owner">Собственник</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn save-btn">💾 Сохранить</button>
              <button type="button" class="btn cancel-btn" @click="closeForm">❌ Отмена</button>
            </div>
          </form>

          <!-- Форма для редактирования пользователя -->
          <form v-else @submit.prevent="updateUser">
            <div class="form-group">
              <label>ФИО *</label>
              <input v-model="editingUser.full_name" required placeholder="Иванов Иван Иванович" />
            </div>
            <div class="form-group">
              <label>Логин *</label>
              <input v-model="editingUser.username" required placeholder="ivanov.ii" />
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input
                v-model="editingUser.email"
                type="email"
                required
                placeholder="ivanov@example.com"
              />
            </div>
            <div class="form-group">
              <label>Должность *</label>
              <select v-model="editingUser.role" required>
                <option value="worker">Оператор линии</option>
                <option value="manager">Менеджер</option>
                <option value="owner">Собственник</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn save-btn">💾 Обновить</button>
              <button type="button" class="btn cancel-btn" @click="closeForm">❌ Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manager-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.dashboard-header {
  margin-bottom: 20px;
}

.content-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.refresh-btn {
  background-color: #3b82f6;
  color: #fff;
}

.add-btn {
  background-color: #10b981;
  color: #fff;
  margin-top: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.data-table th,
.data-table td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}

.data-table th {
  background: #f3f4f6;
  font-weight: 600;
}

.action-btn {
  padding: 4px 8px;
  margin-right: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.edit-btn {
  /* background-color: #facc15; */
  color: #000;
}

.delete-btn {
  /* background-color: #ef4444; */
  color: #fff;
}

.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 41, 59, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.form-modal {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 4px;
  display: block;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.save-btn {
  background-color: #3b82f6;
  color: #fff;
}

.save-btn:hover {
  background-color: #2563eb;
}

.cancel-btn {
  background-color: #6b7280;
  color: #fff;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #64748b;
}

.error-message {
  padding: 12px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 6px;
  margin-bottom: 12px;
}
</style>
