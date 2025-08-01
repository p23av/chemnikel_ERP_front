<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue'
import type { Customer } from '@/stores/customers'
import type { Product } from '@/stores/products'
// import { Product, Customer } from '../utils/types'

const props = defineProps<{
  products: Product[]
  customers: Customer[]
  selectedCustomerId: string | null
}>()

const emit = defineEmits<{
  (e: 'add-product'): void
  (e: 'edit-product', product: Product): void
  (e: 'delete-product', productId: string): void
}>()

emit('add-product')

const getCustomerName = (customerId: string): string => {
  const customer = props.customers.find((c) => c.id === customerId)
  return customer ? customer.name : 'Неизвестный заказчик'
}
</script>

<template>
  <v-container class="fill-height d-flex flex-column pa-0">
    <v-row class="d-flex justify-space-between align-center mb-4">
      <v-col cols="auto">
        <h2 class="text-h6 font-weight-medium">
          {{
            selectedCustomerId ? `Продукты: ${getCustomerName(selectedCustomerId)}` : 'Все продукты'
          }}
        </h2>
      </v-col>
      <v-col cols="auto">
        <v-btn color="success" @click="$emit('add-product')" class="d-flex align-center" rounded>
          <v-icon left>mdi-plus</v-icon>
          Добавить продукт
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="overflow-y-auto flex-grow-1 pa-0">
      <v-col
        cols="12"
        v-if="products.length === 0"
        class="d-flex flex-column align-center justify-center grey--text text--darken-1"
      >
        <p>Нет продуктов для отображения</p>
      </v-col>

      <v-col cols="12" v-else>
        <v-row dense>
          <v-col cols="12" v-for="product in products" :key="product.id">
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <div class="text-subtitle-1 font-weight-medium">{{ product.name }}</div>
                <div>
                  <v-btn icon color="primary" @click="$emit('edit-product', product)">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn icon color="error" @click="$emit('delete-product', product.id)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </v-card-title>
              <v-card-text>
                <p class="grey--text text--darken-1 mb-2">{{ product.description }}</p>
                <!-- <p class="font-weight-semibold mb-2">{{ product.price.toLocaleString() }} ₽</p> -->
                <p v-if="!selectedCustomerId" class="grey--text text--darken-2 text-caption mb-2">
                  Заказчик: {{ getCustomerName(product.customerId) }}
                </p>
                <div class="d-flex flex-wrap">
                  <v-chip
                    v-for="(tag, index) in product.tags"
                    :key="index"
                    class="ma-1"
                    small
                    outlined
                    color="grey lighten-3"
                    text-color="grey darken-3"
                  >
                    <v-icon left small>mdi-tag</v-icon>
                    {{ tag }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
