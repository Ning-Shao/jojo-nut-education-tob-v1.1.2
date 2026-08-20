
import React, { useState, useEffect } from 'react';
import { Settings, Bell, Lock, Globe, Moon, Sun, Monitor, Save } from '../common/Icons';
import { useLanguage, Language } from '../../contexts/LanguageContext';

type ThemeMode = 'light' | 'dark' | 'system';

const translations = {
  'zh-CN': {
    title: '账户设置',
    tabs: {
      general: '通用设置',
      notifications: '消息提醒',
      security: '安全与登录'
    },
    general: {
      title: '界面偏好',
      language: {
        label: '系统语言',
        desc: '选择您偏好的界面语言',
        options: {
          zh: '简体中文',
          en: 'English'
        }
      },
      theme: {
        label: '外观主题',
        desc: '切换深色或浅色模式',
        options: {
          light: '浅色',
          dark: '深色',
          system: '跟随系统'
        }
      }
    },
    notifications: {
      title: '邮件与应用通知',
      items: ['任务截止提醒 (Deadlines)', '顾问反馈通知', '新任务分配提醒', '院校动态更新']
    },
    security: {
      title: '修改密码',
      current: '当前密码',
      new: '新密码',
      submit: '更新密码'
    }
  },
  'en-US': {
    title: 'Settings',
    tabs: {
      general: 'General',
      notifications: 'Notifications',
      security: 'Security'
    },
    general: {
      title: 'Interface Preferences',
      language: {
        label: 'System Language',
        desc: 'Select your preferred interface language',
        options: {
          zh: '简体中文',
          en: 'English'
        }
      },
      theme: {
        label: 'Appearance',
        desc: 'Toggle dark or light mode',
        options: {
          light: 'Light',
          dark: 'Dark',
          system: 'System'
        }
      }
    },
    notifications: {
      title: 'Email & App Notifications',
      items: ['Task Deadline Alerts', 'Counselor Feedback', 'New Task Assignments', 'School Updates']
    },
    security: {
      title: 'Change Password',
      current: 'Current Password',
      new: 'New Password',
      submit: 'Update Password'
    }
  }
};

const StudentSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    // Load persisted theme or default to system
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    } else {
      setThemeMode('system');
      applyTheme('system');
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else if (mode === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('theme', mode);
    applyTheme(mode);
  };

  const t = translations[language];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 overflow-hidden flex min-h-[600px] animate-in fade-in zoom-in-95 duration-300">
       {/* Sidebar */}
       <div className="w-64 bg-gray-50 dark:bg-zinc-900/50 border-r border-[#e5e0dc] dark:border-white/5 p-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-6 px-2">{t.title}</h2>
          <nav className="space-y-1">
             {[
               { id: 'general', label: t.tabs.general, icon: <Settings className="w-4 h-4"/> },
               { id: 'notifications', label: t.tabs.notifications, icon: <Bell className="w-4 h-4"/> },
               { id: 'security', label: t.tabs.security, icon: <Lock className="w-4 h-4"/> },
             ].map(item => (
                <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                      ${activeTab === item.id 
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 shadow-sm border border-violet-100 dark:border-violet-500/20' 
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50'}
                   `}
                >
                   {item.icon}
                   {item.label}
                </button>
             ))}
          </nav>
       </div>

       {/* Content */}
       <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-zinc-900">
          {activeTab === 'general' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.general.title}</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"><Globe className="w-4 h-4 text-gray-600 dark:text-zinc-300" /></div>
                            <div>
                               <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{t.general.language.label}</p>
                               <p className="text-xs text-gray-500 dark:text-zinc-500">{t.general.language.desc}</p>
                            </div>
                         </div>
                         <select 
                            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-violet-100 text-gray-800 dark:text-zinc-200 cursor-pointer transition-all"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as Language)}
                         >
                            <option value="zh-CN">{t.general.language.options.zh}</option>
                            <option value="en-US">{t.general.language.options.en}</option>
                         </select>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"><Moon className="w-4 h-4 text-gray-600 dark:text-zinc-300" /></div>
                            <div>
                               <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{t.general.theme.label}</p>
                               <p className="text-xs text-gray-500 dark:text-zinc-500">{t.general.theme.desc}</p>
                            </div>
                         </div>
                         
                         {/* 3-State Theme Toggle */}
                         <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-white/5">
                            <button 
                               onClick={() => handleThemeChange('light')}
                               className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${themeMode === 'light' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                            >
                               <Sun className="w-3.5 h-3.5" /> {t.general.theme.options.light}
                            </button>
                            <button 
                               onClick={() => handleThemeChange('dark')}
                               className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${themeMode === 'dark' ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                            >
                               <Moon className="w-3.5 h-3.5" /> {t.general.theme.options.dark}
                            </button>
                            <button 
                               onClick={() => handleThemeChange('system')}
                               className={`p-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${themeMode === 'system' ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                            >
                               <Monitor className="w-3.5 h-3.5" /> {t.general.theme.options.system}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'notifications' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.notifications.title}</h3>
                   <div className="space-y-3">
                      {t.notifications.items.map((label, i) => (
                         <label key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">{label}</span>
                            <input type="checkbox" defaultChecked={true} className="w-4 h-4 text-violet-600 rounded border-gray-300 dark:border-zinc-600 focus:ring-violet-500 dark:bg-zinc-700 transition-all" />
                         </label>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.security.title}</h3>
                   <div className="space-y-4 max-w-md">
                      <div>
                         <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1">{t.security.current}</label>
                         <input type="password" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-violet-500 text-gray-800 dark:text-white focus:bg-white dark:focus:bg-zinc-900 transition-all" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1">{t.security.new}</label>
                         <input type="password" className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-violet-500 text-gray-800 dark:text-white focus:bg-white dark:focus:bg-zinc-900 transition-all" />
                      </div>
                      <button className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-500/20 flex items-center gap-2 transition-all">
                         <Save className="w-4 h-4" /> {t.security.submit}
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

export default StudentSettings;
