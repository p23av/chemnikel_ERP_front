<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Product, Customer } from '@/stores/customers'
import { defineProps, defineEmits } from 'vue'

// Props
const props = defineProps<{
  product?: Product
  customers: Customer[]
  selectedCustomerId: string | null
}>()

// Emits
const emit = defineEmits<{
  (e: 'save', product: Omit<Product, 'id'>): void
  (e: 'cancel'): void
}>()

// Reactive fields
const name = ref(props.product?.name || '')
const description = ref(props.product?.description || '')
const price = ref(props.product?.price != null ? props.product.price.toString() : '')
const customerId = ref(props.product?.customerId || props.selectedCustomerId || '')
const tags = ref<string[]>([...(props.product?.tags || [])])
const tagInput = ref('')

// Watch for prop changes (edit mode)
watch(
  () => props.product,
  (newProduct) => {
    name.value = newProduct?.name || ''
    description.value = newProduct?.description || ''
    price.value = newProduct?.price != null ? newProduct.price.toString() : ''
    customerId.value = newProduct?.customerId || props.selectedCustomerId || ''
    tags.value = [...(newProduct?.tags || [])]
  },
)

const isEdit = computed(() => !!props.product)

// Methods
function handleAddTag() {
  const trimmed = tagInput.value.trim()
  if (trimmed && !tags.value.includes(trimmed)) {
    tags.value.push(trimmed)
    tagInput.value = ''
  }
}

function handleRemoveTag(tagToRemove: string) {
  tags.value = tags.value.filter((tag) => tag !== tagToRemove)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleAddTag()
  }
}

function handleSubmit() {
  // Преобразуем price в число
  const priceNumber = parseFloat(price.value)
  if (isNaN(priceNumber) || priceNumber < 0) {
    // Можно добавить валидацию и показать ошибку
    return
  }

  emit('save', {
    name: name.value,
    description: description.value,
    price: priceNumber,
    customerId: customerId.value,
    tags: tags.value,
  })
}
</script>

<template>
  <v-dialog model-value persistent max-width="600">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">{{ isEdit ? 'Редактировать продукт' : 'Добавить продукт' }}</span>
        <v-btn icon variant="text" @click="emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field label="Название продукта" v-model="name" required class="mb-4" />
          <v-textarea label="Описание" v-model="description" rows="3" class="mb-4" />
          <v-text-field
            label="Цена (₽)"
            v-model="price"
            type="number"
            min="0"
            step="0.01"
            required
            class="mb-4"
          />
          <v-select
            label="Заказчик"
            :items="props.customers"
            item-title="name"
            item-value="id"
            v-model="customerId"
            required
            class="mb-4"
            :menu-props="{ maxHeight: '300px' }"
          >
            <template #prepend-item>
              <v-list-item>
                <v-list-item-title>Выберите заказчика</v-list-item-title>
              </v-list-item>
              <v-divider />
            </template>
          </v-select>

          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2">Теги</label>
            <div class="flex flex-wrap mb-2">
              <v-chip
                v-for="(tag, index) in tags"
                :key="index"
                close
                @click:close="handleRemoveTag(tag)"
                class="ma-1"
                color="blue lighten-4"
                text-color="blue darken-4"
                small
              >
                {{ tag }}
              </v-chip>
            </div>
            <div class="d-flex">
              <v-text-field
                v-model="tagInput"
                placeholder="Добавить тег"
                @keydown="handleKeyDown"
                class="flex-grow-1 mr-2"
                dense
                hide-details
                clearable
              />
              <v-btn icon color="primary" @click="handleAddTag" class="mt-2">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
          </div>

          <div class="d-flex justify-end">
            <v-btn variant="outlined" class="mr-2" @click="emit('cancel')">Отмена</v-btn>
            <v-btn color="primary" type="submit">Сохранить</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
