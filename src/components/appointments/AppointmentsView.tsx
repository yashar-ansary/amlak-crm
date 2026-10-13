// مسیر فایل: src/components/appointments/AppointmentsView.tsx
// نمای جدول و کارتابل بازدیدهای املاک با تاریخ شمسی

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Building,
  User,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ViewingStatus, Property, Client } from '../../types/crm';
import {
  toPersianDigits,
  VIEWING_STATUS_NAMES,
  formatJalaliReadable,
  getCurrentJalaliDate,
} from '../../utils/jalali';
import { AppointmentFormModal } from './AppointmentFormModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const AppointmentsView: React.FC = () => {
  const { viewings, updateViewingStatus, deleteViewing } = useCrm();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingToDelete, setViewingToDelete] = useState<string | null>(null);

  const currentJalali = getCurrentJalaliDate();

  const filteredViewings = useMemo(() => {
    if (statusFilter === 'ALL') return viewings;
    return viewings.filter((v) => v.status === statusFilter);
  }, [viewings, statusFilter]);

  return (
    <div className="space-y-6">
      {/* هدر بخش و دکمه ثبت */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">کارتابل هماهنگی و زمان‌بندی بازدیدها</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            امروز: {formatJalaliReadable(currentJalali)}
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>هماهنگی بازدید جدید</span>
        </button>
      </div>

      {/* فیلتر وضعیت بازدید */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === 'ALL'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
              : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          همه قرارها ({toPersianDigits(viewings.length)})
        </button>
        {Object.entries(VIEWING_STATUS_NAMES).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === key
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30 border border-violet-400/40'
                : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* لیست بازدیدها */}
      {filteredViewings.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
          <CalendarCheck className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white">هیچ بازدیدی در این وضعیت یافت نشد</h3>
          <p className="mt-1 text-xs text-slate-400">
            می‌توانید با زدن دکمه «هماهنگی بازدید جدید» قرار ملاقات ثبت کنید.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredViewings.map((viewing) => {
            const statusMeta = VIEWING_STATUS_NAMES[viewing.status] || {
              label: viewing.status,
              color: 'text-slate-300 bg-white/10 border-white/15',
            };

            return (
              <div
                key={viewing.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-violet-500/40 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="num-fa font-bold text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-lg">
                      {viewing.propertyCode}
                    </span>
                    <h3 className="text-xs font-bold text-white">{viewing.propertyTitle}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{viewing.clientName}</span>
                    </span>

                    <a href={`tel:${viewing.clientPhone}`} className="flex items-center gap-1 num-fa text-violet-300 hover:underline">
                      <Phone className="h-3 w-3" />
                      <span>{viewing.clientPhone}</span>
                    </a>

                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="num-fa">{viewing.scheduledDateJalali}</span>
                      <span>ساعت</span>
                      <span className="num-fa font-bold text-slate-200">{toPersianDigits(viewing.scheduledTime)}</span>
                    </span>

                    <span>مشاور: {viewing.agentName}</span>
                  </div>

                  {viewing.feedback && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 bg-white/[0.03] p-2 rounded-xl border border-white/10 mt-1">
                      <MessageSquare className="h-3 w-3 text-violet-400 shrink-0" />
                      <span>{viewing.feedback}</span>
                    </div>
                  )}
                </div>

                {/* اقدامات تغییر وضعیت */}
                <div className="flex items-center gap-2 shrink-0 border-t border-white/10 sm:border-0 pt-2 sm:pt-0">
                  {viewing.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => updateViewingStatus(viewing.id, 'COMPLETED', 'بازدید با متقاضی با موفقیت انجام شد')}
                        className="flex items-center gap-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>تکمیل شد</span>
                      </button>
                      <button
                        onClick={() => updateViewingStatus(viewing.id, 'CANCELLED', 'متقاضی کنسل کرد')}
                        className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>لغو</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setViewingToDelete(viewing.id)}
                    title="حذف رکورد"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال ثبت نوبت بازدید */}
      <AppointmentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {/* مدال تایید حذف نوبت بازدید */}
      <ConfirmModal
        isOpen={!!viewingToDelete}
        title="حذف نوبت بازدید"
        message="آیا از حذف این رکورد نوبت بازدید از کارتابل سامانه اطمینان دارید؟"
        confirmText="بله، حذف نوبت"
        cancelText="انصراف"
        onConfirm={() => {
          if (viewingToDelete) {
            deleteViewing(viewingToDelete);
            setViewingToDelete(null);
          }
        }}
        onCancel={() => setViewingToDelete(null)}
      />
    </div>
  );
};
