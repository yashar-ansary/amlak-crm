// مسیر فایل: src/components/common/ConfirmModal.tsx
// مدال استاندارد و زیبای تایید حذف و عملیات حساس (جایگزین window.confirm که در iframe مسدود می‌شود)

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'تایید عملیات',
  message,
  confirmText = 'بله، حذف شود',
  cancelText = 'انصراف',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#0e1224]/95 p-6 shadow-2xl border border-white/15 backdrop-blur-2xl space-y-4 text-slate-100"
        dir="rtl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${
                isDestructive
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.12] hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
              isDestructive
                ? 'bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-600/30 hover:brightness-110'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-600/30 hover:brightness-110'
            }`}
          >
            {isDestructive && <Trash2 className="h-3.5 w-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
