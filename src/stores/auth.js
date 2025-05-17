import { defineStore } from 'pinia'
import { ofetch } from 'ofetch'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    // returnUrl: null, // Для сохранения URL перед перенаправлением на логин
  }),

  actions: {
    async login(username, password) {
      password = '!123qwe!'
      const data = await ofetch('http://127.0.0.1:8000/api/auth/token/', {
        method: 'POST',
        body: { username, password },
        // headers: { 'Content-Type': 'application/json' },
      })

      this.setTokens(data.access, data.refresh)
      this.user = { username }
    },

    async refreshToken() {
      if (!this.refreshToken) {
        this.restoreToken()
      }

      if (!this.refreshToken) {
        this.logout()
        throw new Error('No refresh token available')
      }

      const data = await ofetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        body: { refresh: this.refreshToken },
      })

      this.setAccessToken(data.access)
      return data.access
    },

    async fetchUser() {
      if (!this.accessToken) return

      try {
        this.user = await ofetch('http://localhost:8000/api/user/', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await this.refreshToken()
            await this.fetchUser()
          } catch {
            this.logout()
          }
        } else {
          throw error
        }
      }
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
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

    setTokens(access, refresh) {
      this.accessToken = access
      this.refreshToken = refresh
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
    },

    setAccessToken(access) {
      this.accessToken = access
      localStorage.setItem('access_token', access)
    },
  },
})
