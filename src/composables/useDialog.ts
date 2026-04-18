// composables/useDialog.ts
import { ref, computed } from 'vue'

export type DialogType = 'confirm' | 'alert'
export type DialogVariant = 'default' | 'danger' | 'warning' | 'info'

interface DialogConfig {
  type: DialogType
  title: string
  message: string
  variant: DialogVariant
  confirmText: string
  cancelText: string
}

// Дефолтные настройки
const defaultConfigs: Record<DialogType, Partial<DialogConfig>> = {
  confirm: {
    type: 'confirm',
    variant: 'default',
    confirmText: 'Да',
    cancelText: 'Нет',
  },
  alert: {
    type: 'alert',
    variant: 'info',
    confirmText: 'OK',
    cancelText: '',
  },
}

/* =========================
   🔥 SINGLETON STATE
========================= */

const isVisible = ref(false)

const config = ref<DialogConfig>({
  type: 'confirm',
  title: '',
  message: '',
  variant: 'default',
  confirmText: 'Да',
  cancelText: 'Нет',
})

let resolveCallback: ((value?: boolean) => void) | null = null

/* =========================
   COMPUTED
========================= */

const dialogType = computed(() => config.value.type)
const dialogVariant = computed(() => config.value.variant)
const isAlert = computed(() => config.value.type === 'alert')

/* =========================
   HELPERS
========================= */

const resetConfig = () => {
  config.value = {
    type: 'confirm',
    title: '',
    message: '',
    variant: 'default',
    confirmText: 'Да',
    cancelText: 'Нет',
  }
}

/* =========================
   CORE API
========================= */

const show = (
  options: Partial<DialogConfig> & { title: string; message: string },
): Promise<boolean | void> => {
  return new Promise((resolve) => {
    const type = options.type ?? 'confirm'
    const defaults = defaultConfigs[type]

    config.value = {
      type,
      title: options.title,
      message: options.message,
      variant: options.variant ?? defaults.variant ?? 'default',
      confirmText: options.confirmText ?? defaults.confirmText ?? 'OK',
      cancelText: options.cancelText ?? defaults.cancelText ?? '',
    }

    resolveCallback = resolve
    isVisible.value = true
  })
}

const confirm = (message: string, title = 'Подтверждение'): Promise<boolean> => {
  return show({
    type: 'confirm',
    title,
    message,
  }) as Promise<boolean>
}

const confirmDanger = (message: string, title = 'Подтверждение'): Promise<boolean> => {
  return show({
    type: 'confirm',
    title,
    message,
    variant: 'danger',
    confirmText: 'Удалить',
  }) as Promise<boolean>
}

const alert = (message: string, title = 'Информация'): Promise<void> => {
  return show({
    type: 'alert',
    title,
    message,
  }) as Promise<void>
}

/* =========================
   CLOSE / RESOLVE
========================= */

const completeDialog = (result?: boolean) => {
  isVisible.value = false

  if (resolveCallback) {
    resolveCallback(result)
    resolveCallback = null
  }

  resetConfig()
}

const confirmDialog = () => {
  completeDialog(isAlert.value ? undefined : true)
}

const cancelDialog = () => {
  completeDialog(false)
}

const closeDialog = () => {
  completeDialog(isAlert.value ? undefined : false)
}

/* =========================
   EXPORT
========================= */

export function useDialog() {
  return {
    // state
    isVisible,
    config,
    dialogType,
    dialogVariant,
    isAlert,

    // api
    show,
    confirm,
    confirmDanger,
    alert,

    // controls
    confirmDialog,
    cancelDialog,
    closeDialog,
  }
}
