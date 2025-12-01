import { defineStore } from 'pinia'
// import { ofetch } from 'ofetch'
import api from '@/plugins/ofetch'

// Типы данных
export interface Customer {
  id: number
  name: string
  tax_id: string
  contact_person: string
  email: string
  phone: string
  is_active: boolean
}

interface CustomersState {
  customers: Customer[]
  currentCustomer: Customer | null
  isLoading: boolean
  error: string | null
}

export const useCustomersStore = defineStore('customers', {
  state: (): CustomersState => ({
    customers: [],
    currentCustomer: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    activeCustomers(state): Customer[] {
      return state.customers.filter((c) => c.is_active)
    },

    getCustomerById(state): (id: number) => Customer | undefined {
      return (id) => state.customers.find((c) => c.id === id)
    },
  },

  actions: {
    async fetchCustomers(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await api('/customers')
        this.customers = response
      } catch (err) {
        if (err instanceof Error) {
          this.error = err.message || 'Ошибка загрузки данных'
          console.error('Failed to fetch customers:', err)
        } else {
          console.log('Неизвестная ошибка:', err)
        }
      } finally {
        this.isLoading = false
      }
    },

    async addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
      try {
        // Используем api плагин - заголовки добавятся автоматически
        const newCustomer = await api<Customer>('/customers/', {
          method: 'POST',
          body: customerData,
        })

        this.customers.push(newCustomer)
        return newCustomer
      } catch (err) {
        if (err instanceof Error) {
          throw new Error(err.message || 'Ошибка создания')
        } else {
          throw new Error('Ошибка создания клиента')
        }
      }
    },

    async updateCustomer(id: number, updatedData: Partial<Customer>): Promise<Customer> {
      try {
        const updatedCustomer = await api(`/customers/${id}/`, {
          method: 'PATCH',
          body: updatedData,
        })

        const index = this.customers.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.customers[index] = { ...this.customers[index], ...updatedCustomer }
        }

        // Обновляем currentCustomer если он редактируется
        if (this.currentCustomer?.id === id) {
          this.currentCustomer = { ...this.currentCustomer, ...updatedCustomer }
        }
        return updatedCustomer
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message || 'Ошибка обновления клиента')
        }
        throw new Error('Ошибка обновления клиента')
      }
    },

    async deleteCustomer(id: number): Promise<void> {
      try {
        await api(`/customers/${id}/`, {
          method: 'DELETE',
        })

        // this.customers = this.customers.filter((c) => c.id !== id)
        await this.fetchCustomers()
        // Сбрасываем currentCustomer если удаляем текущего
        if (this.currentCustomer?.id === id) {
          this.currentCustomer = null
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message || 'Ошибка удаления клиента')
        }
        throw new Error('Ошибка удаления клиента')
      }
    },

    // Дополнительные методы для работы с текущим клиентом
    async fetchCustomerById(id: number): Promise<void> {
      try {
        this.isLoading = true
        this.error = null

        const customer = await api<Customer>(`/customers/${id}/`)
        this.currentCustomer = customer
      } catch (err: unknown) {
        if (err instanceof Error) {
          this.error = err.message
        } else {
          this.error = 'Ошибка загрузки данных клиента'
        }
        throw err // пробрасываем ошибку дальше
      } finally {
        this.isLoading = false
      }
    },

    clearCurrentCustomer(): void {
      this.currentCustomer = null
    },

    clearError(): void {
      this.error = null
    },
  },
})
