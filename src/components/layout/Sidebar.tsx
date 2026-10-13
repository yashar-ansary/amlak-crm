// مسیر فایل: src/components/layout/Sidebar.tsx
// سایدبار ناوبری سیستم املاک با طراحی مدرن و راست‌چین

import React from 'react';
import {
  LayoutDashboard,
  Home,
  Users,
  CalendarCheck,
  FileText,
  Calculator,
  Award,
  Sparkles,
  ShieldCheck,
  Settings,
  MapPin,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { toPersianDigits, getCurrentJalaliDate } from '../../utils/jalali';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onOpenAuthModal }) => {
  const { stats, agencySettings, currentUser, dailyTasks } = useCrm();

  const todayStr = getCurrentJalaliDate();
  const todayTasksCount = dailyTasks.filter(
    (t) => (!currentUser?.id || t.agentId === currentUser.id) && t.dateJalali === todayStr && t.status !== 'COMPLETED'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'داشبورد مدیریتی',
      icon: LayoutDashboard,
    },
    {
      id: 'advisor',
      label: 'پنل مشاور و تقویم کاری',
      icon: CalendarCheck,
      count: todayTasksCount,
      highlight: todayTasksCount > 0,
    },
    {
      id: 'properties',
      label: 'فایل‌های املاک',
      icon: Home,
      count: stats.totalProperties,
    },
    {
      id: 'districts',
      label: 'محله‌ها و مناطق',
      icon: MapPin,
      count: stats.totalDistricts,
    },
    {
      id: 'clients',
      label: 'مشتریان و سرنخ‌ها',
      icon: Users,
      count: stats.totalClients,
    },
    {
      id: 'viewings',
      label: 'بازدیدها و قرارها',
      icon: CalendarCheck,
      count: stats.scheduledViewingsCount,
      highlight: stats.scheduledViewingsCount > 0,
    },
    {
      id: 'contracts',
      label: 'معاملات و قراردادها',
      icon: FileText,
      count: stats.totalDealsCount,
    },
    {
      id: 'matching',
      label: 'تطبیق هوشمند تقاضا',
      icon: Sparkles,
    },
    {
      id: 'calculator',
      label: 'ماشین‌حساب کمیسیون',
      icon: Calculator,
    },
    {
      id: 'agents',
      label: 'تیم مشاوران املاک',
      icon: Award,
    },
    {
      id: 'settings',
      label: 'تنظیمات سامانه',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col justify-between border-l border-white/5 bg-[#090c17] p-3.5 shrink-0 select-none z-20">
      <div>
        {/* نشان برند و نام آژانس */}
        <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              {agencySettings.agencyName.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {agencySettings.agencyName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {agencySettings.branchName || 'سامانه مدیریت معاملات'}
              </div>
            </div>
          </div>
        </div>

        {/* لیست گزینه‌های منو */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`num-fa text-[11px] px-1.5 py-0.2 rounded transition-colors ${
                      isActive
                        ? 'text-indigo-300 font-semibold'
                        : item.highlight
                        ? 'text-amber-300 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {toPersianDigits(item.count)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* بخش پایین سایدبار: مشخصات کاربر حاضر در سیستم و ورود/خروج */}
      <div className="border-t border-white/10 pt-3 space-y-2">
        <button
          type="button"
          onClick={() => (onOpenAuthModal ? onOpenAuthModal() : setActiveView('advisor'))}
          title="مشاهده پروفایل، تغییر مشاور یا ورود/خروج از سامانه"
          className="group flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 border border-white/10 text-right hover:border-violet-500/40 hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs shrink-0 shadow-md">
            {(currentUser?.fullName || agencySettings.managerName).slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-xs font-bold text-white group-hover:text-violet-200">
              {currentUser?.fullName || agencySettings.managerName}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate">
                {currentUser?.role === 'MANAGER' ? 'مدیر مسئول بنگاه' : 'مشاور تخصصی املاک'}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-lg border border-white/10 bg-white/[0.05] text-slate-400 group-hover:text-white transition-colors">
            تغییر
          </span>
        </button>
      </div>
    </aside>
  );
};
