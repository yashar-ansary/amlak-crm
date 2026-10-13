// مسیر فایل: src/types/crm.ts
// تعاریف انواع داده و تایپ‌های سیستم CRM املاک

export type PropertyType = 'APARTMENT' | 'VILLA' | 'COMMERCIAL' | 'OFFICE' | 'LAND' | 'WORKSHOP';

export type TransactionType = 'SALE' | 'RENT' | 'PRE_SALE' | 'EXCHANGE';

export type PropertyStatus = 'ACTIVE' | 'UNDER_OFFER' | 'DEAL_CLOSED' | 'ARCHIVED';

export type ClientType = 'BUYER' | 'TENANT' | 'SELLER' | 'LANDLORD' | 'INVESTOR';

export type LeadStatus =
  | 'NEW_LEAD'
  | 'IN_PROGRESS'
  | 'VIEWING_SCHEDULED'
  | 'NEGOTIATION'
  | 'CONTRACT_SIGNED'
  | 'LOST';

export type ViewingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';

export type ContractType = 'SALE_CONTRACT' | 'RENT_CONTRACT' | 'PRE_SALE';

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'SETTLED' | 'TERMINATED';

export type AgentRole = 'MANAGER' | 'CONSULTANT' | 'JUNIOR' | 'LEGAL';

// ساختار محله و منطقه در سیستم مدیریت املاک
export interface District {
  id: string;
  name: string; // نام محله (سعادت‌آباد، شهرک غرب، نیاوران، ...)
  municipalityZone: number; // منطقه شهرداری (۱ تا ۲۲)
  city: string; // شهر (تهران)
  avgSalePricePerMeter: number; // میانگین قیمت هر متر مربع فروش (تومان)
  avgRentDepositPerMeter: number; // میانگین رهن کامل هر متر مربع (تومان)
  tags: string[]; // برچسب‌ها: لوکس، نوساز، ویلایی، دسترسی مترو
  description: string; // مشخصات، موقعیت و ویژگی‌ها
  status: 'ACTIVE' | 'ARCHIVED';
  createdAtJalali?: string;
}

// ساختار فایل اطلاعات ملک
export interface Property {
  id: string;
  propertyCode: string;
  title: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  status: PropertyStatus;
  
  // قیمت و ارقام مالی به تومان
  priceTotal?: number;
  pricePerMeter?: number;
  deposit?: number; // ودیعه / رهن
  monthlyRent?: number; // اجاره ماهانه
  isConvertible: boolean; // قابلیت تبدیل رهن و اجاره

  // مشخصات فیزیکی
  area: number; // متراژ متر مربع
  rooms: number; // تعداد اتاق خواب
  floor?: number; // طبقه
  totalFloors?: number; // کل طبقات
  unitsPerFloor?: number; // تعداد واحد در طبقه
  builtYear?: number; // سال ساخت شمسی

  // امکانات رفاهی
  hasParking: boolean;
  hasElevator: boolean;
  hasStorage: boolean;
  hasBalcony: boolean;
  coolingSystem?: string;
  heatingSystem?: string;
  documentType?: string; // نوع سند: تک‌برگ، اوقافی، قولنامه‌ای
  direction?: string; // شمالی، جنوبی، دو کله

  // آدرس و موقعیت
  city: string;
  district: string; // نام محله
  address: string;

  // اطلاعات مالک
  ownerName: string;
  ownerPhone: string;
  description?: string;

  // آیکون یا سبک کارت
  cardTheme?: 'slate' | 'emerald' | 'indigo' | 'amber' | 'cyan';

  agentId: string;
  agentName: string;
  createdAtJalali: string;
  createdAt: string;
  updatedAt: string;
}

// ساختار مشتری و متقاضی در CRM
export interface Client {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  clientType: ClientType;
  leadStatus: LeadStatus;

  // ترجیحات و نیازهای ملک
  budgetMin?: number;
  budgetMax?: number;
  preferredDistricts: string[];
  preferredPropertyTypes: PropertyType[];
  preferredMinArea?: number;
  preferredRooms?: number;

  notes?: string;
  source?: string; // دیوار، شیپور، آشنایان، مراجعه حضوری

  agentId?: string;
  agentName?: string;
  createdAtJalali: string;
  createdAt: string;
  updatedAt: string;
}

// ساختار قرار ملاقات و بازدید
export interface ViewingAppointment {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  agentId: string;
  agentName: string;
  scheduledDateJalali: string; // مثلاً ۱۴۰۴/۰۷/۱۵
  scheduledTime: string; // مثلاً ۱۷:۳۰
  status: ViewingStatus;
  feedback?: string;
  createdAt: string;
}

