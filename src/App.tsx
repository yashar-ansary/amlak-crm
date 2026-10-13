// مسیر فایل: src/App.tsx
// کامپوننت اصلی و ریشه سامانه CRM املاک پارس ملک

import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PropertiesView } from './components/properties/PropertiesView';
import { PropertyFormModal } from './components/properties/PropertyFormModal';
import { VoicePropertyModal } from './components/properties/VoicePropertyModal';
import { ClientsView } from './components/clients/ClientsView';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { AppointmentFormModal } from './components/appointments/AppointmentFormModal';
import { ContractsView } from './components/contracts/ContractsView';
import { SmartMatchView } from './components/matching/SmartMatchView';
import { CalculatorView } from './components/calculator/CalculatorView';
import { AgentsView } from './components/agents/AgentsView';
import { SettingsView } from './components/settings/SettingsView';
import { DistrictsView } from './components/districts/DistrictsView';
import { AdvisorPanelView } from './components/advisor/AdvisorPanelView';
import { AuthModal } from './components/auth/AuthModal';
import { Property, Client } from './types/crm';
import { ParsedVoiceProperty } from './utils/voiceParser';
import {
  LayoutDashboard,
  Home,
  Users,
  CalendarCheck,
  FileText,
  Sparkles,
  Calculator,
  Award,
  Menu,
  X,
  MapPin,
  Settings,
  ChevronLeft,
  ShieldCheck,
  Mic,
  Plus,
} from 'lucide-react';

