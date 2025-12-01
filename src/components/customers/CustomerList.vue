<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { Customer } from '@/stores/customers'

const props = defineProps<{
  customers: Customer[]
  selectedCustomerId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', customerId: string | null): void
  (e: 'add'): void
  (e: 'delete', customerId: string): void
  (e: 'edit', customer: Customer): void
}>()

function handleClick(customer: Customer) {
  emit('select', customer.id.toString())
}

function handleAllClick() {
  emit('select', null)
}
</script>

<template>
  <v-card class="pa-4 h-100 d-flex flex-column">
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-h6">Заказчики</h2>
      <v-btn color="primary" @click="emit('add')" prepend-icon="mdi-plus"> Добавить </v-btn>
    </div>

    <div class="mb-2">
      <v-btn
        class="mr-2"
        :color="selectedCustomerId === null ? 'primary' : undefined"
        variant="outlined"
        @click="handleAllClick"
      >
        Все
      </v-btn>
    </div>

    <v-divider class="mb-2" />

    <v-list density="comfortable" class="overflow-y-auto">
      <v-list-item
        v-for="customer in customers"
        :key="customer.id"
        :value="customer.id"
        :active="selectedCustomerId === customer.id.toString()"
        @click="handleClick(customer)"
        class="rounded-lg"
      >
        <template #prepend>
          <v-avatar size="36" color="grey-lighten-2">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
        </template>

        <v-list-item-title>{{ customer.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ customer.email }}</v-list-item-subtitle>

        <template #append>
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click.stop="emit('edit', customer)"
          />
          <v-btn
            icon="mdi-delete"
            color="red"
            size="small"
            variant="text"
            @click.stop="emit('delete', customer.id.toString())"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
