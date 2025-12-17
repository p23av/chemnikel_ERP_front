<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { Order } from '@/stores/orders'
import type { Product } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'

const customersStore = useCustomersStore()

const props = defineProps<{
  modelValue: boolean
  order: Order | null
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: Omit<Order, 'id'> & { id?: number }): void
}>()

const dialog = ref(props.modelValue)
watch(
  () => props.modelValue,
  (val) => (dialog.value = val),
)
watch(dialog, (val) => emit('update:modelValue', val))

// ИСПРАВЛЕНО: product должен быть number, не null
const form = ref<Omit<Order, 'id'> & { id?: number }>({
  product: props.order?.product || 0,
  quantity: props.order?.quantity || 1,
  status: props.order?.status || 0,
  created_at: props.order?.created_at || new Date().toISOString(),
  updated_at: props.order?.updated_at || new Date().toISOString(),
})

// Добавь состояние для выбранного заказчика
const selectedCustomerId = ref<number | null>(null)

// Отфильтрованные продукты по выбранному заказчику
const filteredProducts = computed(() => {
  if (!selectedCustomerId.value) return []
  return props.products.filter((product) => product.customer === selectedCustomerId.value)
})

watch(
  () => props.order,
  (val) => {
    if (val) {
      form.value = { ...val }
      // Найти заказчика для текущего продукта
      const currentProduct = props.products.find((p) => p.id === val.product)
      selectedCustomerId.value = currentProduct?.customer || null
    } else {
      form.value = {
        product: 0,
        quantity: 1,
        status: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      selectedCustomerId.value = null
    }
  },
  { immediate: true },
)

function save() {
  // ИСПРАВЛЕНО: проверяем что product не 0
  if (form.value.product === 0 || form.value.quantity === null || form.value.quantity < 1) {
    alert('Заполните все обязательные поля')
    return
  }

  emit('save', form.value)
  dialog.value = false
}

function closeModal() {
  dialog.value = false
}
</script>

<template>
  <div v-if="dialog" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <h2 class="modal-title">
        {{ props.order ? '✏️ Редактировать заказ' : '➕ Новый заказ' }}
      </h2>

      <form @submit.prevent="save" class="form">
        <!-- 1. Выбор заказчика -->
        <div class="form-group">
          <label for="customer">Заказчик</label>
          <select id="customer" v-model="selectedCustomerId" required @change="form.product = 0">
            <option disabled value="null">Выберите заказчика</option>
            <option
              v-for="customer in customersStore.customers"
              :key="customer.id"
              :value="customer.id"
            >
              {{ customer.name }}
            </option>
          </select>
        </div>

        <!-- 2. Выбор детали (только если выбран заказчик) -->
        <div class="form-group" v-if="selectedCustomerId">
          <label for="product">Деталь</label>
          <select id="product" v-model="form.product" :disabled="!selectedCustomerId" required>
            <option disabled value="null">Выберите деталь</option>
            <option v-for="product in filteredProducts" :key="product.id" :value="product.id">
              {{ product.name }}
            </option>
          </select>
        </div>

        <!-- 3. Количество -->
        <div class="form-group">
          <label for="quantity">Количество</label>
          <input
            id="quantity"
            v-model.number="form.quantity"
            type="number"
            min="1"
            placeholder="Введите количество"
            required
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn save-btn">💾 Сохранить</button>
          <button type="button" class="btn cancel-btn" @click="closeModal">❌ Отмена</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* --- Overlay --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 41, 59, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* --- Modal --- */
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 10px;
  width: 480px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.25s ease;
}

.modal-title {
  margin-bottom: 1.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  text-align: center;
}

/* --- Form --- */
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* --- Form groups --- */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: #334155;
}

.form-group input,
.form-group select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  outline: none;
}

/* --- Buttons --- */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.1s ease;
}

.btn:active {
  transform: scale(0.97);
}

.save-btn {
  background: #3b82f6;
  color: #fff;
}

.save-btn:hover {
  background: #2563eb;
}

.cancel-btn {
  background: #e2e8f0;
  color: #1e293b;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

/* --- Animations --- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
