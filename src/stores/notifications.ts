import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'error' | 'success' | 'info' | 'warning'
export type NotificationCategory = 0 | 1 // 0: top-right, 1: bottom-right

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  errorCode?: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  /**
   * Активные уведомления (показываются на экране)
   */
  const activeNotifications = ref<Notification[]>([])

  /**
   * Архив уведомлений (закрытые, хранятся в памяти сессии)
   */
  const notificationsArchive = ref<Notification[]>([])

  /**
   * Преобразует категорию в CSS-класс для позиционирования
   */
  const getPositionClass = (category: NotificationCategory): string => {
    return category === 0 ? 'top-right' : 'bottom-right'
  }

  /**
   * Добавляет новое уведомление в систему
   * @param notification - данные уведомления без id
   * @returns {string} - уникальный идентификатор созданного уведомления
   */
  const add = (notification: Omit<Notification, 'id'>): string => {
    const id = Date.now().toString()
    const newNotification: Notification = { id, ...notification }

    activeNotifications.value.push(newNotification)

    // Автозакрытие для категории 1 (bottom-right)
    if (notification.category === 1) {
      setTimeout(() => {
        moveToArchive(id)
      }, 3000) // 3 секунды
    }

    return id
  }

  /**
   * Создает информационное уведомление
   * Категория 0 - top-right (без автозакрытия)
   * @param message - текст сообщения для пользователя
   * @returns {string} - идентификатор созданного уведомления
   */
  const info = (message: string): string => {
    return add({
      type: 'info',
      category: 0, // top-right без автозакрытия
      title: 'Информация',
      message,
    })
  }

  /**
   * Создает уведомление об успешной операции
   * Категория 1 - bottom-right (автозакрытие через 3 секунды)
   * @param message - текст сообщения для пользователя
   * @returns {string} - идентификатор созданного уведомления
   */
  const success = (message: string): string => {
    return add({
      type: 'success',
      category: 1, // bottom-right с автозакрытием
      title: 'Успех',
      message,
    })
  }

  /**
   * Перемещает уведомление в архив
   * @param id - идентификатор уведомления для архивации
   */
  const moveToArchive = (id: string): void => {
    const index = activeNotifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      const [notification] = activeNotifications.value.splice(index, 1)
      notificationsArchive.value.push(notification)
    }
  }

  /**
   * Закрывает уведомление (перемещает в архив)
   * @param id - идентификатор уведомления для закрытия
   */
  const close = (id: string): void => {
    moveToArchive(id)
  }

  /**
   * Полностью удаляет уведомление из системы (из архива)
   * @param id - идентификатор уведомления для удаления
   */
  const remove = (id: string): void => {
    // Сначала пытаемся удалить из активных
    let index = activeNotifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      activeNotifications.value.splice(index, 1)
      return
    }

    // Если не нашли в активных, ищем в архиве
    index = notificationsArchive.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notificationsArchive.value.splice(index, 1)
    }
  }

  return {
    /** @type {import('vue').Ref<Notification[]>} Активные уведомления (на экране) */
    activeNotifications,
    /** @type {import('vue').Ref<Notification[]>} Архив закрытых уведомлений */
    notificationsArchive,
    /** @type {function(0|1): string} Преобразует категорию в CSS-класс */
    getPositionClass,
    /** @type {function(Notification): string} Добавляет уведомление */
    add,
    /** @type {function(string): string} Создает уведомление об успехе */
    success,
    /** @type {function(string): void} Закрывает уведомление (в архив) */
    close,
    /** @type {function(string): void} Полностью удаляет уведомление */
    remove,
    /** @type {function(string): string} Создает информационное уведомление */
    info,
  }
})
