// مسیر فایل: src/components/dashboard/DashboardView.tsx
// داشبورد تحلیلی و مدیریتی آژانس املاک با تمرکز بر بهره‌وری و تصمیم‌گیری سریع

import React from 'react';
import {
  TrendingUp,
  Building,
  KeyRound,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  PhoneCall,
  Sparkles,
  MapPin,
  Mic,
  Award,
  Settings,
  UserPlus,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  formatPriceCompact,
  formatToman,
  toPersianDigits,
  formatJalaliReadable,
  getCurrentJalaliDate,
  PROPERTY_TYPE_NAMES,
  TRANSACTION_TYPE_NAMES,
  LEAD_STATUS_NAMES,
} from '../../utils/jalali';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectProperty: (id: string) => void;
  onSelectClient: (id: string) => void;
  onOpenVoiceProperty?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectProperty,
  onSelectClient,
  onOpenVoiceProperty,
}) => {
  const {
    stats,
    properties,
    clients,
    viewings,
    contracts,
    activityLogs,
    agents,
    districts,
    agencySettings,
    updateViewingStatus,
  } = useCrm();

  // تفکیک بازدیدهای در انتظار
  const pendingViewings = viewings.filter((v) => v.status === 'SCHEDULED');
  // جدیدترین فایل‌ها
  const recentProperties = properties.slice(0, 4);
  // سرنخ‌های تازه
  const recentClients = clients.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* سربرگ آرام و بدون شلوغی داشبورد */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {agencySettings.agencyName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {agencySettings.branchName || 'سامانه مدیریت معاملات و مشاورین املاک'} · {formatJalaliReadable(getCurrentJalaliDate())}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoiceProperty && (
            <button
              onClick={onOpenVoiceProperty}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 px-3 py-2 text-xs font-semibold text-violet-200 transition-all active:scale-[0.98]"
            >
              <Mic className="h-3.5 w-3.5 text-violet-300" />
              <span>ثبت صوتی ملک</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('matching')}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>تطبیق هوشمند</span>
          </button>
        </div>
      </div>

      {/* ردیف شاخص‌های کلیدی عملکرد (KPI Metric Cards) - طراحی ساده، آرام و دقیق */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* ۱. ارزش فایل‌های فروش */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>فایل‌های فروش فعال</span>
            <Building className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {toPersianDigits(stats.activeSaleProperties)}
            </span>
            <span className="text-xs text-slate-400">ملک موجود</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            ارزش: <span className="num-fa font-semibold text-emerald-400">{formatPriceCompact(stats.totalSaleValue)}</span>
          </div>
        </div>

        {/* ۲. رهن و اجاره */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>فایل‌های رهن و اجاره</span>
            <KeyRound className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {toPersianDigits(stats.activeRentProperties)}
            </span>
            <span className="text-xs text-slate-400">واحد جاری</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            متقاضیان اجاره: <span className="font-medium text-slate-300">در حال پایش</span>
          </div>
        </div>

        {/* ۳. متقاضیان و بازدیدها */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>متقاضیان در جریان</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {toPersianDigits(stats.totalClients)}
            </span>
            <span className="text-xs text-slate-400">مشتری</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            نوبت‌های بازدید: <span className="num-fa font-semibold text-sky-400">{toPersianDigits(stats.scheduledViewingsCount)} قرار</span>
          </div>
        </div>

        {/* ۴. معاملات و کمیسیون */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 hover:border-white/15 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>درآمد کمیسیون دفتر</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {formatPriceCompact(stats.totalCommissionIncome)}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">
            قراردادهای قطعی: <span className="num-fa font-semibold text-amber-400">{toPersianDigits(stats.totalDealsCount)} فقره</span>
          </div>
        </div>
      </div>

      {/* کارتابل عملیاتی اصلی دو ستونه */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* ستون راست (۷ ستون): بازدیدهای پیش‌رو و جدیدترین املاک */}
        <div className="space-y-6 lg:col-span-7">
          {/* نوبت‌های بازدید در انتظار */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">بازدیدهای در نوبت</h3>
                <span className="num-fa text-xs text-slate-400">({toPersianDigits(pendingViewings.length)})</span>
              </div>
              <button
                onClick={() => onNavigate('viewings')}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <span>مشاهده تقویم</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {pendingViewings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  هیچ نوبت بازدیدی برای امروز در انتظار نیست.
                </div>
              ) : (
                pendingViewings.map((viewing) => (
                  <div key={viewing.id} className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.03] transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{viewing.clientName}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-300">{viewing.propertyTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="num-fa">{viewing.scheduledDateJalali}</span>
                          <span className="num-fa font-medium text-slate-200">ساعت {toPersianDigits(viewing.scheduledTime)}</span>
                        </span>
                        <span>·</span>
                        <span>مشاور: {viewing.agentName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateViewingStatus(viewing.id, 'COMPLETED', 'بازدید انجام شد')}
                        className="flex h-7 items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>انجام شد</span>
                      </button>
                      <button
                        onClick={() => updateViewingStatus(viewing.id, 'CANCELLED')}
                        className="flex h-7 items-center rounded-lg px-2 text-[11px] text-slate-400 hover:bg-white/5 hover:text-rose-300 transition-colors"
                      >
                        لغو
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* جدیدترین فایل‌های ملکی */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-violet-400" />
                <h3 className="text-xs font-bold text-white">جدیدترین فایل‌های ملکی</h3>
              </div>
              <button
                onClick={() => onNavigate('properties')}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <span>همه املاک</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {recentProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty(prop.id)}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="num-fa font-medium text-[11px] text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {prop.propertyCode}
                      </span>
                      <h4 className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {prop.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {prop.district}
                      </span>
                      <span>·</span>
                      <span className="num-fa">{toPersianDigits(prop.area)} متر</span>
                      <span>·</span>
                      <span className="num-fa">{toPersianDigits(prop.rooms)} خواب</span>
                      <span>·</span>
                      <span>{TRANSACTION_TYPE_NAMES[prop.transactionType]}</span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    {prop.transactionType === 'SALE' ? (
                      <div className="text-xs font-bold text-white num-fa">
                        {formatPriceCompact(prop.priceTotal)}
                      </div>
                    ) : (
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-white num-fa">
                          رهن: {formatPriceCompact(prop.deposit)}
                        </div>
                        <div className="text-[11px] text-slate-400 num-fa">
                          اجاره: {formatToman(prop.monthlyRent)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ستون چپ (۵ ستون): متقاضیان و یادداشت‌های روز */}
        <div className="space-y-6 lg:col-span-5">
          {/* متقاضیان در حال پیگیری */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white">متقاضیان در حال پیگیری</h3>
              </div>
              <button
                onClick={() => onNavigate('clients')}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                <span>لیست خریداران</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {recentClients.map((client) => {
                const statusMeta = LEAD_STATUS_NAMES[client.leadStatus] || {
                  label: client.leadStatus,
                  color: 'text-slate-300 bg-white/5 border-white/10',
                };
                return (
                  <div
                    key={client.id}
                    onClick={() => onSelectClient(client.id)}
                    className="p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors">
                        {client.fullName}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>بودجه:</span>
                        <span className="num-fa font-semibold text-slate-200">
                          {formatPriceCompact(client.budgetMax || client.budgetMin)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>مناطق دلخواه:</span>
                        <span className="text-slate-300 text-[11px] truncate max-w-[150px]">
                          {client.preferredDistricts.join('، ') || 'نامشخص'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* آخرین یادداشت‌ها و پیگیری‌ها */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-xs font-bold text-white mb-3">آخرین یادداشت‌های مشاوران</h3>
            <div className="space-y-3">
              {activityLogs.slice(0, 3).map((log) => (
                <div key={log.id} className="text-xs space-y-1 border-r border-indigo-500/40 pr-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-medium text-slate-200">{log.agentName}</span>
                    <span className="num-fa text-[11px] text-slate-400">{log.createdAtJalali}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
