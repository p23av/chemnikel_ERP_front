import { defineStore } from 'pinia'
import { ofetch } from 'ofetch'

interface AuthState {
  user: {
    id: number
    username: string
    email: string
    full_name: string
    role: string
  } | null
  accessToken: string | null
  refreshToken: string | null
  url: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    url: 'http://127.0.0.1:8000',
    // returnUrl: null, // Для сохранения URL перед перенаправлением на логин
  }),

  getters: {
    apiFetch: (state) => {
      return ofetch.create({
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json',
        },
      })
    },
  },

  actions: {
    async login(username: string, password: string) {
      // password = '!123qwe!'
      const data = await ofetch('http://127.0.0.1:8000/api/auth/token/', {
        method: 'POST',
        body: { username, password },
        // headers: { 'Content-Type': 'application/json' },
      })

      this.setTokens(data.access, data.refresh)
    },

    async me() {
      const data = await this.apiFetch(`${this.url}/api/users/me/`)
      console.log(data)
      this.user = data
      // this.setTokens(data.access, data.refresh)
    },

    async apiRefreshToken() {
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
        this.user = await ofetch('http://localhost:8000/api/users/', {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })
      } catch (error) {
        const err = error as { response?: { status?: number } }
        if (err.response?.status === 401) {
          try {
            await this.apiRefreshToken()
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
      this.apiFetch(`${this.url}/api/users/logout/`, {
        method: 'POST',
        body: {
          refresh: `${this.refreshToken}`,
        },
      }).then(() => {
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
