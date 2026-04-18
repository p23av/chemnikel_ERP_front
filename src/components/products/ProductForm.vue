<script setup lang="ts">
import { ref, watch } from 'vue'

import { useLinesStore } from '@/stores/lines'
const linesStore = useLinesStore()

interface Product {
  id: number
  name: string
  material: string
  surface_area: number
  coating_data: { [key: string]: string } // Формат: { "0": "6", "1": "3" }
  customer: number
  is_active?: boolean
}

const props = defineProps<{
  modelValue: boolean
  product?: Product | null
  customers: { id: number; name: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: Omit<Product, 'id'> | Product): void
}>()

const formData = ref<Omit<Product, 'id'>>({
  name: '',
  material: '',
  surface_area: 0,
  coating_data: {},
  customer: 0,
})

// Преобразуем coating_data в массив для удобства работы в форме
const coatingLayers = ref<Array<{ materialId: string; thickness: string }>>([])

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      formData.value = {
        name: newProduct.name,
        material: newProduct.material,
        surface_area: newProduct.surface_area,
        coating_data: { ...newProduct.coating_data },
        customer: newProduct.customer,
      }

      // Преобразуем coating_data в массив для формы
      coatingLayers.value = Object.entries(newProduct.coating_data || {}).map(
        ([materialId, thickness]) => ({
          materialId,
          thickness: thickness.toString(),
        }),
      )
    } else {
      formData.value = {
        name: '',
        material: '',
        surface_area: 0,
        coating_data: {},
        customer: 0,
      }
      coatingLayers.value = []
    }
  },
  { immediate: true },
)
watch(
  () => props.modelValue,
  async (val) => {
    if (val && linesStore.lines.length === 0) {
      await linesStore.init()
    }
  },
)

function addCoating() {
  coatingLayers.value.push({ materialId: '', thickness: '' })
}

function removeCoating(index: number) {
  coatingLayers.value.splice(index, 1)
}

function handleSubmit() {
  // Преобразуем массив слоев в coating_data объект
  const coatingData: { [key: string]: string } = {}
  coatingLayers.value.forEach((layer) => {
    if (layer.materialId && layer.thickness) {
      // Явно создаем ключ как строку
      const key = String(layer.materialId)
      coatingData[key] = layer.thickness
    }
  })

  // Принудительно сериализуем и парсим чтобы ключи остались строками
  const serializedData = JSON.stringify({
    ...formData.value,
    coating_data: coatingData,
  })

  const submitData = JSON.parse(serializedData)

  console.log('📤 Отправляем данные:', submitData)
  console.log(
    '🔍 coating_data keys types:',
    Object.keys(submitData.coating_data).map((k) => ({ key: k, type: typeof k })),
  )

  emit('save', props.product?.id ? { id: props.product.id, ...submitData } : submitData)
  emit('update:modelValue', false)
}

function closeModal() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal" @click.stop>
      <h2 class="modal-title">
        {{ product ? '✏️ Редактировать деталь' : '➕ Добавить деталь' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-group">
          <label for="name">Название</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Введите название детали"
            required
          />
        </div>

        <div class="form-group">
          <label for="material">Материал изделия</label>
          <input
            id="material"
            v-model="formData.material"
            type="text"
            placeholder="Введите материал"
            required
          />
        </div>

        <div class="form-group">
          <label for="surface_area">Площадь поверхности (дм²)</label>
          <input
            id="surface_area"
            v-model.number="formData.surface_area"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.0"
            required
          />
        </div>

        <div class="form-group">
          <label>Покрытие</label>
          <div class="coating-section">
            <div v-for="(layer, index) in coatingLayers" :key="index" class="coating-row">
              <select v-model="layer.materialId" required>
                <option disabled value="">Выберите покрытие</option>
                <option v-for="line in linesStore.activeLines" :key="line.id" :value="line.code">
                  {{ line.name }} ({{ line.code }})
                </option>
              </select>
              <input v-model="layer.thickness" type="text" placeholder="Толщина" required />
              <button
                type="button"
                class="remove-btn"
                @click="removeCoating(index)"
                title="Удалить слой"
              >
                ❌
              </button>
            </div>
            <button type="button" class="add-btn" @click="addCoating">
              ➕ Добавить слой покрытия
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="customer">Заказчик</label>
          <select id="customer" v-model="formData.customer" required>
            <option disabled value="0">Выберите заказчика</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
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

/* --- Coating section --- */
.coating-section {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  background: #f8fafc;
}

.coating-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.coating-row select {
  flex: 2;
}

.coating-row input {
  flex: 1;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
}

.remove-btn:hover {
  background: #fee2e2;
}

.add-btn {
  background: #dbeafe;
  color: #1e40af;
  border: 1px dashed #3b82f6;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
}

.add-btn:hover {
  background: #c7d2fe;
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
