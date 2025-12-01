import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

// ЭКСПОРТИРУЕМ тип User
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'owner' | 'manager' | 'worker'
  is_active: boolean // ← ДОБАВЛЯЕМ is_active
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  url: string
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    url: 'http://api.p23av.ru',
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    // Убрал лишние проверки, оставил только базовые
  },

  actions: {
    /**
     * Вход в систему. Запрашивает access и refresh токены.
     * @param username
     * @param password
     */
    async login(username: string, password: string) {
      this.isLoading = true
      try {
        const data = await api('/auth/token/', {
          method: 'POST',
          body: { username, password },
        })

        this.setTokens(data.access, data.refresh)
        await this.fetchUser() // Сразу загружаем данные пользователя
      } finally {
        this.isLoading = false
      }
    },

    // async me() {
    //   const data = await api('/users/me/')
    //   this.user = data
    // },

    async apiRefreshToken() {
      if (!this.refreshToken) {
        this.restoreToken()
      }

      if (!this.refreshToken) {
        this.logout()
        throw new Error('No refresh token available')
      }

      try {
        const data = await api('/auth/token/refresh/', {
          method: 'POST',
          body: { refresh: this.refreshToken },
        })

        this.setAccessToken(data.access)
        return data.access
      } catch (error) {
        this.logout()
        throw error
      }
    },

    /**
     * Получение данных текущего пользователя
     */
    async fetchUser() {
      if (!this.accessToken) {
        throw new Error('No access token')
      }

      this.isLoading = true
      try {
        // Используем endpoint /users/me/ для получения данных текущего пользователя
        const userData = await api('/users/me/')
        console.log('🟢 User data received:', userData)

        // Проверяем что роль есть в ответе
        if (!userData.role) {
          console.warn('⚠️ Role not found in user data:', userData)
        }

        this.user = userData
      } catch (error: any) {
        console.error('❌ Error fetching user:', error)

        if (error?.status === 401) {
          try {
            await this.apiRefreshToken()
            await this.fetchUser() // Повторяем после обновления токена
          } catch {
            this.logout()
            throw error
          }
        } else {
          throw error
        }
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Получение списка всех пользователей (только для менеджеров)
     */
    async fetchAllUsers(): Promise<User[]> {
      if (!this.accessToken) {
        throw new Error('No access token')
      }

      try {
        const users = await api('/users/')
        console.log('🟢 All users received:', users)
        return users
      } catch (error: any) {
        console.error('❌ Error fetching users:', error)

        if (error?.status === 401) {
          try {
            await this.apiRefreshToken()
            return await this.fetchAllUsers() // Повторяем после обновления токена
          } catch {
            throw error
          }
        } else {
          throw error
        }
      }
    },

    /**
     * Создание нового пользователя
     */
    async createUser(userData: {
      username: string
      full_name: string
      email: string
      role: 'owner' | 'manager' | 'worker'
      password: string
      is_active?: boolean
    }): Promise<User> {
      try {
        const newUser = await api('/users/create/', {
          method: 'POST',
          body: {
            ...userData,
            is_active: userData.is_active ?? true, // default true
          },
        })
        console.log('🟢 User created:', newUser)
        return newUser
      } catch (error: any) {
        console.error('❌ Error creating user:', error)
        throw error
      }
    },

    /**
     * Обновление пользователя
     */
    async updateUser(
      userId: number,
      updateData: Partial<{
        username: string
        full_name: string
        email: string
        role: 'owner' | 'manager' | 'worker'
        is_active: boolean
        password?: string
      }>,
    ): Promise<User> {
      try {
        const updatedUser = await api(`/users/${userId}/`, {
          method: 'PATCH',
          body: updateData,
        })
        console.log('🟢 User updated:', updatedUser)
        return updatedUser
      } catch (error: any) {
        console.error('❌ Error updating user:', error)
        throw error
      }
    },

    /**
     * Удаление пользователя
     */
    async deleteUser(userId: number): Promise<void> {
      try {
        await api(`/users/${userId}/`, {
          method: 'DELETE',
        })
        console.log('🟢 User deleted:', userId)
      } catch (error: any) {
        console.error('❌ Error deleting user:', error)
        throw error
      }
    },

    async logout() {
      try {
        if (this.refreshToken) {
          await api('/users/logout/', {
            method: 'POST',
            body: {
              refresh: this.refreshToken,
            },
          })
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    },

    /**
     * Восстановление токенов из localStorage
     */
    restoreToken() {
      const access = localStorage.getItem('access_token')
      const refresh = localStorage.getItem('refresh_token')

      if (access) {
        this.accessToken = access
      }
      if (refresh) {
        this.refreshToken = refresh
      }

      // Автоматически загружаем пользователя при восстановлении токена
      if (access && !this.user) {
        this.fetchUser().catch((error) => {
          console.warn('Failed to fetch user after token restore:', error)
        })
      }
    },

    setTokens(access: string, refresh: string) {
      this.accessToken = access
      this.refreshToken = refresh
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    },

    setAccessToken(access: string) {
      this.accessToken = access
      localStorage.setItem('access_token', access)
    },
  },
})
