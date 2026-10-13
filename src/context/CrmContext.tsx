// مسیر فایل: src/context/CrmContext.tsx
// کانتکست سراسری مدیریت داده‌های CRM املاک همراه با ذخیره‌سازی محلی (localStorage)

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Property,
  Client,
  ViewingAppointment,
  DealContract,
  Agent,
  ActivityLog,
  SmartMatchResult,
  ViewingStatus,
  ContractStatus,
  AgencySettings,
  District,
  AuthUser,
  DailyTask,
} from '../types/crm';
import {
  INITIAL_PROPERTIES,
  INITIAL_CLIENTS,
  INITIAL_VIEWINGS,
  INITIAL_CONTRACTS,
  INITIAL_AGENTS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_DISTRICTS,
  INITIAL_DAILY_TASKS,
} from '../data/mockInitialData';
import { getCurrentJalaliDate } from '../utils/jalali';

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: 'پارس ملک',
  branchName: 'شعبه شمال و غرب تهران',
  managerName: 'مهندس علیرضا سلیمانی',
  phone: '021-22003344',
  mobile: '09121112233',
  licenseNumber: '۱۴۰۲/۹۸۷-اتحادیه',
  city: 'تهران',
  address: 'تهران، سعادت‌آباد، بالاتر از میدان کاج، نبش خیابان مروارید، پلاک ۱۸، واحد ۲',
  website: 'www.parsmelk.ir',
  defaultCommissionRate: 0.25,
  vatRate: 10,
  contractFooterNote: 'تنظیم شده در سامانه مدیریت معاملات پارس ملک با نظارت اتحادیه صنف مشاورین املاک تهران',
};

interface CrmContextType {
  // احراز هویت و کاربر فعال
  currentUser: AuthUser | null;
  login: (phoneOrEmail: string, password?: string) => { success: boolean; message?: string };
  loginAsAgent: (agentId: string) => void;
  logout: () => void;
  registerUser: (userData: Omit<AuthUser, 'id'>, password?: string) => { success: boolean; message?: string };

  // کارهای روزانه مشاور
  dailyTasks: DailyTask[];
  addDailyTask: (task: Omit<DailyTask, 'id' | 'createdAt' | 'createdAtJalali'>) => DailyTask;
  updateDailyTask: (id: string, updates: Partial<DailyTask>) => void;
  deleteDailyTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // آرایه‌های داده
  properties: Property[];
  clients: Client[];
  viewings: ViewingAppointment[];
  contracts: DealContract[];
  agents: Agent[];
  activityLogs: ActivityLog[];
  agencySettings: AgencySettings;
  districts: District[];

  // عملیات محله‌ها و مناطق
  addDistrict: (district: Omit<District, 'id' | 'createdAtJalali'>) => void;
  updateDistrict: (id: string, district: Partial<District>) => void;
  deleteDistrict: (id: string) => void;

  // عملیات فایل‌های ملک
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'createdAtJalali'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // عملیات مشتریان
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdAtJalali'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // عملیات مشاورین
  addAgent: (agent: Omit<Agent, 'id' | 'activePropertiesCount' | 'dealsCount' | 'totalVolume'>) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;

  // عملیات بازدیدها
  addViewing: (viewing: Omit<ViewingAppointment, 'id' | 'createdAt'>) => void;
  updateViewingStatus: (id: string, status: ViewingStatus, feedback?: string) => void;
  deleteViewing: (id: string) => void;

  // عملیات قراردادها
  addContract: (contract: Omit<DealContract, 'id' | 'createdAt'>) => void;
  updateContractStatus: (id: string, status: ContractStatus) => void;
  deleteContract: (id: string) => void;

  // تنظیمات آژانس
  updateAgencySettings: (settings: Partial<AgencySettings>) => void;
  resetAgencySettings: () => void;

  // گزارش فعالیت‌ها
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt' | 'createdAtJalali'>) => void;

