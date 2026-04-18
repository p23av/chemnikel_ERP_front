<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Customer } from '@/stores/customers'

const props = defineProps<{
  modelValue: boolean
  customer?: Customer | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: Omit<Customer, 'id'> | Customer): void
}>()

// Локальное состояние формы
const formData = ref<Omit<Customer, 'id'>>({
  name: '',
  tax_id: '',
  contact_person: '',
  email: '',
  phone: '',
  is_active: true,
})

// Следим за изменением пропсов (при редактировании подставляем данные)
watch(
  () => props.customer,
  (newCustomer) => {
    if (newCustomer) {
      formData.value = {
        name: newCustomer.name,
        tax_id: newCustomer.tax_id,
        contact_person: newCustomer.contact_person,
        email: newCustomer.email,
        phone: newCustomer.phone,
        is_active: newCustomer.is_active,
      }
    } else {
      formData.value = {
        name: '',
        tax_id: '',
        contact_person: '',
        email: '',
        phone: '',
        is_active: true,
      }
    }
  },
  { immediate: true },
)

function handleSubmit() {
  emit('save', props.customer ? { ...props.customer, ...formData.value } : formData.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal">
      <h2 class="modal-title">
        {{ customer ? '✏️ Редактировать заказчика' : '➕ Добавить заказчика' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="name">Название</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Введите название компании"
            required
          />
        </div>

        <div class="form-group">
          <label for="tax_id">ИНН</label>
          <input
            id="tax_id"
            v-model="formData.tax_id"
            type="text"
            placeholder="Введите ИНН"
            required
          />
        </div>

        <div class="form-group">
          <label for="contact_person">Контактное лицо</label>
          <input
            id="contact_person"
            v-model="formData.contact_person"
            type="text"
            placeholder="Введите ФИО"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="formData.email" type="email" placeholder="example@mail.com" />
        </div>

        <div class="form-group">
          <label for="phone">Телефон</label>
          <input id="phone" v-model="formData.phone" type="tel" placeholder="+7 (___) ___-__-__" />
        </div>

        <div class="form-checkbox">
          <input id="is_active" type="checkbox" v-model="formData.is_active" />
          <label for="is_active">Активен</label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn save-btn">💾 Сохранить</button>
          <button type="button" class="btn cancel-btn" @click="emit('update:modelValue', false)">
            ❌ Отмена
          </button>
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
  background: rgba(30, 41, 59, 0.65); /* темный фон с синим оттенком */
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
  width: 420px;
  max-width: 90%;
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

.form-group input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  outline: none;
}

/* --- Checkbox --- */
.form-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-checkbox label {
  cursor: pointer;
  font-size: 0.95rem;
  color: #334155;
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
