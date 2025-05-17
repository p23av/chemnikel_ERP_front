import { ofetch } from 'ofetch'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  const fetchInstance = ofetch.create({
    baseURL: 'http://localhost:8000',
    async onRequest({ options }) {
      // Добавляем токен к каждому запросу
      const token = authStore.accessToken || localStorage.getItem('access_token')
      console.log(`from onRequest: ${token}`)

      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    },
    async onResponseError({ request, response, options }) {
      // Обновляем токен при 401 ошибке
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
                Authorization: `Bearer ${newToken}`,
              },
            })
          }
        } catch (error) {
          // Если не получилось обновить токен, выходим из аккаунта
          authStore.logout()
          window.location.href = '/login' // TODO - почему не через router
          console.log(error)
        }
      }
      return Promise.reject(response)
    },
  })

  return {
    provide: {
      api: fetchInstance,
    },
  }
})
