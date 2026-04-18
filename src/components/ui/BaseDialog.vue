<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'

const { isVisible, config, confirmDialog, cancelDialog, closeDialog } = useDialog()
</script>

<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="isVisible" class="dialog-overlay" @click="closeDialog">
        <div class="dialog" :class="`dialog--${config.variant}`" @click.stop>
          <div class="dialog-header">
            <h3 class="dialog-title">{{ config.title }}</h3>

            <button
              v-if="config.type === 'alert'"
              class="dialog-close"
              aria-label="Закрыть"
              @click="closeDialog"
            >
              ×
            </button>
          </div>

          <div class="dialog-body">
            <p class="dialog-message">{{ config.message }}</p>
          </div>

          <div class="dialog-footer">
            <template v-if="config.type === 'confirm'">
              <button class="dialog-button dialog-button--cancel" @click="cancelDialog">
                {{ config.cancelText }}
              </button>

              <button
                class="dialog-button dialog-button--confirm"
                :class="`dialog-button--${config.variant}`"
                @click="confirmDialog"
              >
                {{ config.confirmText }}
              </button>
            </template>

            <button
              v-else
              class="dialog-button dialog-button--confirm"
              :class="`dialog-button--${config.variant}`"
              @click="confirmDialog"
            >
              {{ config.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
/* ===== Overlay ===== */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ===== Dialog ===== */
.dialog {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-width: 320px;
  max-width: 520px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* ===== Header ===== */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-close {
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

/* ===== Body ===== */
.dialog-body {
  margin-bottom: 24px;
}

.dialog-message {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

/* ===== Footer ===== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ===== Buttons ===== */
.dialog-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* Cancel */
.dialog-button--cancel {
  background-color: #f5f5f5;
  color: #333;
}

.dialog-button--cancel:hover {
  background-color: #e0e0e0;
}

/* Confirm default */
.dialog-button--confirm {
  background-color: #2196f3;
  color: #fff;
}

.dialog-button--confirm:hover {
  background-color: #1976d2;
}

/* ===== Variants ===== */
.dialog-button--danger {
  background-color: #f44336;
}

.dialog-button--danger:hover {
  background-color: #d32f2f;
}

.dialog-button--warning {
  background-color: #ff9800;
}

.dialog-button--warning:hover {
  background-color: #f57c00;
}

.dialog-button--info {
  background-color: #2196f3;
}

.dialog-button--info:hover {
  background-color: #1976d2;
}

/* ===== Dialog variants ===== */
.dialog--danger {
  border-top: 4px solid #f44336;
}

.dialog--warning {
  border-top: 4px solid #ff9800;
}

.dialog--info {
  border-top: 4px solid #2196f3;
}

/* ===== Animation ===== */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .dialog,
.dialog-fade-leave-active .dialog {
  transition: transform 0.25s ease;
}

.dialog-fade-enter-from .dialog,
.dialog-fade-leave-to .dialog {
  transform: scale(0.95);
}
</style>
