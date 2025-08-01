<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useCustomersStore } from '@/stores/customers'
import { useProductsStore } from '@/stores/products'

import type { Customer } from '@/stores/customers'
import type { Product } from '@/stores/products'

import CustomerList from '@/components/customers/CustomerList.vue'
import CustomerForm from '@/components/customers/CustomerForm.vue'
import ProductList from '@/components/products/ProductList.vue'
import ProductForm from '@/components/products/ProductForm.vue'
import SearchBar from '@/components/SearchBar.vue'
// import { useRouter } from 'vue-router'

// const router = useRouter()
const customersStore = useCustomersStore()
const productsStore = useProductsStore()

const selectedCustomerId = ref<number | null>(null)

const showCustomerForm = ref(false)
const editingCustomer = ref<Customer | null>(null)

const showProductForm = ref(false)
const editingProduct = ref<Product | null>(null)

const searchTerm = ref('')

const customers = computed(() => customersStore.customers)
const products = computed(() => productsStore.products)

const filteredCustomers = computed(() => {
  const term = searchTerm.value.toLowerCase()
  return customers.value.filter(
    (customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term),
  )
})

const filteredProducts = computed(() => {
  const term = searchTerm.value.toLowerCase()
  return products.value.filter((product) => {
    const matchesCustomer =
      !selectedCustomerId.value || product.customer === selectedCustomerId.value
    const matchesSearch =
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
      customers.value
        .find((c) => c.id === product.customer)
        ?.name.toLowerCase()
        .includes(term)
    return matchesCustomer && matchesSearch
  })
})

onMounted(async () => {
  await customersStore.fetchCustomers()
  await productsStore.fetchProducts()
})

function handleSelectCustomer(customerId: number | null) {
  selectedCustomerId.value = customerId
}

function handleAddCustomer() {
  editingCustomer.value = null
  showCustomerForm.value = true
}

function handleEditCustomer(customer: any) {
  editingCustomer.value = customer
  showCustomerForm.value = true
}

function handleDeleteCustomer(customerId: number) {
  if (
    confirm('Вы уверены, что хотите удалить этого заказчика? Все его продукты также будут удалены.')
  ) {
    customersStore.deleteCustomer(customerId)
    productsStore.deleteProduct(customerId)
    if (selectedCustomerId.value === customerId) {
      selectedCustomerId.value = null
    }
  }
}

function handleSaveCustomer(customer: any) {
  // if (customer.id) {
  //   customersStore.updateCustomer(customer)
  // } else {
  //   customersStore.addCustomer(customer)
  // }
  // showCustomerForm.value = false
}

function handleAddProduct() {
  editingProduct.value = null
  showProductForm.value = true
}

function handleEditProduct(product: any) {
  editingProduct.value = product
  showProductForm.value = true
}

function handleDeleteProduct(productId: number) {
  if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
    productsStore.deleteProduct(productId)
  }
}

function handleSaveProduct(product: any) {
  if (product.id) {
    productsStore.updateProduct(product)
  } else {
    productsStore.addProduct(product)
  }
  showProductForm.value = false
}
</script>

<template>
  <div class="customers-view">
    <div class="search-bar-container">
      <SearchBar :search-term="searchTerm" @update:search-term="searchTerm = $event" />
    </div>

    <div class="main-content">
      <div class="customer-list">
        <CustomerList
          :customers="filteredCustomers"
          :selected-customer-id="selectedCustomerId"
          @select-customer="handleSelectCustomer"
          @edit-customer="handleEditCustomer"
          @delete-customer="handleDeleteCustomer"
          @add-customer="handleAddCustomer"
        />
      </div>

      <div class="product-list">
        <ProductList
          :products="filteredProducts"
          :customers="customers"
          :selected-customer-id="selectedCustomerId"
          @add-product="handleAddProduct"
          @edit-product="handleEditProduct"
          @delete-product="handleDeleteProduct"
        />
      </div>
    </div>

    <ProductForm
      v-if="showProductForm"
      :product="editingProduct"
      :customers="customers"
      :selected-customer-id="selectedCustomerId"
      @cancel="showProductForm = false"
      @save="handleSaveProduct"
    />

    <CustomerForm
      v-if="showCustomerForm"
      :customer="editingCustomer"
      @cancel="showCustomerForm = false"
      @save="handleSaveCustomer"
    />
  </div>
</template>

<style scoped>
.customers-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
}

.search-bar-container {
  /* max-width: 600px; */
  width: 100%;
}

.main-content {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  /* background-color: white; */
}

.customer-list,
.product-list {
  flex: 1;
  min-width: 300px;
}
</style>
