// مسیر فایل: src/components/clients/ClientDetailModal.tsx
// مدال جزئیات پرونده مشتری، لاگ پیگیری‌ها و املاک پیشنهادی سیستم

import React, { useState } from 'react';
import {
  X,
  Phone,
  Calendar,
  Sparkles,
  Plus,
  Send,
  MessageSquare,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
} from 'lucide-react';
import { Client, Property, LeadStatus } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  formatPriceCompact,
  formatToman,
  toPersianDigits,
  CLIENT_TYPE_NAMES,
  LEAD_STATUS_NAMES,
  TRANSACTION_TYPE_NAMES,
} from '../../utils/jalali';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleViewing: (property: Property, client: Client) => void;
  onSelectProperty: (propertyId: string) => void;
  onEditClient?: (client: Client) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  isOpen,
  onClose,
  onOpenScheduleViewing,
  onSelectProperty,
  onEditClient,
}) => {
  const { findMatchesForClient, activityLogs, addActivityLog, updateClient } = useCrm();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'call' | 'meeting' | 'note'>('call');

  if (!isOpen || !client) return null;

  const matchedProperties = findMatchesForClient(client);
  const clientLogs = activityLogs.filter((log) => log.clientId === client.id);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    addActivityLog({
      clientId: client.id,
      clientName: client.fullName,
      agentName: client.agentName || 'مشاور پرونده',
      actionType: noteType,
      description: newNote.trim(),
    });

    setNewNote('');
  };

  const handleUpdateStatus = (newStatus: LeadStatus) => {
    updateClient(client.id, { leadStatus: newStatus });
  };

  const statusMeta = LEAD_STATUS_NAMES[client.leadStatus] || {
    label: client.leadStatus,
    color: 'text-slate-700 bg-slate-100',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-[#0f1325]/95 shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col text-slate-100">
        {/* هدر مدال با تم گلس‌مورفیسم */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/[0.03] gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-600/30">
              {client.fullName.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">{client.fullName}</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
                <span className="hidden sm:inline text-slate-500">·</span>
                <span className="text-[11px] sm:text-xs text-violet-300 font-medium shrink-0">{CLIENT_TYPE_NAMES[client.clientType]}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 mt-1">
                <a href={`tel:${client.phone}`} className="flex items-center gap-1 num-fa text-violet-300 font-medium hover:underline shrink-0">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </a>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="truncate">مشاور: {client.agentName || 'مشاور دفتر'}</span>
                <span className="hidden md:inline text-slate-600">·</span>
                <span className="hidden md:inline">ثبت: {client.createdAtJalali}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onEditClient && (
              <button
                type="button"
                onClick={() => onEditClient(client)}
                className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-600/20 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-600/30 hover:border-violet-500/50 transition-colors shadow-xs"
              >
                <Edit className="h-3.5 w-3.5 text-violet-300" />
                <span className="hidden sm:inline">ویرایش اطلاعات پرونده</span>
                <span className="sm:hidden text-[11px]">ویرایش پرونده</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* بدنه مدال در دو ستون */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ستون راست (۷ ستون): ترجیحات بودجه و املاک تطبیق‌یافته */}
          <div className="space-y-6 lg:col-span-7">
            {/* کارت بودجه و مشخصات مدنظر */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 space-y-3 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span>نیازها و بودجه درخواستی متقاضی</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">محدوده بودجه:</span>
                  <div className="font-bold text-violet-300 num-fa mt-0.5">
                    {formatPriceCompact(client.budgetMin)} تا {formatPriceCompact(client.budgetMax)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">حداقل متراژ و خواب:</span>
                  <div className="font-bold text-slate-200 num-fa mt-0.5">
                    {client.preferredMinArea ? `${toPersianDigits(client.preferredMinArea)} متر` : 'توافقی'} ·{' '}
                    {client.preferredRooms ? `${toPersianDigits(client.preferredRooms)} خواب` : ''}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">مناطق مورد علاقه:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {client.preferredDistricts.join('، ') || 'همه مناطق'}
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="pt-2.5 border-t border-white/10 text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">یادداشت مذاکره: </span>
                  {client.notes}
                </div>
              )}
            </div>

            {/* املاک منطبق و پیشنهادی برای این مشتری */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">
                    املاک منطبق با خواسته متقاضی ({toPersianDigits(matchedProperties.length)} فایل)
                  </h3>
                </div>
              </div>

              {matchedProperties.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-xs text-slate-400">
                  در حال حاضر فایل ملکی کاملاً منطبق با بودجه و منطقه این مشتری در دیتابیس ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedProperties.map(({ property, score, matchReasons }) => (
                    <div
                      key={property.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm hover:border-violet-500/40 hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="num-fa font-bold text-xs text-violet-200 bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 rounded">
                              {property.propertyCode}
                            </span>
                            <h4 className="text-xs font-bold text-white hover:text-violet-300 cursor-pointer">
                              {property.title}
                            </h4>
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{property.district}</span>
                            <span>·</span>
                            <span className="num-fa">{toPersianDigits(property.area)} متر</span>
                            <span>·</span>
                            <span className="num-fa">{toPersianDigits(property.rooms)} خواب</span>
                            <span>·</span>
                            <span className="num-fa font-bold text-violet-300">
                              {property.transactionType === 'SALE'
                                ? formatPriceCompact(property.priceTotal)
                                : `رهن ${formatPriceCompact(property.deposit)}`}
                            </span>
                          </div>

                          {/* دلایل تطبیق */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {matchReasons.map((reason, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="num-fa font-bold text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                            {toPersianDigits(score)}٪ تطبیق
                          </span>

                          <button
                            onClick={() => {
                              onClose();
                              onOpenScheduleViewing(property, client);
                            }}
                            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:from-emerald-500 hover:to-teal-500 transition-colors shadow-xs"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>تنظیم بازدید</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ستون چپ (۵ ستون): پایپ‌لاین وضعیت و تاریخچه تماس‌ها */}
          <div className="space-y-6 lg:col-span-5">
            {/* تغییر وضعیت پایپ‌لاین */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-white mb-2">تغییر وضعیت مرحله مشتری</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(LEAD_STATUS_NAMES) as LeadStatus[]).map((statusKey) => (
                  <button
                    key={statusKey}
                    onClick={() => handleUpdateStatus(statusKey)}
                    className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      client.leadStatus === statusKey
                        ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30 border border-violet-400/40'
                        : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {LEAD_STATUS_NAMES[statusKey]?.label || statusKey}
                  </button>
                ))}
              </div>
            </div>

            {/* فرم ثبت گزارش تماس یا یادداشت جدید */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-white">ثبت گزارش پیگیری و تماس</h3>
              <form onSubmit={handleAddNote} className="space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="rounded-xl border border-white/10 bg-[#161a2e] px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="call" className="bg-[#161a2e] text-white">تماس تلفنی</option>
                    <option value="meeting" className="bg-[#161a2e] text-white">جلسه حضوری</option>
                    <option value="note" className="bg-[#161a2e] text-white">یادداشت مذاکره</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="نتیجه مکالمه، زمان پیگیری بعدی..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition-colors shadow-md shadow-violet-600/25"
                >
                  <Send className="h-3 w-3" />
                  <span>ثبت در پرونده</span>
                </button>
              </form>
            </div>

            {/* لیست یادداشت‌های قبلی */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white">تاریخچه فعالیت‌ها</h3>
              {clientLogs.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4 bg-white/[0.02] border border-white/10 rounded-xl">
                  هنوز یادداشتی برای این پرونده ثبت نشده است.
                </div>
              ) : (
                clientLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs space-y-1 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-violet-300">{log.agentName}</span>
                      <span className="num-fa text-[11px]">{log.createdAtJalali}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{log.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
