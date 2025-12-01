import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Process {
  id: number
  order: number
  quantity: number
  line: string // '0' | '1' | '2'
  subline: number // 1, 2, 3...
  start_time: string | null
  end_time: string | null
  created_at: string
  worker: number | null
  line_display?: string // Для отображения названия линии
}

export const useProcessesStore = defineStore('processes', {
  // state: () => ({
  //   processes: [
  //     {
  //       id: 1,
  //       order: 1,
  //       line: 'nickel',
  //       subline: '№1',
  //       quantity: 20,
  //       start_time: '2025-10-14T08:00:00',
  //       end_time: '2025-10-14T10:00:00',
  //       status: 'done',
  //     },
  //     {
  //       id: 2,
  //       order: 1,
  //       line: 'nickel',
  //       subline: '№2',
  //       quantity: 15,
  //       start_time: '2025-10-14T09:00:00',
  //       end_time: '2025-10-14T11:00:00',
  //       status: 'done',
  //     },
  //     {
  //       id: 3,
  //       order: 2,
  //       line: 'copper',
  //       subline: '№1',
  //       quantity: 300,
  //       start_time: '2025-10-14T10:00:00',
  //       end_time: '2025-10-14T13:00:00',
  //       status: 'in_progress',
  //     },
  //     {
  //       id: 4,
  //       order: 1,
  //       line: 'ovi',
  //       subline: '№1',
  //       quantity: 25,
  //       start_time: '2025-10-14T12:00:00',
  //       end_time: '2025-10-14T14:00:00',
  //       status: 'in_progress',
  //     },
  //   ] as Process[],
  // }),

  state: () => ({
    processes: [] as Process[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getProcessById: (state) => (id: number) => state.processes.find((p) => p.id === id),
    getProcessesByOrder: (state) => (orderId: number) =>
      state.processes.filter((p) => p.order === orderId),
  },

  actions: {
    async fetchProcesses() {
      this.isLoading = true
      this.error = null
      try {
        const response = await api('/processes/')
        this.processes = response
      } catch (error: any) {
        this.error = error.message || 'Ошибка при загрузке процессов'
        console.error('Ошибка загрузки процессов:', error)
      } finally {
        this.isLoading = false
      }
    },

    async createProcess(process: Omit<Process, 'id'>) {
      try {
        const newProcess = await api('/processes/', {
          method: 'POST',
          body: process,
        })
        this.processes.push(newProcess)
        return newProcess
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка создания процесса')
      }
    },

    async updateProcess(id: number, data: Partial<Process>) {
      try {
        const updated = await api(`/processes/${id}/`, {
          method: 'PATCH',
          body: data,
        })
        const index = this.processes.findIndex((p) => p.id === id)
        if (index !== -1) this.processes[index] = { ...this.processes[index], ...updated }
        return updated
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка обновления процесса')
      }
    },

    async deleteProcess(id: number) {
      try {
        await api(`/processes/${id}/`, {
          method: 'DELETE',
        })
        this.processes = this.processes.filter((p) => p.id !== id)
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка удаления процесса')
      }
    },
  },
})
