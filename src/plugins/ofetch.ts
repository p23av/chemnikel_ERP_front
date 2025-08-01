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
      options.headers = {
        ...options.headers,
        'X-Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }
  },

  // onResponseError — вызывается при ошибках в ответах (например, 401)
  async onResponseError({ request, response, options }) {
    if (response.status === 401) {
      try {
        const newToken = await authStore.refreshToken() // Пытаемся обновить токен

        if (newToken) {
          // Сохраняем новый токен в store
          authStore.setAccessToken(newToken)

          // Повторяем оригинальный запрос с новым токеном
          return ofetch(request, {
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
    return Promise.reject(response)
  },
})

export default api

//   return {
//     provide: {
//       api: fetchInstance,
//     },
//   }
// })