function AppContent() {
  const { stats, agencySettings, currentUser } = useCrm();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // استیت‌های مدال‌ها
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewPropertyOpen, setIsNewPropertyOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [prefillVoiceData, setPrefillVoiceData] = useState<ParsedVoiceProperty | null>(null);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // آیتم‌های انتخابی برای باز کردن مدال‌ها
  const [selectedPropertyForViewing, setSelectedPropertyForViewing] = useState<Property | null>(null);
  const [selectedClientForViewing, setSelectedClientForViewing] = useState<Client | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // هماهنگی بازدید از روی کارت ملک یا مشتری
  const handleOpenScheduleViewing = (prop?: Property | null, cl?: Client | null) => {
    setSelectedPropertyForViewing(prop || null);
    setSelectedClientForViewing(cl || null);
    setIsAppointmentModalOpen(true);
  };

  const handleMobileNav = (viewId: string) => {
    setActiveView(viewId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <div className="relative flex h-[100dvh] w-full bg-[#0a0d18] text-slate-100 overflow-x-hidden md:overflow-hidden font-sans">
      {/* نور ملایم زمینه بسیار آرام و غیرمزاحم */}
      <div className="pointer-events-none fixed top-0 right-1/4 h-96 w-96 rounded-full bg-indigo-500/5 blur-[120px]" />

      {/* سایدبار ثابت سمت راست */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* ناحیه محتوای اصلی */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden z-10">
        {/* نوار ناوبری بالا */}
        <Navbar
          activeView={activeView}
          onNavigate={(view) => setActiveView(view)}
          onOpenNewProperty={() => setIsNewPropertyOpen(true)}
          onOpenNewClient={() => setIsNewClientOpen(true)}
          onOpenVoiceProperty={() => setIsVoiceModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* بدنه اسکرول‌شونده نماها */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-8">
          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={(view) => setActiveView(view)}
              onSelectProperty={(id) => {
                setSelectedPropertyId(id);
                setActiveView('properties');
              }}
              onSelectClient={(id) => {
                setSelectedClientId(id);
                setActiveView('clients');
              }}
              onOpenVoiceProperty={() => setIsVoiceModalOpen(true)}
            />
          )}

          {activeView === 'advisor' && <AdvisorPanelView />}

          {activeView === 'properties' && (
            <PropertiesView
              onOpenNewProperty={() => setIsNewPropertyOpen(true)}
              onOpenVoiceProperty={() => setIsVoiceModalOpen(true)}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={setSelectedPropertyId}
              onOpenScheduleViewing={(p) => handleOpenScheduleViewing(p, null)}
              searchQuery={searchQuery}
            />
          )}

          {activeView === 'districts' && (
            <DistrictsView
              onNavigateToProperties={(districtName) => {
                setSearchQuery(districtName);
                setActiveView('properties');
              }}
              onNavigateToClients={(districtName) => {
                setSearchQuery(districtName);
                setActiveView('clients');
              }}
            />
          )}

          {activeView === 'clients' && (
            <ClientsView
              onOpenNewClient={() => setIsNewClientOpen(true)}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              onOpenScheduleViewing={(p, c) => handleOpenScheduleViewing(p, c)}
              onSelectProperty={(pId) => {
                setSelectedPropertyId(pId);
                setActiveView('properties');
              }}
              searchQuery={searchQuery}
            />
          )}

          {activeView === 'viewings' && <AppointmentsView />}

          {activeView === 'contracts' && <ContractsView />}

          {activeView === 'matching' && (
            <SmartMatchView
              onOpenScheduleViewing={(p, c) => handleOpenScheduleViewing(p, c)}
              onSelectProperty={(pId) => {
                setSelectedPropertyId(pId);
                setActiveView('properties');
              }}
              onSelectClient={(cId) => {
                setSelectedClientId(cId);
                setActiveView('clients');
              }}
            />
          )}

          {activeView === 'calculator' && <CalculatorView />}

          {activeView === 'agents' && <AgentsView />}

          {activeView === 'settings' && <SettingsView />}
        </main>

        {/* نوار ناوبری پایین در دستگاه‌های موبایل */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0d1d]/95 backdrop-blur-2xl border-t border-white/10 px-1 py-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl shadow-black">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] transition-colors rounded-xl ${
              activeView === 'dashboard' ? 'text-violet-400 font-bold bg-white/[0.05]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>داشبورد</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('advisor')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] transition-colors rounded-xl ${
              activeView === 'advisor' ? 'text-violet-400 font-bold bg-white/[0.05]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>پنل مشاور</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('properties')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] transition-colors rounded-xl ${
              activeView === 'properties' ? 'text-violet-400 font-bold bg-white/[0.05]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>املاک</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('clients')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] transition-colors rounded-xl ${
              activeView === 'clients' ? 'text-violet-400 font-bold bg-white/[0.05]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>مشتریان</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('contracts')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] transition-colors rounded-xl ${
              activeView === 'contracts' ? 'text-violet-400 font-bold bg-white/[0.05]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>قراردادها</span>
          </button>
        </div>
      </div>

      {/* منوی کشویی جانبی برای موبایل (Mobile Drawer) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* پس‌زمینه نیمه‌شفاف */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* پنل کشویی از سمت راست */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#0c1022]/98 border-r border-white/10 shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 text-white">
            <div className="space-y-4">
              {/* هدر دراور */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-black text-sm shadow-md shadow-violet-600/30">
                    {agencySettings.agencyName.slice(0, 1)}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white truncate">{agencySettings.agencyName}</div>
                    <div className="text-[11px] text-slate-400">{agencySettings.branchName || 'سامانه جامع معاملات'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* گزینه‌های منوی موبایل */}
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
                  { id: 'advisor', label: 'پنل مشاور و تقویم کاری', icon: CalendarCheck, tag: 'جدید' },
                  { id: 'properties', label: 'بانک فایل‌های ملک', icon: Home, count: stats.totalProperties },
                  { id: 'districts', label: 'محله‌ها و مناطق', icon: MapPin, count: stats.totalDistricts },
                  { id: 'clients', label: 'مشتریان و متقاضیان', icon: Users, count: stats.totalClients },
                  { id: 'viewings', label: 'کارتابل بازدیدها', icon: CalendarCheck, count: stats.scheduledViewingsCount, hl: stats.scheduledViewingsCount > 0 },
                  { id: 'contracts', label: 'معاملات و قراردادها', icon: FileText, count: stats.totalDealsCount },
                  { id: 'matching', label: 'تطبیق هوشمند تقاضا', icon: Sparkles, tag: 'هوشمند' },
                  { id: 'calculator', label: 'ماشین‌حساب کمیسیون', icon: Calculator },
                  { id: 'agents', label: 'تیم و پورسانت مشاوران', icon: Award },
                  { id: 'settings', label: 'تنظیمات سامانه و آژانس', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMobileNav(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-violet-600/25 border border-violet-500/40 text-white font-bold'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`num-fa text-[11px] px-2 py-0.5 rounded-full ${
                          item.hl ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 bg-white/[0.05]'
                        }`}>
                          {item.count}
                        </span>
                      )}
                      {item.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white">
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* بخش پایین منوی موبایل: اطلاعات کاربر و احراز هویت */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full rounded-xl bg-white/[0.04] p-3 border border-white/10 text-right hover:border-violet-500/40 hover:bg-white/[0.08] transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {currentUser?.fullName || agencySettings.managerName}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span>{currentUser?.role === 'MANAGER' ? 'مدیر مسئول بنگاه' : 'مشاور تخصصی املاک'}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  تغییر حساب
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('settings')}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>تنظیمات سامانه و پروانه کسب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال احراز هویت و دسترسی مشاوران */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // در صورت ورود، می‌توان مستقیماً به پنل مشاور رفت
          setActiveView('advisor');
        }}
      />

      {/* مدال ثبت فایل ملک جدید */}
      <PropertyFormModal
        isOpen={isNewPropertyOpen}
        onClose={() => {
          setIsNewPropertyOpen(false);
          setPrefillVoiceData(null);
        }}
        prefillVoiceData={prefillVoiceData}
        onOpenVoiceModal={() => {
          setIsNewPropertyOpen(false);
          setIsVoiceModalOpen(true);
        }}
      />

      {/* مدال ثبت صوتی فایل ملک با هوش مصنوعی */}
      <VoicePropertyModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyToForm={(parsedData) => {
          setPrefillVoiceData(parsedData);
          setIsNewPropertyOpen(true);
        }}
      />

      {/* مدال ثبت مشتری جدید */}
      <ClientFormModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
      />

      {/* مدال تنظیم نوبت بازدید */}
      <AppointmentFormModal
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setSelectedPropertyForViewing(null);
          setSelectedClientForViewing(null);
        }}
        initialProperty={selectedPropertyForViewing}
        initialClient={selectedClientForViewing}
      />
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <AppContent />
    </CrmProvider>
  );
}
