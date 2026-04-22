import { create } from 'zustand'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, type?: ToastType, duration?: number) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID()
    set(s => ({ toasts: [...s.toasts, { id, message, type, duration }] }))
    if (duration > 0) setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), duration)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export function toast(message: string, type: ToastType = 'info', duration = 4000) {
  useToastStore.getState().add(message, type, duration)
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const COLORS: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-border bg-card text-foreground',
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = ICONS[t.type]
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md text-sm max-w-sm w-full animate-in slide-in-from-right-4 duration-200 ${COLORS[t.type]}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <p className="flex-1 leading-snug">{t.message}</p>
      <button onClick={onRemove} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />)}
    </div>
  )
}
