/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Process {
  id: number
  order: number
  quantity: number
  line: number // ИЗМЕНЕНО: теперь число (ID линии)
  subline: number // ИЗМЕНЕНО: теперь число (ID ванны)
  start_time: string | null
  end_time: string | null
  created_at: string
  worker: number | null
  // Дополнительные поля, которые приходят с бэка
  line_name?: string
  line_code?: string
  line_display?: string
  subline_number?: number
  subline_name?: string
}

export const useProcessesStore = defineStore('processes', {
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

    async createProcess(
      process: Omit<
        Process,
        'id' | 'line_name' | 'line_code' | 'line_display' | 'subline_number' | 'subline_name'
      >,
    ) {
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
