import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, message, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi" size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Memproses...' : 'Ya, Lanjutkan'}
        </button>
      </div>
    </Modal>
  )
}
