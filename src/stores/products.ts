// stores/products.ts
import { defineStore } from 'pinia'
import { ofetch } from 'ofetch'

export interface Product {
  id: number
  customer: number
  name: string
  description: string
  tags?: string[]
}

export const useProductsStore = defineStore('products', {
  state: () => ({
    products: [
      {
        id: 1,
        name: 'Кожух 32x80',
        description: 'Защита механизма',
        customer: 1,
      },
      {
        id: 2,
        name: 'Кожух 32x120',
        description: 'Защита механизма 3',
        customer: 1,
      },
      {
        id: 3,
        name: 'УВРД',
        description: 'Корпус и крышка',
        customer: 2,
      },
    ] as Product[],
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProducts() {
      this.isLoading = true
      try {
        const response = await ofetch<Product[]>('/api/products', {
          method: 'GET',
          baseURL: 'http://localhost:8000',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        })
        this.products.push(...response)
      } catch (error: any) {
        this.error = error.message || 'Ошибка при загрузке продуктов'
      } finally {
        this.isLoading = false
      }
    },

    async createProduct(product: Omit<Product, 'id'>) {
      const newProduct = await ofetch<Product>('/api/products', {
        method: 'POST',
        body: product,
      })
      this.products.push(newProduct)
    },

    async updateProduct(product: Product) {
      const updated = await ofetch<Product>(`/api/products/${product.id}`, {
        method: 'PUT',
        body: product,
      })
      const index = this.products.findIndex((p) => p.id === updated.id)
      if (index !== -1) this.products[index] = updated
    },

    async deleteProduct(id: number) {
      await ofetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      this.products = this.products.filter((p) => p.id !== id)
    },
  },
})
