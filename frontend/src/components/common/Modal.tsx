import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ModalProps = {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-elevated"
          >
            <header className="mb-6 flex items-center justify-between">
              <div>
                {title && <h2 className="text-xl font-semibold text-slate-100">{title}</h2>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-slate-100"
              >
                Close
              </button>
            </header>
            <div className="space-y-4 text-slate-200">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
