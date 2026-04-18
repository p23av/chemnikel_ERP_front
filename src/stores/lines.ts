/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface CoatingLine {
  id: number
  code: string
  name: string
  short_name: string
  has_corrections: boolean
  can_boil: boolean
  is_active: boolean
  order: number
  sublines_count: number
  created_at: string
}

export interface CoatingSubline {
  id: number
  line: number
  line_name: string
  line_code: string
  number: number
  name: string
  is_active: boolean
  created_at: string
}

export const useLinesStore = defineStore('lines', {
  state: () => ({
    lines: [] as CoatingLine[],
    sublines: [] as CoatingSubline[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    // Активные линии, отсортированные по order
    activeLines: (state) =>
      state.lines.filter((l) => l.is_active).sort((a, b) => a.order - b.order),

    // Получить название линии по ID
    getLineName: (state) => (lineId: number) => {
      const line = state.lines.find((l) => l.id === lineId)
      return line?.name || 'Неизвестно'
    },

    // НОВЫЙ ГЕТТЕР: получить сокращенное название линии по ID
    getLineShortName: (state) => (lineId: number) => {
      const line = state.lines.find((l) => l.id === lineId)
      return line?.short_name || line?.code || '?'
    },

    // НОВЫЙ ГЕТТЕР: получить сокращенное название линии по коду
    getShortNameByCode: (state) => (code: string) => {
      const line = state.lines.find((l) => l.code === code)
      return line?.short_name || code
    },

    // Получить линию по коду
    getLineByCode: (state) => (code: string) => state.lines.find((l) => l.code === code),

    // Получить ванны для конкретной линии
    getSublinesByLine: (state) => (lineId: number) =>
      state.sublines
        .filter((s) => s.line === lineId && s.is_active)
        .sort((a, b) => a.number - b.number),

    // Получить название ванны
    getSublineName: (state) => (sublineId: number) => {
      const subline = state.sublines.find((s) => s.id === sublineId)
      return subline?.name || `Ванна ${subline?.number || ''}`
    },

    // Получить линию по ID
    getLineById: (state) => (lineId: number) => state.lines.find((l) => l.id === lineId),

    // Получить ванну по ID
    getSublineById: (state) => (sublineId: number) =>
      state.sublines.find((s) => s.id === sublineId),

    // НОВЫЙ ГЕТТЕР: линии, которые могут кипеть
    linesThatCanBoil: (state) =>
      state.lines.filter((l) => l.is_active && l.can_boil).sort((a, b) => a.order - b.order),
  },

  actions: {
    async fetchLines() {
      this.isLoading = true
      try {
        const response = await api('/coating-lines/')
        this.lines = response
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки линий'
        console.error('Ошибка загрузки линий:', error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchSublines(lineId?: number) {
      this.isLoading = true
      try {
        const url = lineId ? `/coating-sublines/?line=${lineId}` : '/coating-sublines/'
        const response = await api(url)
        this.sublines = response
      } catch (error: any) {
        this.error = error.message || 'Ошибка загрузки ванн'
        console.error('Ошибка загрузки ванн:', error)
      } finally {
        this.isLoading = false
      }
    },

    // Инициализация - загружаем и линии, и ванны
    async init() {
      await Promise.all([this.fetchLines(), this.fetchSublines()])
    },
  },
})
