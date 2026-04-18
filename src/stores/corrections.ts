import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Correction {
  id: number
  type: 'volume' | 'refresh'
  amount: number | null
  line: number // ИЗМЕНЕНО: теперь число (ID линии)
  subline: number
  correction_time: string
  created_at: string
  worker: number | null
  // Добавочные поля с бэка
  line_name?: string
  line_code?: string
  subline_number?: number
  subline_name?: string
}

interface CreateCorrectionData {
  amount: number | null
  line: number // ИЗМЕНЕНО: теперь число
  subline: number
  correction_time: string
  worker: number | null
}

export const useCorrectionsStore = defineStore('corrections', {
  state: () => ({
    corrections: [] as Correction[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getCorrectionById: (state) => (id: number) => state.corrections.find((c) => c.id === id),

    // Получить коррекции для конкретной ячейки календаря (по дате, линии, саблине)
    getCorrectionsForCell: (state) => (line: number, subline: number, date: Date) => {
      const targetDate = date.toISOString().split('T')[0] // YYYY-MM-DD

      return state.corrections.filter((correction) => {
        const correctionDate = new Date(correction.correction_time).toISOString().split('T')[0]

        return (
          correction.line === line &&
          correction.subline === subline &&
          correctionDate === targetDate
        )
      })
    },

    // Получить коррекции для периода (для загрузки)
    getCorrectionsForPeriod: (state) => (startDate: Date, endDate: Date) => {
      const start = startDate.toISOString().split('T')[0]
      const end = endDate.toISOString().split('T')[0]

      return state.corrections.filter((correction) => {
        const correctionDate = new Date(correction.correction_time).toISOString().split('T')[0]

        return correctionDate >= start && correctionDate <= end
      })
    },
  },

  actions: {
    // Загрузка коррекций для периода
    async fetchCorrections(startDate: Date, endDate: Date) {
      this.isLoading = true
      this.error = null
      try {
        const start = startDate.toISOString().split('T')[0]
        const end = endDate.toISOString().split('T')[0]

        const response = await api('/corrections/', {
          params: { start_date: start, end_date: end },
        })

        this.corrections = response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки коррекций'
        console.error('Ошибка загрузки коррекций:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Создание коррекции
    async createCorrection(data: CreateCorrectionData) {
      try {
        console.log('📤 Отправка коррекции на сервер:', data) // <-- ДОБАВЬТЕ

        const newCorrection = await api('/corrections/', {
          method: 'POST',
          body: data,
        })

        console.log('✅ Ответ сервера:', newCorrection) // <-- ДОБАВЬТЕ

        this.corrections.push(newCorrection)
        return newCorrection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('❌ Ошибка от сервера:', error.response?.data) // <-- ДОБАВЬТЕ
        throw new Error(error.message || 'Ошибка создания коррекции')
      }
    },

    // Обновление коррекции
    async updateCorrection(id: number, data: Partial<CreateCorrectionData>) {
      try {
        const updated = await api(`/corrections/${id}/`, {
          method: 'PATCH',
          body: data,
        })

        const index = this.corrections.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.corrections[index] = { ...this.corrections[index], ...updated }
        }

        return updated
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка обновления коррекции')
      }
    },

    // Удаление коррекции
    async deleteCorrection(id: number) {
      try {
        await api(`/corrections/${id}/`, {
          method: 'DELETE',
        })

        this.corrections = this.corrections.filter((c) => c.id !== id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка удаления коррекции')
      }
    },
  },
})
