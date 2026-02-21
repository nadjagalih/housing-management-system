export default function EmptyState({ message = 'Data tidak ditemukan.' }) {
  return (
    <div className="flex items-center justify-center py-16 text-gray-800">
      <p className="text-sm">{message}</p>
    </div>
  )
}
