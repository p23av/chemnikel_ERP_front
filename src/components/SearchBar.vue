<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  searchTerm: string
}>()

const emit = defineEmits<{
  (e: 'update:searchTerm', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:searchTerm', target.value)
}
</script>

<template>
  <div class="relative">
    <v-text-field
      v-model="props.searchTerm"
      placeholder="Поиск по имени, продукту или тегам..."
      dense
      clearable
      hide-details
      prepend-inner-icon="mdi-magnify"
      @input="onInput"
      class="w-full"
    />
  </div>
</template>
