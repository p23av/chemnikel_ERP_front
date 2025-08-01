import { defineStore } from 'pinia'
import { ofetch } from 'ofetch'

// Типы данных
export interface Customer {
  id: number
  name: string
  tax_id: string
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
    customers: [
      {
        id: 4,
        name: 'ООО "ИСС"',
        tax_id: '987654321098',
        email: 'smirnov@mail.ru',
        phone: '+79161234567',
        is_active: true,
      },
      {
        id: 2,
        name: 'ООО "ХОЛИНДЕН"',
        tax_id: '987654321098',
        email: 'smirnov@mail.ru',
        phone: '+79161234567',
        is_active: true,
      },
      {
        id: 3,
        name: 'ООО Ромашка',
        tax_id: '123456789012',
        email: 'contact@romashka.ru',
        phone: '+74951234567',
        is_active: false,
      },
    ],
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
        const response = await ofetch<Customer[]>('/api/customers/', {
          method: 'GET',
          baseURL: 'http://localhost:8000',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
        this.customers.push(...response)
        // this.customers = response
      } catch (err: any) {
        this.error = err.message || 'Ошибка загрузки данных'
        console.error('Failed to fetch customers:', err)
      } finally {
        this.isLoading = false
      }
    },

    async addCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
      try {
        const newCustomer = await ofetch<Customer>('/api/customers/', {
          method: 'POST',
          body: customerData,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })

        this.customers.push(newCustomer)
        return newCustomer
      } catch (err: any) {
        throw new Error(err.message || 'Ошибка создания')
      }
    },

    async updateCustomer(id: number, updatedData: Partial<Customer>): Promise<Customer> {
      try {
        const updatedCustomer = await ofetch<Customer>(`/api/customers/${id}/`, {
          method: 'PATCH',
          body: updatedData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })

        const index = this.customers.findIndex((c) => c.id === id)
        if (index !== -1) {
          this.customers[index] = updatedCustomer
        }
        return updatedCustomer
      } catch (err: any) {
        throw new Error(err.message || 'Ошибка обновления')
      }
    },

    async deleteCustomer(id: number): Promise<void> {
      try {
        await ofetch(`/api/customers/${id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })

        this.customers = this.customers.filter((c) => c.id !== id)
      } catch (err: any) {
        throw new Error(err.message || 'Ошибка удаления')
      }
    },
  },
})
