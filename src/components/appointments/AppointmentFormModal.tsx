// مسیر فایل: src/components/appointments/AppointmentFormModal.tsx
// فرم هماهنگی و ثبت نوبت بازدید ملک با تاریخ شمسی

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { Property, Client } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import { getCurrentJalaliDate } from '../../utils/jalali';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProperty?: Property | null;
  initialClient?: Client | null;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  initialProperty,
  initialClient,
}) => {
  const { properties, clients, agents, addViewing } = useCrm();

  const [propertyId, setPropertyId] = useState(initialProperty?.id || properties[0]?.id || '');
  const [clientId, setClientId] = useState(initialClient?.id || clients[0]?.id || '');
  const [agentId, setAgentId] = useState(agents[0]?.id || 'agent-1');
  const [scheduledDateJalali, setScheduledDateJalali] = useState(getCurrentJalaliDate());
  const [scheduledTime, setScheduledTime] = useState('17:30');
  const [feedback, setFeedback] = useState('هماهنگی با مالک و سرایدار انجام شد.');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialProperty) {
      setPropertyId(initialProperty.id);
    }
    if (initialClient) {
      setClientId(initialClient.id);
    }
  }, [initialProperty, initialClient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === propertyId);
    const client = clients.find((c) => c.id === clientId);
    const agent = agents.find((a) => a.id === agentId) || agents[0];

    if (!prop || !client) {
      setError('لطفاً هم ملک و هم مشتری را انتخاب کنید.');
      return;
    }

    if (!scheduledDateJalali.trim() || !scheduledTime.trim()) {
      setError('تاریخ و ساعت بازدید الزامی است.');
      return;
    }

    addViewing({
      propertyId: prop.id,
      propertyCode: prop.propertyCode,
      propertyTitle: prop.title,
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      agentId: agent.id,
      agentName: agent.fullName,
      scheduledDateJalali,
      scheduledTime,
      status: 'SCHEDULED',
      feedback,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0e1226]/95 backdrop-blur-3xl shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">هماهنگی و ثبت نوبت بازدید</h2>
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

          {/* انتخاب فایل ملک */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">فایل ملک مورد نظر</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0e1226] text-white">
                  {p.propertyCode} - {p.title} ({p.district})
                </option>
              ))}
            </select>
          </div>

          {/* انتخاب مشتری */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">متقاضی بازدید</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0e1226] text-white">
                  {c.fullName} - {c.phone}
                </option>
              ))}
            </select>
          </div>

          {/* تاریخ شمسی و ساعت */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاریخ شمسی</label>
              <input
                type="text"
                value={scheduledDateJalali}
                onChange={(e) => setScheduledDateJalali(e.target.value)}
                placeholder="۱۴۰۴/۰۷/۱۵"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ساعت بازدید</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="17:30"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          {/* مشاور همراه */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">مشاور همراه در بازدید</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#0e1226] text-white">
                  {a.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* توضیحات و هماهنگی‌ها */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">توضیحات و نکات هماهنگی</label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="نحوه تحویل کلید، هماهنگی با نگهبانی..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
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
              <span>ثبت نوبت بازدید</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
