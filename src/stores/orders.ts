import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Order {
  id: number
  product: number
  quantity: number
  status: number // 0-активный, 1-выполнен
  created_at: string
  updated_at?: string
}

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [] as Order[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getOrderById: (state) => (id: number) => state.orders.find((o) => o.id === id),
  },

  actions: {
    async fetchOrders() {
      this.isLoading = true
      this.error = null
      try {
        const response = await api('/orders/')
        this.orders = response
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.error = error.message || 'Ошибка при загрузке заказов'
          console.error('Ошибка загрузки заказов:', error)
        } else {
          console.error('Unknown error:', error)
        }
      } finally {
        this.isLoading = false
      }
    },

    async createOrder(order: Omit<Order, 'id'>) {
      try {
        const newOrder = await api('/orders/', {
          method: 'POST',
          body: order,
        })
        this.orders.push(newOrder)
        return newOrder
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка создания заказа')
      }
    },

    async updateOrder(id: number, data: Partial<Order>) {
      try {
        const updated = await api(`/orders/${id}/`, {
          method: 'PATCH',
          body: data,
        })
        const index = this.orders.findIndex((o) => o.id === id)
        if (index !== -1) this.orders[index] = { ...this.orders[index], ...updated }
        return updated
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка обновления заказа')
      }
    },

    async deleteOrder(id: number) {
      try {
        await api(`/orders/${id}/`, {
          method: 'DELETE',
        })
        this.orders = this.orders.filter((o) => o.id !== id)
      } catch (error: any) {
        throw new Error(error.message || 'Ошибка удаления заказа')
      }
    },
  },
})
