// مسیر فایل: src/components/contracts/ContractFormModal.tsx
// فرم تنظیم و ثبت معامله ملکی (مبایعه‌نامه و اجاره‌نامه) با محاسبه خودکار کمیسیون اتحادیه

import React, { useState, useEffect } from 'react';
import { X, FileText, Check, AlertCircle, Calculator } from 'lucide-react';
import { Property, Client, ContractType } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  calculateSaleCommission,
  calculateRentCommission,
  getCurrentJalaliDate,
  formatToman,
  toPersianDigits,
  toEnglishDigits,
  cleanNumericValue,
} from '../../utils/jalali';
import { PriceInputField } from '../common/PriceInputField';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({ isOpen, onClose }) => {
  const { properties, clients, agents, addContract, agencySettings } = useCrm();

  const [contractType, setContractType] = useState<ContractType>('SALE_CONTRACT');
  const [contractNumber, setContractNumber] = useState(
    `MB-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [secondPartyName, setSecondPartyName] = useState('آقای محمد رضایی (مالک)');
  const [secondPartyPhone, setSecondPartyPhone] = useState('09121113355');
  const [secondPartyNationalCode, setSecondPartyNationalCode] = useState('0012345678');

  const [dealAmount, setDealAmount] = useState('15000000000');
  const [monthlyRentAmount, setMonthlyRentAmount] = useState('30000000');
  const [agentId, setAgentId] = useState(agents[0]?.id || 'agent-1');

  const [signingDateJalali, setSigningDateJalali] = useState(getCurrentJalaliDate());
  const [handoverDateJalali, setHandoverDateJalali] = useState('۱۴۰۴/۰۸/۰۱');
  const [notaryDateJalali, setNotaryDateJalali] = useState('۱۴۰۴/۰۸/۱۵');
  const [terms, setTerms] = useState(
    'ثمن معامله در سه فقره چک رمزدار پرداخت می‌گردد. طرفین اسقاط کافه خیارات را به عمل آوردند.'
  );

  const [error, setError] = useState('');

  // تغییر کد قرارداد با تغییر نوع معامله
  useEffect(() => {
    if (contractType === 'SALE_CONTRACT') {
      setContractNumber(`MB-${Math.floor(1000 + Math.random() * 9000)}`);
    } else {
      setContractNumber(`EJ-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [contractType]);

  // پر کردن خودکار اطلاعات ملک انتخابی
  useEffect(() => {
    const selectedProp = properties.find((p) => p.id === propertyId);
    if (selectedProp) {
      setSecondPartyName(selectedProp.ownerName);
      setSecondPartyPhone(selectedProp.ownerPhone);
      if (selectedProp.transactionType === 'SALE' && selectedProp.priceTotal) {
        setContractType('SALE_CONTRACT');
        setDealAmount(selectedProp.priceTotal.toString());
      } else if (selectedProp.transactionType === 'RENT') {
        setContractType('RENT_CONTRACT');
        setDealAmount(selectedProp.deposit?.toString() || '1000000000');
        setMonthlyRentAmount(selectedProp.monthlyRent?.toString() || '30000000');
      }
    }
  }, [propertyId, properties]);

  if (!isOpen) return null;

  // محاسبه خودکار کمیسیون قانونی
  const dealAmountNum = cleanNumericValue(dealAmount);
  const rentAmountNum = cleanNumericValue(monthlyRentAmount);
  const selectedAgent = agents.find((a) => a.id === agentId) || agents[0];

  let calculatedCommission = 0;
  let vat = 0;
  const currentCommRate = agencySettings?.defaultCommissionRate !== undefined ? agencySettings.defaultCommissionRate : 0.25;
  const currentVatRate = agencySettings?.vatRate !== undefined ? agencySettings.vatRate : 10;

  if (contractType === 'SALE_CONTRACT') {
    const saleComm = calculateSaleCommission(dealAmountNum, currentCommRate, currentVatRate);
    calculatedCommission = saleComm.totalBase;
    vat = saleComm.totalVat;
  } else {
    const rentComm = calculateRentCommission(dealAmountNum, rentAmountNum, currentVatRate);
    calculatedCommission = rentComm.totalBase;
    vat = rentComm.totalVat;
  }

  const agentShare = Math.round(calculatedCommission * ((selectedAgent?.commissionRate || 40) / 100));
  const agencyShare = calculatedCommission - agentShare;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = properties.find((p) => p.id === propertyId);
    const client = clients.find((c) => c.id === clientId);

    if (!prop || !client) {
      setError('ملک و مشتری طرف معامله الزامی هستند.');
      return;
    }

    addContract({
      contractNumber,
      contractType,
      status: 'ACTIVE',
      propertyId: prop.id,
      propertyCode: prop.propertyCode,
      propertyTitle: prop.title,
      propertyAddress: prop.address || prop.district,
      firstPartyId: client.id,
      firstPartyName: client.fullName,
      firstPartyPhone: client.phone,
      secondPartyName,
      secondPartyPhone,
      secondPartyNationalCode,
      totalAmount: dealAmountNum,
      monthlyRentAmount: contractType === 'RENT_CONTRACT' ? rentAmountNum : undefined,
      totalCommission: calculatedCommission,
      agentShareAmount: agentShare,
      agencyShareAmount: agencyShare,
      vatAmount: vat,
      signingDateJalali,
      handoverDateJalali,
      notaryDateJalali,
      termsConditions: terms,
      agentId: selectedAgent.id,
      agentName: selectedAgent.fullName,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0f1325]/95 shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col text-slate-100">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">تنظیم و انعقاد قرارداد ملکی رسمی</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">ثبت مبایعه‌نامه و اجاره‌نامه با محاسبه خودکار کمیسیون قانونی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* نوع قرارداد و شماره */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع سند قرارداد</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="SALE_CONTRACT">مبایعه‌نامه فروش قطعی</option>
                <option value="RENT_CONTRACT">اجاره‌نامه مسکونی / تجاری</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره ثبت قرارداد</label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-bold num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          {/* فایل ملک و خریدار */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">فایل ملک مورد معامله</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.propertyCode} - {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                طرف اول ({contractType === 'SALE_CONTRACT' ? 'خریدار' : 'مستاجر'})
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* طرف دوم (فروشنده / موجر) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                طرف دوم ({contractType === 'SALE_CONTRACT' ? 'فروشنده' : 'موجر'})
              </label>
              <input
                type="text"
                value={secondPartyName}
                onChange={(e) => setSecondPartyName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تلفن طرف دوم</label>
              <input
                type="text"
                value={secondPartyPhone}
                onChange={(e) => setSecondPartyPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد ملی طرف دوم</label>
              <input
                type="text"
                value={secondPartyNationalCode}
                onChange={(e) => setSecondPartyNationalCode(e.target.value)}
                placeholder="0012345678"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          {/* ارقام مالی معامله با جداسازی سه‌رقمی و معادل به حروف */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <PriceInputField
              label={contractType === 'SALE_CONTRACT' ? 'ثمن کل معامله (تومان)' : 'مبلغ ودیعه / قرض‌الحسنه (تومان)'}
              value={dealAmount}
              onChange={(raw) => setDealAmount(raw)}
              placeholder={contractType === 'SALE_CONTRACT' ? 'مثال: 15,000,000,000' : 'مثال: 1,000,000,000'}
              required
              quickPresets={
                contractType === 'SALE_CONTRACT'
                  ? [
                      { label: '+ ۱۰۰ م', amount: 100_000_000 },
                      { label: '+ ۵۰۰ م', amount: 500_000_000 },
                      { label: '+ ۱ میلیارد', amount: 1_000_000_000 },
                    ]
                  : [
                      { label: '+ ۵۰ م', amount: 50_000_000 },
                      { label: '+ ۱۰۰ م', amount: 100_000_000 },
                      { label: '+ ۵۰۰ م', amount: 500_000_000 },
                    ]
              }
            />

            {contractType === 'RENT_CONTRACT' && (
              <PriceInputField
                label="مبلغ اجاره‌بها ماهانه (تومان)"
                value={monthlyRentAmount}
                onChange={(raw) => setMonthlyRentAmount(raw)}
                placeholder="مثال: 25,000,000"
                required
                quickPresets={[
                  { label: '+ ۱ م', amount: 1_000_000 },
                  { label: '+ ۵ م', amount: 5_000_000 },
                  { label: '+ ۱۰ م', amount: 10_000_000 },
                ]}
              />
            )}
          </div>

          {/* باکس محاسبه خودکار کمیسیون و سهم مشاور */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-3">
              <Calculator className="h-4 w-4 text-emerald-400" />
              <span>محاسبه حق‌الزحمه طبق تعرفه قانونی اتحادیه مشاوران املاک</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div>
                <span className="text-slate-400">کل کمیسیون پایه:</span>
                <div className="font-bold text-white num-fa mt-0.5">{formatToman(calculatedCommission)}</div>
              </div>
              <div>
                <span className="text-slate-400">مالیات بر ارزش افزوده (۱۰٪):</span>
                <div className="font-bold text-white num-fa mt-0.5">{formatToman(vat)}</div>
              </div>
              <div>
                <span className="text-slate-400">سهم مشاور ({selectedAgent.commissionRate}٪):</span>
                <div className="font-bold text-emerald-300 num-fa mt-0.5">{formatToman(agentShare)}</div>
              </div>
              <div>
                <span className="text-slate-400">سهم دفتر املاک:</span>
                <div className="font-bold text-white num-fa mt-0.5">{formatToman(agencyShare)}</div>
              </div>
            </div>
          </div>

          {/* تاریخ‌ها */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاریخ امضای قرارداد</label>
              <input
                type="text"
                value={signingDateJalali}
                onChange={(e) => setSigningDateJalali(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاریخ تحویل ملک</label>
              <input
                type="text"
                value={handoverDateJalali}
                onChange={(e) => setHandoverDateJalali(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تاریخ دفترخانه رسمی</label>
              <input
                type="text"
                value={notaryDateJalali}
                onChange={(e) => setNotaryDateJalali(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          {/* مشاور مسئول پرونده */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">مشاور تنظیم‌کننده</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} (سهم پورسانت: {a.commissionRate}٪)
                </option>
              ))}
            </select>
          </div>

          {/* شروط و ماده‌های قرارداد */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">شروط و توضیحات تکمیلی قرارداد</label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-white/[0.02] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>ثبت نهایی و صدور قرارداد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
