import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  url: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    url: 'http://api.p23av.ru',
  }),

  actions: {
    /**
     * Вход в систему. Запрашивает access и refresh токены.
     * @param username
     * @param password
     */
    async login(username: string, password: string) {
      const data = await api('/auth/token/', {
        method: 'POST',
        body: { username, password },
      })

      this.setTokens(data.access, data.refresh)
    },

    async me() {
      const data = await api('/users/me/')
      this.user = data
    },

    async apiRefreshToken() {
      if (!this.refreshToken) {
        this.restoreToken()
      }

      if (!this.refreshToken) {
        this.logout()
        throw new Error('No refresh token available')
      }

      const data = await api('/auth/token/refresh/', {
        method: 'POST',
        body: { refresh: this.refreshToken },
      })

      this.setAccessToken(data.access)
      return data.access
    },

    async fetchUser() {
      if (!this.accessToken) return

      try {
        this.user = await api('/users/')
      } catch (error: any) {
        // const err = error as { response?: { status?: number } }
        if (error?.status === 401) {
          try {
            await this.apiRefreshToken()
            await this.fetchUser()
          } catch {
            throw error
          }
        } else {
          throw error
        }
      }
    },

    logout() {
      api('/users/logout/', {
        method: 'POST',
        body: {
          refresh: this.refreshToken,
        },
      }).finally(() => {
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
    },

    restoreToken() {
      const access = localStorage.getItem('access_token')
      const refresh = localStorage.getItem('refresh_token')

      if (access) {
        this.accessToken = access
      }
      if (refresh) {
        this.refreshToken = refresh
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
