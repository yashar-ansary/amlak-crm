// مسیر فایل: src/components/clients/ClientFormModal.tsx
// فرم ثبت و ویرایش مشتری و متقاضی خرید یا اجاره (CRM) با طراحی دارک گلس‌مورفیسم

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle, Sparkles, Building2, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { Client, ClientType, LeadStatus, PropertyType } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  CLIENT_TYPE_NAMES,
  LEAD_STATUS_NAMES,
  PROPERTY_TYPE_NAMES,
  toEnglishDigits,
  toPersianDigits,
  cleanNumericValue,
} from '../../utils/jalali';
import { PriceInputField } from '../common/PriceInputField';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editClient?: Client | null;
}

const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'VILLA', 'OFFICE', 'COMMERCIAL', 'LAND'];

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  editClient,
}) => {
  const { addClient, updateClient, agents, districts } = useCrm();

  const [formData, setFormData] = useState({
    fullName: editClient?.fullName || '',
    phone: editClient?.phone || '',
    email: editClient?.email || '',
    clientType: editClient?.clientType || ('BUYER' as ClientType),
    leadStatus: editClient?.leadStatus || ('NEW_LEAD' as LeadStatus),
    budgetMin:
      editClient?.budgetMin !== undefined && editClient?.budgetMin !== null
        ? editClient.budgetMin.toString()
        : '',
    budgetMax:
      editClient?.budgetMax !== undefined && editClient?.budgetMax !== null
        ? editClient.budgetMax.toString()
        : '',
    preferredDistricts: Array.isArray(editClient?.preferredDistricts)
      ? editClient.preferredDistricts.join('، ')
      : editClient ? '' : 'سعادت‌آباد، شهرک غرب',
    preferredPropertyTypes: editClient?.preferredPropertyTypes || (['APARTMENT'] as PropertyType[]),
    preferredMinArea:
      editClient?.preferredMinArea !== undefined && editClient?.preferredMinArea !== null
        ? editClient.preferredMinArea.toString()
        : editClient ? '' : '100',
    preferredRooms:
      editClient?.preferredRooms !== undefined && editClient?.preferredRooms !== null
        ? editClient.preferredRooms.toString()
        : editClient ? '' : '2',
    notes: editClient?.notes || '',
    source: editClient?.source || 'آگهی دیوار',
    agentId: editClient?.agentId || agents[0]?.id || 'agent-1',
  });

  const [error, setError] = useState('');

  // همگام‌سازی کامل اطلاعات پرونده مشتری هنگام تغییر مشتری انتخابی یا باز شدن مدال
  useEffect(() => {
    if (editClient) {
      setFormData({
        fullName: editClient.fullName || '',
        phone: editClient.phone || '',
        email: editClient.email || '',
        clientType: editClient.clientType || 'BUYER',
        leadStatus: editClient.leadStatus || 'NEW_LEAD',
        budgetMin:
          editClient.budgetMin !== undefined && editClient.budgetMin !== null
            ? editClient.budgetMin.toString()
            : '',
        budgetMax:
          editClient.budgetMax !== undefined && editClient.budgetMax !== null
            ? editClient.budgetMax.toString()
            : '',
        preferredDistricts: Array.isArray(editClient.preferredDistricts)
          ? editClient.preferredDistricts.join('، ')
          : '',
        preferredPropertyTypes: Array.isArray(editClient.preferredPropertyTypes) && editClient.preferredPropertyTypes.length > 0
          ? editClient.preferredPropertyTypes
          : ['APARTMENT'],
        preferredMinArea:
          editClient.preferredMinArea !== undefined && editClient.preferredMinArea !== null
            ? editClient.preferredMinArea.toString()
            : '',
        preferredRooms:
          editClient.preferredRooms !== undefined && editClient.preferredRooms !== null
            ? editClient.preferredRooms.toString()
            : '',
        notes: editClient.notes || '',
        source: editClient.source || 'آگهی دیوار',
        agentId: editClient.agentId || agents[0]?.id || 'agent-1',
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        clientType: 'BUYER',
        leadStatus: 'NEW_LEAD',
        budgetMin: '',
        budgetMax: '',
        preferredDistricts: 'سعادت‌آباد، شهرک غرب',
        preferredPropertyTypes: ['APARTMENT'],
        preferredMinArea: '100',
        preferredRooms: '2',
        notes: '',
        source: 'آگهی دیوار',
        agentId: agents[0]?.id || 'agent-1',
      });
    }
    setError('');
  }, [editClient, isOpen]);

  if (!isOpen) return null;

  const togglePropertyType = (type: PropertyType) => {
    const current = formData.preferredPropertyTypes || [];
    if (current.includes(type)) {
      if (current.length > 1) {
        setFormData({ ...formData, preferredPropertyTypes: current.filter((t) => t !== type) });
      }
    } else {
      setFormData({ ...formData, preferredPropertyTypes: [...current, type] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('لطفاً نام و نام خانوادگی مشتری را وارد کنید.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('شماره تماس مشتری برای پیگیری الزامی است.');
      return;
    }

    const selectedAgent = agents.find((a) => a.id === formData.agentId) || agents[0];
    const districtsArray = formData.preferredDistricts
      .split(/[،,]/)
      .map((d) => d.trim())
      .filter(Boolean);

    const clientPayload = {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      clientType: formData.clientType as ClientType,
      leadStatus: formData.leadStatus as LeadStatus,
      budgetMin: formData.budgetMin ? cleanNumericValue(formData.budgetMin) : undefined,
      budgetMax: formData.budgetMax ? cleanNumericValue(formData.budgetMax) : undefined,
      preferredDistricts: districtsArray,
      preferredPropertyTypes: formData.preferredPropertyTypes,
      preferredMinArea: formData.preferredMinArea
        ? parseFloat(toEnglishDigits(formData.preferredMinArea))
        : undefined,
      preferredRooms: formData.preferredRooms
        ? parseInt(toEnglishDigits(formData.preferredRooms), 10)
        : undefined,
      notes: formData.notes.trim(),
      source: formData.source,
      agentId: selectedAgent?.id || 'agent-1',
      agentName: selectedAgent?.fullName || 'مشاور پذیرش',
    };

    if (editClient) {
      updateClient(editClient.id, clientPayload);
    } else {
      addClient(clientPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0f1325]/95 shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col text-slate-100">
        {/* هدر مدال با تم گلس‌مورفیسم */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/[0.03] gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
              <UserPlus className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate">{editClient ? 'ویرایش پرونده مشتری' : 'ثبت متقاضی / سرنخ جدید در CRM'}</span>
                {editClient && (
                  <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-violet-300 border border-violet-500/30 shrink-0">
                    کد: {editClient.id}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                {editClient
                  ? 'مشاهده و ویرایش کلیه مشخصات ثبت‌شده، بودجه، متراژ و مناطق درخواستی'
                  : 'تکمیل نیازمندی‌های مشتری برای تطبیق هوشمند با فایل‌های ملکی'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* نام، تلفن و ایمیل */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                نام و نام خانوادگی <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="مثال: دکتر علیرضا رضایی"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                شماره موبایل <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                آدرس ایمیل (اختیاری)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40 text-left font-mono"
              />
            </div>
          </div>

          {/* نقش مشتری و مرحله پیگیری */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">نوع تقاضا / مشتری</label>
              <select
                value={formData.clientType}
                onChange={(e) =>
                  setFormData({ ...formData, clientType: e.target.value as ClientType })
                }
                className="w-full rounded-xl border border-white/10 bg-[#161a2e] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              >
                {Object.entries(CLIENT_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key} className="bg-[#161a2e] text-white">
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">وضعیت پایپ‌لاین و پیگیری</label>
              <select
                value={formData.leadStatus}
                onChange={(e) =>
                  setFormData({ ...formData, leadStatus: e.target.value as LeadStatus })
                }
                className="w-full rounded-xl border border-white/10 bg-[#161a2e] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              >
                {Object.entries(LEAD_STATUS_NAMES).map(([key, item]) => (
                  <option key={key} value={key} className="bg-[#161a2e] text-white">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* بودجه خرید یا رهن با جداسازی سه‌رقمی و معادل به حروف */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <PriceInputField
              label="حداقل بودجه درخواستی"
              value={formData.budgetMin}
              onChange={(raw) => setFormData({ ...formData, budgetMin: raw })}
              placeholder="5,000,000,000"
              quickPresets={[
                { label: '+ ۵۰۰ م', amount: 500_000_000 },
                { label: '+ ۱ میلیارد', amount: 1_000_000_000 },
                { label: '+ ۵ میلیارد', amount: 5_000_000_000 },
              ]}
            />
            <PriceInputField
              label="حداکثر سقف بودجه"
              value={formData.budgetMax}
              onChange={(raw) => setFormData({ ...formData, budgetMax: raw })}
              placeholder="8,000,000,000"
              quickPresets={[
                { label: '+ ۵۰۰ م', amount: 500_000_000 },
                { label: '+ ۱ میلیارد', amount: 1_000_000_000 },
                { label: '+ ۵ میلیارد', amount: 5_000_000_000 },
              ]}
            />
          </div>

          {/* انواع ملک مورد نظر */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              نوع ملک‌های مدنظر متقاضی
            </label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const isSelected = formData.preferredPropertyTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePropertyType(type)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/40 font-bold'
                        : 'bg-white/[0.04] text-slate-400 border border-white/10 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {PROPERTY_TYPE_NAMES[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* مناطق و حداقل متراژ و تعداد خواب */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                محله‌ها و مناطق ترجیحی (با ویرگول جدا کنید)
              </label>
              <input
                type="text"
                value={formData.preferredDistricts}
                onChange={(e) => setFormData({ ...formData, preferredDistricts: e.target.value })}
                placeholder="سعادت‌آباد، شهرک غرب، پونک"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
              {/* چیپ‌های انتخاب سریع از بانک محله‌ها */}
              <div className="mt-2 flex flex-wrap gap-1">
                {districts.map((d) => {
                  const currentList = formData.preferredDistricts
                    .split(/[,،]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const isSelected = currentList.includes(d.name);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        let updated: string[];
                        if (isSelected) {
                          updated = currentList.filter((s) => s !== d.name);
                        } else {
                          updated = [...currentList, d.name];
                        }
                        setFormData({ ...formData, preferredDistricts: updated.join('، ') });
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-violet-500/25 text-violet-200 border-violet-400/50 font-bold'
                          : 'bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/[0.08] hover:text-slate-200'
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">حداقل متراژ (متر)</label>
              <input
                type="number"
                value={formData.preferredMinArea}
                onChange={(e) => setFormData({ ...formData, preferredMinArea: e.target.value })}
                placeholder="100"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">تعداد خواب مورد نظر</label>
              <input
                type="number"
                value={formData.preferredRooms}
                onChange={(e) => setFormData({ ...formData, preferredRooms: e.target.value })}
                placeholder="2"
                min="0"
                max="10"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              />
            </div>
          </div>

          {/* مشاور مسئول و منبع ورودی */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">مشاور اختصاص‌یافته</label>
              <select
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161a2e] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id} className="bg-[#161a2e] text-white">
                    {agent.fullName} ({agent.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">منبع آشنایی / ورودی</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161a2e] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
              >
                <option value="آگهی دیوار" className="bg-[#161a2e] text-white">آگهی دیوار</option>
                <option value="شیپور" className="bg-[#161a2e] text-white">شیپور</option>
                <option value="مراجعه حضوری به دفتر" className="bg-[#161a2e] text-white">مراجعه حضوری به دفتر</option>
                <option value="معرفی مشتریان قبلی" className="bg-[#161a2e] text-white">معرفی مشتریان قبلی</option>
                <option value="اینستاگرام و وب‌سایت" className="bg-[#161a2e] text-white">اینستاگرام و وب‌سایت</option>
                <option value="بنر و تابلو دفتر" className="bg-[#161a2e] text-white">بنر و تابلو دفتر</option>
              </select>
            </div>
          </div>

          {/* یادداشت‌های مذاکره و نیازسنجی */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              یادداشت و نیازمندی‌های خاص متقاضی
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="تعداد اعضای خانواده، شرایط پرداخت نقدینگی، تمایل به ملک تخلیه یا بازسازی شده..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-violet-500/40"
            />
          </div>
        </form>

        {/* فوتر مدال */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-white/[0.02] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30 transition-all active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>{editClient ? 'ذخیره تغییرات پرونده' : 'ثبت پرونده مشتری'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

