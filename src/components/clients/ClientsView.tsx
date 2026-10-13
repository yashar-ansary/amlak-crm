// مسیر فایل: src/components/clients/ClientsView.tsx
// نمای مدیریت مشتریان و سرنخ‌های ملکی (CRM Leads & Clients)

import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Users,
  Phone,
  Calendar,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';
import { Client, ClientType, LeadStatus, Property } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  formatPriceCompact,
  toPersianDigits,
  CLIENT_TYPE_NAMES,
  LEAD_STATUS_NAMES,
} from '../../utils/jalali';
import { ClientFormModal } from './ClientFormModal';
import { ClientDetailModal } from './ClientDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface ClientsViewProps {
  onOpenNewClient: () => void;
  selectedClientId?: string | null;
  onSelectClient: (id: string | null) => void;
  onOpenScheduleViewing: (property: Property, client: Client) => void;
  onSelectProperty: (propertyId: string) => void;
  searchQuery: string;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onOpenNewClient,
  selectedClientId,
  onSelectClient,
  onOpenScheduleViewing,
  onSelectProperty,
  searchQuery,
}) => {
  const { clients, deleteClient, findMatchesForClient } = useCrm();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // مشتری فعال برای مدال
  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // فیلتر مشتریان
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // جستجو
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          client.fullName.toLowerCase().includes(q) ||
          client.phone.includes(q) ||
          client.preferredDistricts.some((d) => d.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // فیلتر نوع مشتری
      if (typeFilter !== 'ALL' && client.clientType !== typeFilter) {
        return false;
      }

      // فیلتر مرحله پایپ‌لاین
      if (statusFilter !== 'ALL' && client.leadStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [clients, searchQuery, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ردیف بالا: فیلترها و دکمه ثبت با تم گلس‌مورفیسم */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        {/* تب‌های نوع متقاضی */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-md">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === 'ALL'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            همه متقاضیان ({toPersianDigits(clients.length)})
          </button>
          <button
            onClick={() => setTypeFilter('BUYER')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === 'BUYER'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            متقاضیان خرید
          </button>
          <button
            onClick={() => setTypeFilter('TENANT')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              typeFilter === 'TENANT'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            متقاضیان رهن و اجاره
          </button>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>ثبت متقاضی جدید</span>
        </button>
      </div>

      {/* فیلتر وضعیت پایپ‌لاین */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold ml-2">مرحله پیگیری:</span>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            statusFilter === 'ALL'
              ? 'bg-white/20 text-white font-bold border border-white/25 shadow-xs'
              : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
          }`}
        >
          همه مراحل
        </button>
        {Object.entries(LEAD_STATUS_NAMES).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === key
                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/25 border border-violet-400/40'
                : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* کارت‌های متقاضیان */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
          <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">مشتری با این مشخصات یافت نشد</h3>
          <p className="mt-1 text-xs text-slate-400">
            فیلترها را تغییر دهید یا متقاضی جدیدی ثبت فرمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const matches = findMatchesForClient(client);
            const statusMeta = LEAD_STATUS_NAMES[client.leadStatus] || {
              label: client.leadStatus,
              color: 'text-slate-300 bg-white/10 border-white/15',
            };

            return (
              <div
                key={client.id}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-violet-500/40 hover:bg-white/[0.06] transition-all"
              >
                <div>
                  {/* هدر کارت */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {CLIENT_TYPE_NAMES[client.clientType]}
                    </span>
                  </div>

                  {/* نام مشتری */}
                  <div className="mt-3">
                    <h3
                      onClick={() => onSelectClient(client.id)}
                      className="text-sm font-bold text-white group-hover:text-violet-300 cursor-pointer transition-colors"
                    >
                      {client.fullName}
                    </h3>
                    <a
                      href={`tel:${client.phone}`}
                      className="mt-1 inline-flex items-center gap-1.5 num-fa text-xs text-slate-400 hover:text-violet-300 transition-colors"
                    >
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{client.phone}</span>
                    </a>
                  </div>

                  {/* بودجه و مناطق مدنظر */}
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">محدوده بودجه:</span>
                      <span className="num-fa font-bold text-violet-300">
                        {formatPriceCompact(client.budgetMax || client.budgetMin)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">محله‌های درخواستی:</span>
                      <span className="font-medium text-slate-200 truncate max-w-[150px]">
                        {client.preferredDistricts.join('، ') || 'همه محله‌ها'}
                      </span>
                    </div>
                    {(client.preferredMinArea || client.preferredRooms) && (
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                        <span className="text-slate-400">متراژ و خواب:</span>
                        <span className="num-fa font-medium text-slate-300">
                          {client.preferredMinArea ? `${toPersianDigits(client.preferredMinArea)} متر` : ''}
                          {client.preferredMinArea && client.preferredRooms ? ' · ' : ''}
                          {client.preferredRooms ? `${toPersianDigits(client.preferredRooms)} خواب` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* تطبیق هوشمند با فایل‌های موجود */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">فایل‌های منطبق در سیستم:</span>
                    <span className="num-fa font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      {toPersianDigits(matches.length)} ملک سازگار
                    </span>
                  </div>
                </div>

                {/* اقدامات کارت */}
                <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectClient(client.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>مشاهده پرونده</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setIsFormOpen(true);
                    }}
                    title="ویرایش مشتری"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-violet-600/30 hover:border-violet-500/50 hover:text-violet-200 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setClientToDelete(client)}
                    title="حذف پرونده"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال جزئیات پرونده */}
      <ClientDetailModal
        client={activeClient}
        isOpen={Boolean(activeClient)}
        onClose={() => onSelectClient(null)}
        onOpenScheduleViewing={(prop, cl) => {
          onSelectClient(null);
          onOpenScheduleViewing(prop, cl);
        }}
        onSelectProperty={onSelectProperty}
        onEditClient={(client) => {
          onSelectClient(null);
          setEditingClient(client);
          setIsFormOpen(true);
        }}
      />

      {/* مدال ثبت و ویرایش مشتری با کلید یکتا جهت پر شدن آنی و دقیق مقادیر */}
      <ClientFormModal
        key={editingClient ? `edit-${editingClient.id}` : (isFormOpen ? 'new-form' : 'closed')}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClient(null);
        }}
        editClient={editingClient}
      />

      {/* مدال تایید حذف مشتری */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        title="حذف پرونده مشتری"
        message={`آیا از حذف پرونده متقاضی «${clientToDelete?.fullName}» از سامانه اطمینان دارید؟`}
        confirmText="بله، حذف پرونده"
        cancelText="انصراف"
        onConfirm={() => {
          if (clientToDelete) {
            deleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
};
