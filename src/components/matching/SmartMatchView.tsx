// مسیر فایل: src/components/matching/SmartMatchView.tsx
// موتور تطبیق هوشمند بانک فایل‌های ملک با تقاضای خریداران و مستاجران

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeftRight,
  Calendar,
  Building,
  User,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Property, Client } from '../../types/crm';
import {
  formatPriceCompact,
  formatToman,
  toPersianDigits,
  TRANSACTION_TYPE_NAMES,
  PROPERTY_TYPE_NAMES,
} from '../../utils/jalali';

interface SmartMatchViewProps {
  onOpenScheduleViewing: (property: Property, client: Client) => void;
  onSelectProperty: (id: string) => void;
  onSelectClient: (id: string) => void;
}

export const SmartMatchView: React.FC<SmartMatchViewProps> = ({
  onOpenScheduleViewing,
  onSelectProperty,
  onSelectClient,
}) => {
  const { clients, properties, findMatchesForClient } = useCrm();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const matches = selectedClient ? findMatchesForClient(selectedClient) : [];

  return (
    <div className="space-y-6">
      {/* هدر بخش */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
            <Sparkles className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">موتور تطبیق هوشمند تقاضا و فایل‌های ملک</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تطبیق خودکار بر اساس بازه بودجه، محله، متراژ، تعداد خواب و نوع معامله
            </p>
          </div>
        </div>
      </div>

      {/* انتخاب مشتری جهت مشاهده املاک پیشنهادی */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
        <label className="block text-xs font-bold text-slate-200 mb-3">
          انتخاب متقاضی جهت بررسی فایل‌های منطبق:
        </label>
        <div className="flex flex-wrap gap-2.5">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                selectedClient?.id === c.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold border border-emerald-400/40 shadow-lg shadow-emerald-950/40'
                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <div className="font-bold">{c.fullName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 num-fa">
                بودجه: {formatPriceCompact(c.budgetMax || c.budgetMin)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* نمایش مشخصات متقاضی انتخاب‌شده */}
      {selectedClient && (
        <div className="rounded-3xl border border-sky-500/30 bg-sky-950/30 p-5 text-xs space-y-3 backdrop-blur-2xl shadow-xl shadow-black/25">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-200">
              مشخصات تقاضای {selectedClient.fullName} ({selectedClient.phone})
            </span>
            <button
              onClick={() => onSelectClient(selectedClient.id)}
              className="text-sky-400 hover:text-sky-300 hover:underline font-semibold"
            >
              مشاهده پرونده کامل مشتری
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-slate-300">
            <div>
              <span className="text-slate-400">محدوده بودجه:</span>
              <div className="font-bold text-white num-fa mt-0.5">
                {formatPriceCompact(selectedClient.budgetMin)} تا {formatPriceCompact(selectedClient.budgetMax)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">مناطق انتخابی:</span>
              <div className="font-semibold text-white mt-0.5">
                {selectedClient.preferredDistricts.join('، ') || 'همه مناطق'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">حداقل متراژ:</span>
              <div className="font-bold text-white num-fa mt-0.5">
                {toPersianDigits(selectedClient.preferredMinArea || 0)} متر
              </div>
            </div>
            <div>
              <span className="text-slate-400">تعداد خواب:</span>
              <div className="font-bold text-white num-fa mt-0.5">
                {toPersianDigits(selectedClient.preferredRooms || 1)} خواب
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نتایج تطبیق */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white">
            املاک منطبق با این متقاضی ({toPersianDigits(matches.length)} ملک کشف شد)
          </h3>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-xs text-slate-400 backdrop-blur-2xl">
            هیچ فایلی منطبق با بودجه و نیاز این متقاضی یافت نشد. می‌توانید با ثبت ملک جدید یا تعدیل پارامترهای مشتری تطبیق جدید دریافت کنید.
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(({ property, score, matchReasons }) => (
              <div
                key={property.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25 backdrop-blur-2xl hover:border-emerald-500/40 hover:bg-white/[0.06] transition-all"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="num-fa font-bold text-xs bg-white/10 text-slate-200 border border-white/15 px-2 py-0.5 rounded-lg">
                        {property.propertyCode}
                      </span>
                      <h4
                        onClick={() => onSelectProperty(property.id)}
                        className="text-sm font-bold text-white hover:text-emerald-400 cursor-pointer transition-colors"
                      >
                        {property.title}
                      </h4>
                      <span className="num-fa text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                        {toPersianDigits(score)}٪ تطبیق
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span>محله: <strong className="text-white">{property.district}</strong></span>
                      <span className="text-slate-500">·</span>
                      <span className="num-fa">{toPersianDigits(property.area)} متر مربع</span>
                      <span className="text-slate-500">·</span>
                      <span className="num-fa">{toPersianDigits(property.rooms)} خواب</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-bold text-white num-fa">
                        {property.transactionType === 'SALE'
                          ? formatPriceCompact(property.priceTotal)
                          : `رهن ${formatPriceCompact(property.deposit)} / اجاره ${formatToman(property.monthlyRent)}`}
                      </span>
                    </div>

                    {/* دلایل تطبیق */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {matchReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/25"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{reason}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t border-white/10 sm:border-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => onOpenScheduleViewing(property, selectedClient)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md shadow-emerald-950/30"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>تنظیم نوبت بازدید</span>
                    </button>

                    <button
                      onClick={() => onSelectProperty(property.id)}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      مشاهده کامل ملک
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
