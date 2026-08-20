
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Award, Briefcase, Camera, Save, X, Plus, Trash2 } from '../common/Icons';

interface AwardItem {
  id: number;
  title: string;
  date: string;
  type: 'yellow' | 'purple' | 'blue' | 'green';
}

interface UserProfileData {
  name: string;
  title: string;
  about: string;
  email: string;
  phone: string;
  location: string;
  employeeId: string;
  awards: AwardItem[];
}

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    name: 'Ms. Sarah',
    title: 'Senior College Counselor • International Dept.',
    about: '拥有 8 年国际升学指导经验，专注于美本 Top 30 及英国 G5 申请。擅长挖掘学生个性化亮点与文书辅导。',
    email: 'sarah.counselor@school.edu',
    phone: '+86 138-0000-0000',
    location: 'Office 302, Building A',
    employeeId: 'T-2018005',
    awards: [
      { id: 1, title: 'NACAC Member', date: 'Since 2019', type: 'yellow' },
      { id: 2, title: "School 'Counselor of the Year'", date: '2022, 2023', type: 'purple' }
    ]
  });

  const [formData, setFormData] = useState<UserProfileData>(profile);

  const handleEditClick = () => {
    setFormData(JSON.parse(JSON.stringify(profile))); // Deep copy for nested arrays
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    // Filter out empty awards if needed, or just save as is
    const cleanedData = {
        ...formData,
        awards: formData.awards.filter(a => a.title.trim() !== '')
    };
    setProfile(cleanedData);
    setIsEditing(false);
  };

  const handleChange = (field: keyof UserProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Award Handlers ---
  const handleAddAward = () => {
    const types: AwardItem['type'][] = ['yellow', 'purple', 'blue', 'green'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newAward: AwardItem = {
        id: Date.now(),
        title: '',
        date: '',
        type: randomType
    };
    setFormData(prev => ({
        ...prev,
        awards: [...prev.awards, newAward]
    }));
  };

  const handleUpdateAward = (id: number, field: keyof AwardItem, value: string) => {
    setFormData(prev => ({
        ...prev,
        awards: prev.awards.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const handleDeleteAward = (id: number) => {
    setFormData(prev => ({
        ...prev,
        awards: prev.awards.filter(a => a.id !== id)
    }));
  };

  const getAwardColor = (type: string) => {
      switch(type) {
          case 'purple': return { bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' };
          case 'blue': return { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' };
          case 'green': return { bg: 'bg-green-100 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400' };
          default: return { bg: 'bg-yellow-100 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' };
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Banner */}
      <div className="relative group">
        <div className="h-48 rounded-2xl bg-gradient-to-r from-[#b0826d] to-[#966a57] dark:from-[#7d5646] dark:to-[#553c35] overflow-hidden shadow-sm relative">
            <div className="absolute bottom-0 left-0 w-full h-full bg-black/10 dark:bg-black/30"></div>
        </div>
        <div className="absolute -bottom-12 left-8">
           <div className="w-24 h-24 rounded-full border-4 border-[#f9f8f6] dark:border-zinc-950 bg-white dark:bg-zinc-900 flex items-center justify-center text-3xl font-bold text-primary-700 dark:text-primary-400 shadow-lg relative overflow-hidden transition-colors">
              {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer text-white hover:bg-black/60 transition-colors">
                      <Camera className="w-6 h-6" />
                  </div>
              )}
              S
           </div>
        </div>
      </div>
      
      <div className="pt-10 px-2 flex justify-between items-start">
         <div className="flex-1 mr-8">
            {isEditing ? (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <input 
                        className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-300 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent w-full pb-1 transition-colors"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="姓名"
                    />
                    <input 
                        className="text-gray-500 dark:text-zinc-400 border-b border-gray-300 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent w-full text-sm pb-1 transition-colors"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="职位 / 部门"
                    />
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                    <p className="text-gray-500 dark:text-zinc-400">{profile.title}</p>
                </>
            )}
         </div>
         
         <div className="flex gap-2">
            {isEditing ? (
                <>
                    <button 
                       onClick={handleCancel}
                       className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-colors flex items-center gap-2"
                    >
                       <X className="w-4 h-4" /> 取消
                    </button>
                    <button 
                       onClick={handleSave}
                       className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm transition-colors flex items-center gap-2"
                    >
                       <Save className="w-4 h-4" /> 保存
                    </button>
                </>
            ) : (
                <button 
                   onClick={handleEditClick}
                   className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-colors"
                >
                   编辑资料
                </button>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left: Info */}
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 space-y-6 transition-colors">
            <div>
               <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600 dark:text-primary-400" /> 关于我
               </h3>
               {isEditing ? (
                   <textarea 
                       className="w-full text-sm text-gray-600 dark:text-zinc-300 leading-relaxed border border-gray-200 dark:border-zinc-700 rounded-lg p-3 focus:border-primary-500 outline-none min-h-[120px] resize-none bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                       value={formData.about}
                       onChange={(e) => handleChange('about', e.target.value)}
                   />
               ) : (
                   <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                      {profile.about}
                   </p>
               )}
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" /> 
                  {isEditing ? (
                      <input 
                          className="flex-1 border-b border-gray-200 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent py-0.5"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                      />
                  ) : <span className="truncate">{profile.email}</span>}
               </div>
               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" /> 
                  {isEditing ? (
                      <input 
                          className="flex-1 border-b border-gray-200 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent py-0.5"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                      />
                  ) : profile.phone}
               </div>
               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" /> 
                  {isEditing ? (
                      <input 
                          className="flex-1 border-b border-gray-200 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent py-0.5"
                          value={formData.location}
                          onChange={(e) => handleChange('location', e.target.value)}
                      />
                  ) : profile.location}
               </div>
               <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                  <Briefcase className="w-4 h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" /> 
                  {isEditing ? (
                      <input 
                          className="flex-1 border-b border-gray-200 dark:border-zinc-700 focus:border-primary-500 outline-none bg-transparent py-0.5"
                          value={formData.employeeId}
                          onChange={(e) => handleChange('employeeId', e.target.value)}
                      />
                  ) : profile.employeeId}
               </div>
            </div>
         </div>

         {/* Right: Stats & Achievements */}
         <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 text-center transition-colors">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 font-bold uppercase mb-1">本届负责学生</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">45</p>
               </div>
               <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-[#e5e0dc] dark:border-white/5 text-center transition-colors">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 font-bold uppercase mb-1">累计 Offer</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">320+</p>
               </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-colors">
               <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-600 dark:text-primary-400" /> 专业认证 & 奖项
               </h3>
               <div className="space-y-3">
                  {formData.awards.map((award) => {
                      const colors = getAwardColor(award.type);
                      return (
                        <div key={award.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-white/5 relative group transition-all hover:border-primary-200 dark:hover:border-primary-500/30">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                                <Award className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="space-y-1">
                                        <input 
                                            className="w-full text-sm font-bold text-gray-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 focus:border-primary-500 outline-none transition-colors"
                                            value={award.title}
                                            onChange={(e) => handleUpdateAward(award.id, 'title', e.target.value)}
                                            placeholder="奖项名称"
                                        />
                                        <input 
                                            className="w-full text-xs text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 focus:border-primary-500 outline-none transition-colors"
                                            value={award.date}
                                            onChange={(e) => handleUpdateAward(award.id, 'date', e.target.value)}
                                            placeholder="获奖时间"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate">{award.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-500">{award.date}</p>
                                    </>
                                )}
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={() => handleDeleteAward(award.id)}
                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                      );
                  })}
                  
                  {isEditing && (
                      <button 
                        onClick={handleAddAward}
                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg text-gray-400 dark:text-zinc-500 text-xs font-bold hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all flex items-center justify-center gap-1 group"
                      >
                          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> 添加新奖项
                      </button>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserProfile;
