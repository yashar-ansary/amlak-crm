// مسیر فایل: src/components/auth/AuthModal.tsx
// مدال احراز هویت، ورود، ثبت‌نام مشاور و جابجایی سریع بین حساب‌های کاربری

import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Lock,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { AgentRole } from '../../types/crm';
import { toPersianDigits } from '../../utils/jalali';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, login, loginAsAgent, logout, registerUser, agents } = useCrm();

  const [activeTab, setActiveTab] = useState<'quick' | 'login' | 'register'>('quick');

  // فرم ورود
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // فرم ثبت‌نام
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<AgentRole>('CONSULTANT');
  const [regCommissionRate, setRegCommissionRate] = useState(40);
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginIdentifier.trim()) {
      setLoginError('لطفاً شماره تلفن یا ایمیل خود را وارد نمایید.');
      return;
    }

    const res = login(loginIdentifier, loginPassword);
    if (res.success) {
      setLoginSuccess(res.message || 'با موفقیت وارد شدید.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setLoginError(res.message || 'کاربری یافت نشد.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim()) {
      setRegError('نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('شماره تلفن را وارد کنید.');
      return;
    }

    const res = registerUser({
      fullName: regFullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      role: regRole,
      commissionRate: regCommissionRate,
    });

    if (res.success) {
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } else {
      setRegError(res.message || 'خطا در ثبت نام.');
    }
  };

  const handleQuickLogin = (agentId: string) => {
    loginAsAgent(agentId);
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0e1224] p-5 sm:p-6 shadow-2xl text-slate-100 overflow-hidden">
        {/* هاله‌های پس‌زمینه */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-600/30 blur-3xl" />

        {/* سربرگ مدال */}
        <div className="relative flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">احراز هویت و دسترسی مشاوران</h2>
              <p className="text-xs text-slate-400">ورود به پنل اختصاصی مشاور و تقویم کاری</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* وضعیت حساب کاربری فعلی در صورت وجود */}
        {currentUser && (
          <div className="relative mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm shadow-md">
                {currentUser.fullName.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{currentUser.fullName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {currentUser.role === 'MANAGER' ? 'مدیر مسئول' : 'مشاور املاک'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 num-fa mt-0.5">
                  {currentUser.phone} · پورسانت: {toPersianDigits(currentUser.commissionRate)}٪
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              خروج از حساب
            </button>
          </div>
        )}

        {/* زبانه‌های ناوبری */}
        <div className="relative flex rounded-2xl bg-white/[0.05] p-1 mt-4 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'quick'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>ورود سریع نمونه</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>ورود با شماره</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>مشاور جدید</span>
          </button>
        </div>

        {/* محتوای زبانه: ورود سریع نمونه */}
        {activeTab === 'quick' && (
          <div className="relative mt-4 space-y-2.5">
            <p className="text-xs text-slate-400">
              یک حساب کاربری را انتخاب کنید تا مستقیماً وارد پنل مشاور یا مدیریت شوید:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {agents.map((agent) => {
                const isSelected = currentUser?.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleQuickLogin(agent.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-right transition-all group ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/20 shadow-md ring-1 ring-violet-500'
                        : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm shrink-0 shadow-md ${
                        agent.role === 'MANAGER'
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                          : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                      }`}
                    >
                      {agent.fullName.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate group-hover:text-violet-200">
                          {agent.fullName}
                        </span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                        <span>{agent.role === 'MANAGER' ? 'مدیر بنگاه' : 'مشاور املاک'}</span>
                        <span className="num-fa text-slate-300 font-medium">
                          {toPersianDigits(agent.commissionRate)}٪ پورسانت
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* محتوای زبانه: فرم ورود */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="relative mt-4 space-y-3.5">
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            {loginSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                شماره تلفن یا ایمیل مشاور:
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="مثال: 09123334455 یا karimi@parsmelk.ir"
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">رمز عبور (اختیاری):</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-xs text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span>ورود به سامانه</span>
            </button>
          </form>
        )}

        {/* محتوای زبانه: فرم ثبت‌نام مشاور جدید */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="relative mt-4 space-y-3">
            {regError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام و نام خانوادگی:</label>
                <div className="relative">
                  <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="مثال: آرش سپهری"
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">شماره موبایل:</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نقش در دفتر املاک:</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as AgentRole)}
                  className="w-full h-9.5 rounded-xl border border-white/10 bg-[#0e1224] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="CONSULTANT">مشاور املاک تخصصی</option>
                  <option value="MANAGER">مدیر مسئول و صاحب جواز</option>
                  <option value="JUNIOR">مشاور تازه‌کار / کارآموز</option>
                  <option value="LEGAL">کارشناس حقوقی و قراردادها</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">درصد پورسانت مشاور (٪):</label>
                <div className="relative">
                  <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={regCommissionRate}
                    onChange={(e) => setRegCommissionRate(parseInt(e.target.value, 10) || 40)}
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ایمیل (اختیاری):</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@parsmelk.ir"
                  className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-xs text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>ثبت‌نام و ورود مستقیم به پنل</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
