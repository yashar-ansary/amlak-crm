// مسیر فایل: src/components/agents/AgentsView.tsx
// نمای اعضای تیم، مشاوران املاک، درصد پورسانت و کارنامه عملکرد

import React, { useState } from 'react';
import { Award, Phone, Mail, Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatPriceCompact, toPersianDigits } from '../../utils/jalali';
import { Agent } from '../../types/crm';
import { AgentFormModal } from './AgentFormModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const AgentsView: React.FC = () => {
  const { agents, properties, contracts, deleteAgent } = useCrm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const roleNames: Record<string, string> = {
    MANAGER: 'مدیر ارشد معاملات',
    CONSULTANT: 'مشاور ارشد فروش و رهن',
    JUNIOR: 'مشاور مبتدی',
    LEGAL: 'کارشناس حقوقی و قراردادها',
  };

  const handleOpenAdd = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleDelete = (agent: Agent) => {
    setAgentToDelete(agent);
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-md">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">تیم مشاوران و عملکرد پورسانت</h2>
            <p className="text-xs text-slate-400 mt-1">
              مدیریت مشاوران، درصد پورسانت کارشناسی، فایل‌های سپرده‌شده و کارنامه معاملات
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>افزودن مشاور جدید</span>
        </button>
      </div>

      {/* کارت‌های مشاوران */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {agents.map((agent, index) => {
          // محاسبه پویای تعداد فایل‌های فعال این مشاور
          const agentProperties = properties.filter((p) => p.agentId === agent.id);
          const agentDeals = contracts.filter((c) => c.agentId === agent.id);
          const agentTotalCommission = agentDeals.reduce((sum, d) => sum + d.agentShareAmount, 0);

          return (
            <div
              key={agent.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-violet-500/40 hover:bg-white/[0.06] transition-all"
            >
              <div>
                {/* آواتار و رتبه */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-600/30">
                    {agent.fullName.slice(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="num-fa text-xs font-bold text-slate-400">
                      رتبه #{toPersianDigits(index + 1)}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(agent)}
                      title="ویرایش مشخصات مشاور"
                      className="p-1.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent)}
                      title="حذف مشاور"
                      className="p-1.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* نام و نقش */}
                <div>
                  <h3 className="text-sm font-bold text-white">{agent.fullName}</h3>
                  <div className="text-xs text-emerald-300 font-semibold mt-0.5">
                    {roleNames[agent.role] || agent.role}
                  </div>
                </div>

                {/* تماس و ایمیل */}
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 num-fa hover:text-violet-300 transition-colors">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span>{agent.phone}</span>
                  </a>
                  {agent.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>{agent.email}</span>
                    </div>
                  )}
                </div>

                {/* آمار عملکرد */}
                <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">سهم پورسانت مشاور:</span>
                    <span className="font-bold text-white num-fa">{toPersianDigits(agent.commissionRate)}٪</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">فایل‌های در اختیار:</span>
                    <span className="font-bold text-white num-fa">
                      {toPersianDigits(agentProperties.length || agent.activePropertiesCount)} ملک
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">قراردادهای قطعی:</span>
                    <span className="font-bold text-white num-fa">
                      {toPersianDigits(agentDeals.length || agent.dealsCount)} فقره
                    </span>
                  </div>
                  {agentTotalCommission > 0 && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                      <span className="text-emerald-300">کل دریافتی پورسانت:</span>
                      <span className="font-bold text-emerald-400 num-fa">
                        {formatPriceCompact(agentTotalCommission)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* درآمد پورسانت و دکمه ویرایش */}
              <div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">حجم معاملات:</div>
                  <div className="text-xs font-bold text-white num-fa mt-0.5">
                    {formatPriceCompact(agent.totalVolume)}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(agent)}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
                >
                  ویرایش
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* مدال ثبت و ویرایش مشاور */}
      <AgentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAgent(null);
        }}
        editAgent={editingAgent}
      />

      {/* مدال تایید حذف مشاور */}
      <ConfirmModal
        isOpen={!!agentToDelete}
        title="حذف مشاور از سیستم"
        message={`آیا از حذف مشاور «${agentToDelete?.fullName}» از کادر آژانس اطمینان دارید؟`}
        confirmText="بله، حذف مشاور"
        cancelText="انصراف"
        onConfirm={() => {
          if (agentToDelete) {
            deleteAgent(agentToDelete.id);
            setAgentToDelete(null);
          }
        }}
        onCancel={() => setAgentToDelete(null)}
      />
    </div>
  );
};