  // ابزارهای سیستمی
  resetToDefaults: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonData: string) => boolean;

  // موتور تطبیق هوشمند
  findMatchesForClient: (client: Client) => SmartMatchResult[];
  findMatchesForProperty: (property: Property) => SmartMatchResult[];

  // آمار کلیدی داشبورد
  stats: {
    totalProperties: number;
    activeSaleProperties: number;
    activeRentProperties: number;
    totalSaleValue: number;
    totalClients: number;
    scheduledViewingsCount: number;
    totalDealsCount: number;
    totalCommissionIncome: number;
    totalDistricts: number;
  };
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROPERTIES: 'parsmelk_crm_properties_v1',
  CLIENTS: 'parsmelk_crm_clients_v1',
  VIEWINGS: 'parsmelk_crm_viewings_v1',
  CONTRACTS: 'parsmelk_crm_contracts_v1',
  AGENTS: 'parsmelk_crm_agents_v1',
  DISTRICTS: 'parsmelk_crm_districts_v1',
  LOGS: 'parsmelk_crm_logs_v1',
  AGENCY_SETTINGS: 'parsmelk_crm_agency_settings_v1',
  CURRENT_USER: 'parsmelk_crm_current_user_v1',
  DAILY_TASKS: 'parsmelk_crm_daily_tasks_v1',
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // بارگذاری داده‌ها از حافظه محلی یا بارگذاری پیش‌فرض
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
    } catch {
      return INITIAL_PROPERTIES;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [viewings, setViewings] = useState<ViewingAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEWINGS);
      return saved ? JSON.parse(saved) : INITIAL_VIEWINGS;
    } catch {
      return INITIAL_VIEWINGS;
    }
  });

  const [contracts, setContracts] = useState<DealContract[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
      return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
    } catch {
      return INITIAL_CONTRACTS;
    }
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENTS);
      return saved ? JSON.parse(saved) : INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  const [agencySettings, setAgencySettings] = useState<AgencySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENCY_SETTINGS);
      return saved ? { ...DEFAULT_AGENCY_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AGENCY_SETTINGS;
    } catch {
      return DEFAULT_AGENCY_SETTINGS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [districts, setDistricts] = useState<District[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISTRICTS);
      return saved ? JSON.parse(saved) : INITIAL_DISTRICTS;
    } catch {
      return INITIAL_DISTRICTS;
    }
  });

  // کاربر فعال و احراز هویت شده (پیش‌فرض: خانم سارا کریمی مشاور تخصصی)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      const defaultAgent = INITIAL_AGENTS.find((a) => a.id === 'agent-2') || INITIAL_AGENTS[0];
      return {
        id: defaultAgent.id,
        fullName: defaultAgent.fullName,
        phone: defaultAgent.phone,
        email: defaultAgent.email,
        role: defaultAgent.role,
        commissionRate: defaultAgent.commissionRate,
        agentId: defaultAgent.id,
      };
    } catch {
      return null;
    }
  });

  // کارهای روزانه و تقویم مشاوران
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS);
      return saved ? JSON.parse(saved) : INITIAL_DAILY_TASKS;
    } catch {
      return INITIAL_DAILY_TASKS;
    }
  });

  // ذخیره خودکار تغییرات در حافظه مرورگر
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEWINGS, JSON.stringify(viewings));
  }, [viewings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(districts));
  }, [districts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENCY_SETTINGS, JSON.stringify(agencySettings));
  }, [agencySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_TASKS, JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  // افزودن ملک جدید
  const addProperty = (
    data: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'createdAtJalali'>
  ) => {
    const newProperty: Property = {
      ...data,
      id: `prop-${Date.now()}`,
      createdAtJalali: getCurrentJalaliDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProperties((prev) => [newProperty, ...prev]);

    // ثبت لاگ فعالیت
    addActivityLog({
      propertyId: newProperty.id,
      propertyTitle: newProperty.title,
      agentName: newProperty.agentName,
      actionType: 'note',
      description: `فایل ملک جدید با کد ${newProperty.propertyCode} و متراژ ${newProperty.area} متر در محله ${newProperty.district} در سیستم ثبت شد.`,
    });
  };

  // ویرایش ملک
  const updateProperty = (id: string, updatedFields: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((prop) =>
        prop.id === id ? { ...prop, ...updatedFields, updatedAt: new Date().toISOString() } : prop
      )
    );
  };

  // حذف ملک
  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  // افزودن مشتری
  const addClient = (
    data: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdAtJalali'>
  ) => {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      createdAtJalali: getCurrentJalaliDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);

    addActivityLog({
      clientId: newClient.id,
      clientName: newClient.fullName,
      agentName: newClient.agentName || 'مشاور پذیرش',
      actionType: 'note',
      description: `مشتری جدید ${newClient.fullName} ثبت گردید و سرنخ ایجاد شد.`,
    });
  };

  // ویرایش مشتری
  const updateClient = (id: string, updatedFields: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id ? { ...client, ...updatedFields, updatedAt: new Date().toISOString() } : client
      )
    );
  };

  // حذف مشتری
  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  // افزودن مشاور جدید
  const addAgent = (data: Omit<Agent, 'id' | 'activePropertiesCount' | 'dealsCount' | 'totalVolume'>) => {
    const newAgent: Agent = {
      ...data,
      id: `agent-${Date.now()}`,
      activePropertiesCount: 0,
      dealsCount: 0,
      totalVolume: 0,
    };
    setAgents((prev) => [...prev, newAgent]);

    addActivityLog({
      agentName: 'مدیریت دفتر',
      actionType: 'note',
      description: `مشاور جدید «${newAgent.fullName}» با سهم پورسانت ${newAgent.commissionRate}٪ در سیستم ثبت شد.`,
    });
  };

  // ویرایش مشخصات مشاور
  const updateAgent = (id: string, updatedFields: Partial<Agent>) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a)));
  };

  // حذف مشاور
  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  // افزودن محله جدید
  const addDistrict = (data: Omit<District, 'id' | 'createdAtJalali'>) => {
    const newDistrict: District = {
      ...data,
      id: `dist-${Date.now()}`,
      createdAtJalali: getCurrentJalaliDate(),
    };
    setDistricts((prev) => [newDistrict, ...prev]);

    addActivityLog({
      agentName: 'مدیریت سامانه',
      actionType: 'note',
      description: `محله جدید «${newDistrict.name}» (منطقه ${newDistrict.municipalityZone} شهرداری) به بانک مناطق افزوده شد.`,
    });
  };

  // ویرایش مشخصات محله
  const updateDistrict = (id: string, updatedFields: Partial<District>) => {
    setDistricts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updatedFields } : d)));
  };

  // حذف محله
  const deleteDistrict = (id: string) => {
    setDistricts((prev) => prev.filter((d) => d.id !== id));
  };

  // به‌روزرسانی تنظیمات آژانس
  const updateAgencySettings = (settings: Partial<AgencySettings>) => {
    setAgencySettings((prev) => ({ ...prev, ...settings }));
  };

  const resetAgencySettings = () => {
    setAgencySettings(DEFAULT_AGENCY_SETTINGS);
  };

  // افزودن بازدید
  const addViewing = (data: Omit<ViewingAppointment, 'id' | 'createdAt'>) => {
    const newViewing: ViewingAppointment = {
      ...data,
      id: `view-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setViewings((prev) => [newViewing, ...prev]);

    addActivityLog({
      clientId: newViewing.clientId,
      clientName: newViewing.clientName,
      propertyId: newViewing.propertyId,
      propertyTitle: newViewing.propertyTitle,
      agentName: newViewing.agentName,
      actionType: 'meeting',
      description: `هماهنگی بازدید از ملک برای تاریخ ${newViewing.scheduledDateJalali} ساعت ${newViewing.scheduledTime} ثبت شد.`,
      followUpDateJalali: newViewing.scheduledDateJalali,
    });
  };

  // به‌روزرسانی وضعیت بازدید
  const updateViewingStatus = (id: string, status: ViewingStatus, feedback?: string) => {
    setViewings((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status, feedback: feedback || v.feedback } : v))
    );
  };

  // حذف بازدید
  const deleteViewing = (id: string) => {
    setViewings((prev) => prev.filter((v) => v.id !== id));
  };

  // ثبت قرارداد و مبایعه‌نامه
  const addContract = (data: Omit<DealContract, 'id' | 'createdAt'>) => {
    const newContract: DealContract = {
      ...data,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setContracts((prev) => [newContract, ...prev]);

    // به‌روزرسانی وضعیت فایل ملک به معامله شده
    updateProperty(newContract.propertyId, { status: 'DEAL_CLOSED' });

    // ثبت لاگ قرارداد
    addActivityLog({
      propertyId: newContract.propertyId,
      propertyTitle: newContract.propertyTitle,
      agentName: newContract.agentName,
      actionType: 'contract',
      description: `قرارداد شماره ${newContract.contractNumber} با ثمن معامله ${newContract.totalAmount.toLocaleString()} منعقد شد.`,
    });
  };

  // به‌روزرسانی وضعیت قرارداد
  const updateContractStatus = (id: string, status: ContractStatus) => {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // حذف قرارداد
  const deleteContract = (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  // ثبت یادداشت یا پیگیری
  const addActivityLog = (logData: Omit<ActivityLog, 'id' | 'createdAt' | 'createdAtJalali'>) => {
    const newLog: ActivityLog = {
      ...logData,
      id: `act-${Date.now()}`,
      createdAtJalali: getCurrentJalaliDate(),
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // عملیات احراز هویت
  const login = (phoneOrEmail: string, _password?: string): { success: boolean; message?: string } => {
    const clean = phoneOrEmail.trim().toLowerCase();
    const cleanDigits = clean.replace(/[^0-9]/g, '');
    const foundAgent = agents.find((a) => {
      const aPhoneClean = a.phone.replace(/[^0-9]/g, '');
      const matchPhone = cleanDigits && aPhoneClean && (aPhoneClean === cleanDigits || aPhoneClean.endsWith(cleanDigits) || cleanDigits.endsWith(aPhoneClean));
      const matchEmail = a.email && a.email.toLowerCase() === clean;
      return matchPhone || matchEmail;
    });

    if (foundAgent) {
      const user: AuthUser = {
        id: foundAgent.id,
        fullName: foundAgent.fullName,
        phone: foundAgent.phone,
        email: foundAgent.email,
        role: foundAgent.role,
        commissionRate: foundAgent.commissionRate,
        agentId: foundAgent.id,
      };
      setCurrentUser(user);
      return { success: true, message: `خوش آمدید، ${user.fullName}` };
    }

    return {
      success: false,
      message: 'کاربری با این مشخصات یافت نشد. می‌توانید با دکمه‌های سریع وارد شوید یا ثبت‌نام کنید.',
    };
  };

  const loginAsAgent = (agentId: string) => {
    const found = agents.find((a) => a.id === agentId);
    if (found) {
      const user: AuthUser = {
        id: found.id,
        fullName: found.fullName,
        phone: found.phone,
        email: found.email,
        role: found.role,
        commissionRate: found.commissionRate,
        agentId: found.id,
      };
      setCurrentUser(user);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const registerUser = (
    userData: Omit<AuthUser, 'id'>,
    _password?: string
  ): { success: boolean; message?: string } => {
    const newId = `agent-${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      fullName: userData.fullName,
      phone: userData.phone,
      email: userData.email,
      role: userData.role,
      commissionRate: userData.commissionRate || (userData.role === 'MANAGER' ? 50 : 40),
      activePropertiesCount: 0,
      dealsCount: 0,
      totalVolume: 0,
    };
    setAgents((prev) => [newAgent, ...prev]);

    const newUser: AuthUser = {
      ...userData,
      id: newId,
      agentId: newId,
    };
    setCurrentUser(newUser);
    return {
      success: true,
      message: `حساب کاربری جدید برای ${newUser.fullName} با نقش ${
        newUser.role === 'MANAGER' ? 'مدیر بنگاه' : 'مشاور'
      } با موفقیت ایجاد شد.`,
    };
  };

  // عملیات کارهای روزانه مشاور
  const addDailyTask = (
    taskData: Omit<DailyTask, 'id' | 'createdAt' | 'createdAtJalali'>
  ): DailyTask => {
    const newTask: DailyTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      agentId: taskData.agentId || currentUser?.id || 'agent-2',
      agentName: taskData.agentName || currentUser?.fullName || 'مشاور',
      createdAtJalali: getCurrentJalaliDate(),
      createdAt: new Date().toISOString(),
    };
    setDailyTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateDailyTask = (id: string, updates: Partial<DailyTask>) => {
    setDailyTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteDailyTask = (id: string) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setDailyTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  // بازیابی داده‌ها به نمونه پیش‌فرض
  const resetToDefaults = () => {
    setProperties(INITIAL_PROPERTIES);
    setClients(INITIAL_CLIENTS);
    setViewings(INITIAL_VIEWINGS);
    setContracts(INITIAL_CONTRACTS);
    setAgents(INITIAL_AGENTS);
    setDistricts(INITIAL_DISTRICTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setDailyTasks(INITIAL_DAILY_TASKS);
    setAgencySettings(DEFAULT_AGENCY_SETTINGS);
    const defaultAgent = INITIAL_AGENTS.find((a) => a.id === 'agent-2') || INITIAL_AGENTS[0];
    setCurrentUser({
      id: defaultAgent.id,
      fullName: defaultAgent.fullName,
      phone: defaultAgent.phone,
      email: defaultAgent.email,
      role: defaultAgent.role,
      commissionRate: defaultAgent.commissionRate,
      agentId: defaultAgent.id,
    });
    localStorage.clear();
  };

  // برون‌بری دیتابیس به صورت فایل JSON
  const exportDatabaseJson = () => {
    const data = {
      properties,
      clients,
      viewings,
      contracts,
      agents,
      districts,
      dailyTasks,
      activityLogs,
      agencySettings,
      exportedAt: new Date().toISOString(),
      version: '1.1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parsmelk_crm_backup_${getCurrentJalaliDate().replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // درون‌ریزی دیتابیس از فایل JSON
  const importDatabaseJson = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.properties && Array.isArray(parsed.properties)) {
        setProperties(parsed.properties);
      }
      if (parsed.clients && Array.isArray(parsed.clients)) {
        setClients(parsed.clients);
      }
      if (parsed.viewings && Array.isArray(parsed.viewings)) {
        setViewings(parsed.viewings);
      }
      if (parsed.contracts && Array.isArray(parsed.contracts)) {
        setContracts(parsed.contracts);
      }
      if (parsed.agents && Array.isArray(parsed.agents)) {
        setAgents(parsed.agents);
      }
      if (parsed.districts && Array.isArray(parsed.districts)) {
        setDistricts(parsed.districts);
      }
      if (parsed.dailyTasks && Array.isArray(parsed.dailyTasks)) {
        setDailyTasks(parsed.dailyTasks);
      }
      if (parsed.agencySettings && typeof parsed.agencySettings === 'object') {
        setAgencySettings(parsed.agencySettings);
      }
      return true;
    } catch {
      return false;
    }
  };

  // الگوریتم تطبیق هوشمند ملک با مشتری
  const findMatchesForClient = (client: Client): SmartMatchResult[] => {
    const results: SmartMatchResult[] = [];

    const isSaleBuyer = client.clientType === 'BUYER' || client.clientType === 'INVESTOR';
    const isTenant = client.clientType === 'TENANT';

    properties.forEach((prop) => {
      if (prop.status !== 'ACTIVE') return;

      // بررسی نوع معامله
      if (isSaleBuyer && prop.transactionType !== 'SALE') return;
      if (isTenant && prop.transactionType !== 'RENT') return;

      let score = 40; // پایه تطبیق
      const reasons: string[] = [];

      // تطبیق محله
      if (client.preferredDistricts && client.preferredDistricts.length > 0) {
        const matchesDistrict = client.preferredDistricts.some((d) =>
          prop.district.includes(d) || d.includes(prop.district)
        );
        if (matchesDistrict) {
          score += 25;
          reasons.push(`تطبیق کامل محله (${prop.district})`);
        }
      }

      // تطبیق بودجه خرید
      if (isSaleBuyer && prop.priceTotal) {
        const max = client.budgetMax || Infinity;
        const min = client.budgetMin || 0;
        if (prop.priceTotal >= min * 0.9 && prop.priceTotal <= max * 1.1) {
          score += 20;
          reasons.push('قیمت ملک در بازه بودجه متقاضی قرار دارد');
        }
      }

      // تطبیق بودجه رهن و اجاره
      if (isTenant && prop.deposit) {
        const max = client.budgetMax || Infinity;
        if (prop.deposit <= max * 1.15) {
          score += 20;
          reasons.push('ودیعه در محدوده بودجه مستاجر است');
        }
      }

      // تطبیق متراژ
      if (client.preferredMinArea && prop.area >= client.preferredMinArea) {
        score += 10;
        reasons.push(`متراژ مطلوب (${prop.area} متر)`);
      }

      // تطبیق تعداد خواب
      if (client.preferredRooms && prop.rooms >= client.preferredRooms) {
        score += 5;
        reasons.push(`تعداد خواب منطبق (${prop.rooms} خواب)`);
      }

      if (score >= 50) {
        results.push({
          client,
          property: prop,
          score: Math.min(score, 100),
          matchReasons: reasons,
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  };

  // الگوریتم تطبیق هوشمند مشتریان بالقوه برای یک ملک مشخص
  const findMatchesForProperty = (property: Property): SmartMatchResult[] => {
    const results: SmartMatchResult[] = [];
    clients.forEach((client) => {
      const clientMatches = findMatchesForClient(client);
      const matched = clientMatches.find((m) => m.property.id === property.id);
      if (matched) {
        results.push(matched);
      }
    });
    return results.sort((a, b) => b.score - a.score);
  };

  // محاسبات آمار کلیدی داشبورد
  const stats = useMemo(() => {
    const activeSaleProperties = properties.filter(
      (p) => p.status === 'ACTIVE' && p.transactionType === 'SALE'
    ).length;

    const activeRentProperties = properties.filter(
      (p) => p.status === 'ACTIVE' && p.transactionType === 'RENT'
    ).length;

    const totalSaleValue = properties
      .filter((p) => p.status === 'ACTIVE' && p.transactionType === 'SALE' && p.priceTotal)
      .reduce((sum, p) => sum + (p.priceTotal || 0), 0);

    const totalClients = clients.length;

    const scheduledViewingsCount = viewings.filter((v) => v.status === 'SCHEDULED').length;

    const totalDealsCount = contracts.length;

    const totalCommissionIncome = contracts.reduce((sum, c) => sum + (c.totalCommission || 0), 0);

    return {
      totalProperties: properties.length,
      activeSaleProperties,
      activeRentProperties,
      totalSaleValue,
      totalClients,
      scheduledViewingsCount,
      totalDealsCount,
      totalCommissionIncome,
      totalDistricts: districts.length,
    };
  }, [properties, clients, viewings, contracts, districts]);

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        login,
        loginAsAgent,
        logout,
        registerUser,
        dailyTasks,
        addDailyTask,
        updateDailyTask,
        deleteDailyTask,
        toggleTaskStatus,
        properties,
        clients,
        viewings,
        contracts,
        agents,
        districts,
        activityLogs,
        agencySettings,
        addProperty,
        updateProperty,
        deleteProperty,
        addClient,
        updateClient,
        deleteClient,
        addAgent,
        updateAgent,
        deleteAgent,
        addDistrict,
        updateDistrict,
        deleteDistrict,
        updateAgencySettings,
        resetAgencySettings,
        addViewing,
        updateViewingStatus,
        deleteViewing,
        addContract,
        updateContractStatus,
        deleteContract,
        addActivityLog,
        resetToDefaults,
        exportDatabaseJson,
        importDatabaseJson,
        findMatchesForClient,
        findMatchesForProperty,
        stats,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
