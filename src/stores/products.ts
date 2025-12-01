// stores/products.ts
import { defineStore } from 'pinia'
import api from '@/plugins/ofetch'

export interface Product {
  id: number
  name: string
  material: string
  surface_area: number
  coating_data: { [key: string]: string }
  customer: number
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [] as Product[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getProductById(state): (id: number) => Product | undefined {
      return (id) => state.products.find((c) => c.id === id)
    },
  },

  actions: {
    async fetchProducts() {
      this.isLoading = true
      try {
        const response = await api('/products')
        this.products = []
        this.products.push(...response)
      } catch (error) {
        if (error instanceof Error) {
          this.error = error.message || 'Ошибка при загрузке продуктов'
        } else {
          console.log('Неизвестная ошибка:', error)
        }
      } finally {
        this.isLoading = false
      }
    },

    async createProduct(product: Omit<Product, 'id'>) {
      const newProduct = await api('/products/', {
        method: 'POST',
        body: product,
      })
      this.products.push(newProduct)
    },

    async updateProduct(id: number, updateData: Partial<Omit<Product, 'id'>>) {
      const updated = await api(`/products/${id}/`, {
        method: 'PATCH',
        body: updateData, // отправляем только измененные поля
      })
      const index = this.products.findIndex((p) => p.id === id)
      if (index !== -1) this.products[index] = { ...this.products[index], ...updated }
    },

    async deleteProduct(id: number) {
      await api(`/products/${id}`, {
        method: 'DELETE',
      })
      this.products = this.products.filter((p) => p.id !== id)
    },
  },
})
