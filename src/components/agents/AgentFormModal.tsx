// مسیر فایل: src/components/agents/AgentFormModal.tsx
// مدال ثبت و ویرایش مشخصات مشاوران و کارشناسان املاک

import React, { useState, useEffect } from 'react';
import { X, Award, Check, AlertCircle } from 'lucide-react';
import { Agent, AgentRole } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import { toEnglishDigits } from '../../utils/jalali';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAgent?: Agent | null;
}

export const AgentFormModal: React.FC<AgentFormModalProps> = ({
  isOpen,
  onClose,
  editAgent,
}) => {
  const { addAgent, updateAgent } = useCrm();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: 'CONSULTANT' as AgentRole,
    commissionRate: '40',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (editAgent) {
      setFormData({
        fullName: editAgent.fullName,
        phone: editAgent.phone,
        email: editAgent.email || '',
        role: editAgent.role,
        commissionRate: editAgent.commissionRate.toString(),
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        role: 'CONSULTANT',
        commissionRate: '40',
      });
    }
    setError('');
  }, [editAgent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('لطفاً نام و نام خانوادگی مشاور را وارد فرمایید.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('شماره تماس مشاور الزامی است.');
      return;
    }

    const commRate = parseFloat(toEnglishDigits(formData.commissionRate)) || 40;

    if (editAgent) {
      updateAgent(editAgent.id, {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        commissionRate: commRate,
      });
    } else {
      addAgent({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        commissionRate: commRate,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0e1226]/95 backdrop-blur-3xl shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
              <Award className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {editAgent ? 'ویرایش مشخصات مشاور' : 'افزودن مشاور جدید به دفتر املاک'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              نام و نام خانوادگی مشاور
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="مثال: مهندس رامین خسروی"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره تماس همراه</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">پست الکترونیکی (اختیاری)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@parsmelk.ir"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">سمت و رده سازمانی</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AgentRole })}
              className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="CONSULTANT" className="bg-[#0e1226] text-white">مشاور ارشد فروش و رهن</option>
              <option value="MANAGER" className="bg-[#0e1226] text-white">مدیر ارشد معاملات</option>
              <option value="JUNIOR" className="bg-[#0e1226] text-white">مشاور مبتدی</option>
              <option value="LEGAL" className="bg-[#0e1226] text-white">کارشناس حقوقی و قراردادها</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              درصد سهم پورسانت مشاور از درآمد کمیسیون (٪)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
              placeholder="40"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
            <span className="block mt-1.5 text-[11px] text-slate-400">
              این درصد به طور خودکار در تنظیم قراردادها برای محاسبه سهم خالص مشاور اعمال می‌گردد.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>{editAgent ? 'ذخیره مشخصات' : 'ثبت مشاور'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