// ساختار قرارداد و مبایعه‌نامه
export interface DealContract {
  id: string;
  contractNumber: string; // شماره مبایعه‌نامه
  contractType: ContractType;
  status: ContractStatus;
  
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  propertyAddress: string;

  firstPartyId: string; // خریدار یا مستاجر
  firstPartyName: string;
  firstPartyPhone: string;

  secondPartyName: string; // فروشنده یا موجر
  secondPartyPhone: string;
  secondPartyNationalCode?: string;

  totalAmount: number; // کل مبلغ یا ودیعه
  monthlyRentAmount?: number; // اجاره ماهانه در صورت رهن و اجاره
  
  totalCommission: number; // کل کمیسیون
  agentShareAmount: number; // سهم مشاور
  agencyShareAmount: number; // سهم بنگاه
  vatAmount: number; // مالیات بر ارزش افزوده

  signingDateJalali: string; // تاریخ امضا
  handoverDateJalali?: string; // موعد تحویل
  notaryDateJalali?: string; // تاریخ محضر

  termsConditions?: string;
  agentId: string;
  agentName: string;
  createdAt: string;
}

// ساختار گزارش فعالیت و یادداشت پیگیری
export interface ActivityLog {
  id: string;
  clientId?: string;
  clientName?: string;
  propertyId?: string;
  propertyTitle?: string;
  agentName: string;
  actionType: 'call' | 'meeting' | 'note' | 'follow_up' | 'contract';
  description: string;
  followUpDateJalali?: string;
  createdAtJalali: string;
  createdAt: string;
}

// ساختار مشاورین دفتر املاک
export interface Agent {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: AgentRole;
  commissionRate: number; // درصد سهم مشاور مثلاً ۴۰٪
  activePropertiesCount: number;
  dealsCount: number;
  totalVolume: number;
}

// ساختار تنظیمات و مشخصات آژانس املاک
export interface AgencySettings {
  agencyName: string; // نام آژانس / بنگاه املاک
  branchName: string; // نام شعبه یا منطقه
  managerName: string; // نام مدیر مسئول و صاحب جواز
  phone: string; // تلفن ثابت دفتر
  mobile: string; // تلفن همراه مدیریت
  licenseNumber: string; // شماره پروانه کسب اتحادیه
  city: string; // شهر
  address: string; // نشانی کامل دفتر املاک
  website?: string;
  defaultCommissionRate: number; // درصد پایه کمیسیون
  vatRate: number; // درصد مالیات ارزش افزوده
  contractFooterNote: string; // متن پاورقی قراردادها
}

// ساختار نتیجه تطبیق هوشمند
export interface SmartMatchResult {
  client: Client;
  property: Property;
  score: number; // امتیاز تطبیق از ۱۰۰
  matchReasons: string[];
}

// ساختار کاربر احراز هویت شده (مدیر یا مشاور املاک)
export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: AgentRole; // 'MANAGER' | 'CONSULTANT' | 'JUNIOR' | 'LEGAL'
  commissionRate: number; // درصد سهم مشاور
  avatar?: string;
  agentId?: string; // آیدی مشاور مرتبط در سیستم
}

// دسته‌بندی کارهای روزانه مشاور
export type TaskCategory =
  | 'CALL'       // تماس تلفنی با مشتری یا مالک
  | 'VIEWING'    // همراهی و انجام بازدید ملک
  | 'FOLLOW_UP'  // پیگیری سرنخ و پرونده
  | 'MEETING'    // جلسه حضوری / نشست مذاکره
  | 'CONTRACT'   // تنظیم یا امضای قرارداد و مبایعه‌نامه
  | 'INSPECTION' // کارشناسی و عکسبرداری از ملک جدید
  | 'OTHER';     // کارهای اداری و شخصی

// اولویت کار
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// وضعیت انجام کار
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ساختار کار روزانه مشاور املاک
export interface DailyTask {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dateJalali: string; // تاریخ شمسی مانند ۱۴۰۵/۰۷/۱۸
  time?: string; // ساعت پیشنهادی مانند ۱۷:۳۰
  clientName?: string;
  clientPhone?: string;
  propertyCode?: string;
  hasVoiceRecording?: boolean;
  voiceAudioUrl?: string; // ویس ضبط شده مشاور
  voiceTranscript?: string; // متن پیاده شده از صوت
  createdAtJalali: string;
  createdAt: string;
  completedAt?: string;
}
