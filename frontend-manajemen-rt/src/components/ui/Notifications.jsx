import useNotificationStore from '../../store/notificationStore'

const typeStyles = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info:    'bg-blue-600 text-white',
}

const typeIcons = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed top-4 right-4 z-100 space-y-2 w-80">
      {notifications.map(({ id, message, type }) => (
        <div
          key={id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm ${
            typeStyles[type] ?? typeStyles.info
          }`}
        >
          <span className="mt-0.5 shrink-0">{typeIcons[type] ?? typeIcons.info}</span>
          <span className="flex-1">{message}</span>
          <button
            onClick={() => removeNotification(id)}
            className="ml-2 opacity-70 hover:opacity-100 shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
