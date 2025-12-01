import { ofetch } from 'ofetch'
import { useAuthStore } from '../stores/auth'
import { API_BASE_URL } from '@/config/api'

const api = ofetch.create({
  baseURL: API_BASE_URL,
  // baseURL: 'http://api.p23av.ru/api',

  // onRequest — вызывается перед каждым запросом
  async onRequest({ options }) {
    // Добавляем токен к каждому запросу
    const authStore = useAuthStore()
    const token = authStore.accessToken || localStorage.getItem('access_token')

    if (token) {
      const headers = new Headers(options.headers)
      headers.set('X-Authorization', `Bearer ${token}`)
      headers.set('Content-Type', 'application/json')

      options.headers = headers
    }
  },

  // onResponseError — вызывается при ошибках в ответах (например, 401)
  async onResponseError({ request, response, options }) {
    // console.log(request)
    // console.log(response)
    // console.log(options)

    if (response.status === 401) {
      const authStore = useAuthStore()
      try {
        const newToken = await authStore.apiRefreshToken() // Пытаемся обновить токен
        console.log(!!newToken)

        if (newToken) {
          // Сохраняем новый токен в store
          authStore.setAccessToken(newToken)

          // Повторяем оригинальный запрос с новым токеном
          await ofetch(request, {
            ...options,
            headers: {
              ...options.headers,
              'X-Authorization': `Bearer ${newToken}`,
            },
          })
        }
      } catch {
        // Если не получилось обновить токен, выходим из аккаунта
        authStore.logout()
        throw new Error('Unauthorized')
      }
    }
    throw response._data || response
  },
})

export default api
