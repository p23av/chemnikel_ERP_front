<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { defineProps, defineEmits } from 'vue'
import type { Customer } from '@/stores/customers'

const props = defineProps<{
  customer?: Customer
}>()

const emit = defineEmits<{
  (e: 'save', data: Omit<Customer, 'id'>): void
  (e: 'cancel'): void
}>()

const name = ref(props.customer?.name || '')
const email = ref(props.customer?.email || '')
const phone = ref(props.customer?.phone || '')

watch(
  () => props.customer,
  (newCustomer) => {
    name.value = newCustomer?.name || ''
    email.value = newCustomer?.email || ''
    phone.value = newCustomer?.phone || ''
  },
)

const isEdit = computed(() => !!props.customer)

function handleSubmit() {
  emit('save', {
    name: name.value,
    email: email.value,
    phone: phone.value,
  })
}
</script>

<template>
  <v-dialog model-value persistent max-width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">
          {{ isEdit ? 'Редактировать заказчика' : 'Добавить заказчика' }}
        </span>
        <v-btn icon @click="emit('cancel')" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field label="Название компании" v-model="name" required class="mb-4" />
          <v-text-field label="Email" v-model="email" type="email" required class="mb-4" />
          <v-text-field label="Телефон" v-model="phone" class="mb-4" />
          <div class="d-flex justify-end">
            <v-btn variant="outlined" class="mr-2" @click="emit('cancel')"> Отмена </v-btn>
            <v-btn color="primary" type="submit"> Сохранить </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
