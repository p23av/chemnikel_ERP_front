import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

import App from './App.vue'
import router from './router'

import { vuetify } from './plugins/vuetify'

/** LAYOUTS */
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.component('MainLayout', MainLayout)
app.component('AuthLayout', AuthLayout)

const authStore = useAuthStore()
authStore.restoreToken() // восстановление токена до первых запросов

app.mount('#app')
