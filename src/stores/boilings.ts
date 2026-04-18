/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Boiling {
  id: number
  subline: number
  subline_number: number
  subline_name: string
  line_id: number
  line_name: string
  date: string
  start_time: string
  end_time: string
  created_at: string
  worker: number | null
}

interface CreateBoilingData {
  subline: number
  date: string
  start_time: string
  end_time: string
  worker: number | null
}

export const useBoilingsStore = defineStore('boilings', {
  state: () => ({
    boilings: [] as Boiling[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getBoilingById: (state) => (id: number) => state.boilings.find((b) => b.id === id),

    // Получить кипения для конкретной ванны
    getBoilingsBySubline: (state) => (sublineId: number) =>
      state.boilings.filter((b) => b.subline === sublineId),

    // Получить кипения для конкретной даты
    // getBoilingsByDate: (state) => (date: string) => state.boilings.filter((b) => b.date === date),
  },

  actions: {
    async fetchBoilings(startDate: Date, endDate: Date) {
      this.isLoading = true
      this.error = null
      try {
        const start = startDate.toISOString().split('T')[0]
        const end = endDate.toISOString().split('T')[0]

        const response = await api('/boilings/', {
          params: { start_date: start, end_date: end },
        })

        this.boilings = response
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки кипений'
        console.error('Ошибка загрузки кипений:', error)
      } finally {
        this.isLoading = false
      }
    },

    async createBoiling(data: CreateBoilingData) {
      try {
        const newBoiling = await api('/boilings/', {
          method: 'POST',
          body: data,
        })
        this.boilings.push(newBoiling)
        return newBoiling
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка создания кипения')
      }
    },

    async updateBoiling(id: number, data: Partial<CreateBoilingData>) {
      try {
        const updated = await api(`/boilings/${id}/`, {
          method: 'PATCH',
          body: data,
        })
        const index = this.boilings.findIndex((b) => b.id === id)
        if (index !== -1) {
          this.boilings[index] = { ...this.boilings[index], ...updated }
        }
        return updated
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка обновления кипения')
      }
    },

    async deleteBoiling(id: number) {
      try {
        await api(`/boilings/${id}/`, {
          method: 'DELETE',
        })
        this.boilings = this.boilings.filter((b) => b.id !== id)
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка удаления кипения')
      }
    },
  },
})
