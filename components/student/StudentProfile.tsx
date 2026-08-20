
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, X, GraduationCap } from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface StudentProfileData {
  name: string;
  grade: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  studentId: string;
}

const StudentProfile = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<StudentProfileData>({
    name: 'Alex Chen',
    grade: 'Grade 11 • Class 3',
    bio: isEn 
      ? 'Aspiring Computer Scientist with a passion for robotics and AI. Loves building Legos and solving complex problems.' 
      : '致力于成为计算机科学家的 G11 学生。热爱机器人与 AI，擅长乐高搭建与复杂问题求解。',
    email: 'alex.c@student.nut.edu',
    phone: '+86 139-0000-0000',
    location: 'Dorm Building B, Room 402',
    studentId: '2025001'
  });

  const [formData, setFormData] = useState<StudentProfileData>(profile);

  const handleEditClick = () => {
    setFormData(JSON.parse(JSON.stringify(profile)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(formData);
    setIsEditing(false);
  };

  const handleChange = (field: keyof StudentProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header / Banner */}
      <div className="relative group">
        <div className="h-48 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 overflow-hidden shadow-md relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        <div className="absolute -bottom-12 left-8">
           <div className="w-24 h-24 rounded-full border-4 border-[#f9f8f6] dark:border-zinc-950 bg-white dark:bg-zinc-900 flex items-center justify-center text-3xl font-bold text-violet-600 dark:text-violet-400 shadow-xl relative overflow-hidden transition-colors">
              {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer text-white hover:bg-black/60 transition-colors z-10">
                      <Camera className="w-6 h-6" />
                  </div>
              )}
              A
           </div>
        </div>
      </div>
      
      <div className="pt-12 px-2 flex flex-col md:flex-row justify-between items-start gap-4">
         <div className="flex-1">
            {isEditing ? (
                <div className="space-y-2 w-full md:w-96 animate-in fade-in duration-300">
                    <input 
                        className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-300 dark:border-zinc-700 focus:border-violet-500 outline-none bg-transparent w-full pb-1 transition-colors"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Name"
                    />
                    <input 
                        className="text-gray-500 dark:text-zinc-400 border-b border-gray-300 dark:border-zinc-700 focus:border-violet-500 outline-none bg-transparent w-full text-sm pb-1 transition-colors"
                        value={formData.grade}
                        onChange={(e) => handleChange('grade', e.target.value)}
                        placeholder="Grade / Class"
                    />
                </div>
            ) : (
                <>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">{profile.name}</h1>
                    <p className="text-gray-500 dark:text-zinc-400 font-medium">{profile.grade}</p>
                </>
            )}
         </div>
         
         <div className="flex gap-2">
            {isEditing ? (
                <>
                    <button 
                       onClick={handleCancel}
                       className="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-colors flex items-center gap-2"
                    >
                       <X className="w-4 h-4" /> {isEn ? 'Cancel' : '取消'}
                    </button>
                    <button 
                       onClick={handleSave}
                       className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-500/20 transition-colors flex items-center gap-2"
                    >
                       <Save className="w-4 h-4" /> {isEn ? 'Save' : '保存'}
                    </button>
                </>
            ) : (
                <button 
                   onClick={handleEditClick}
                   className="px-6 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-colors"
                >
                   {isEn ? 'Edit Profile' : '编辑资料'}
                </button>
            )}
         </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Bio Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-colors">
           <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-600 dark:text-violet-400" /> {isEn ? 'About Me' : '关于我'}
           </h3>
           {isEditing ? (
               <textarea 
                   className="w-full text-sm text-gray-600 dark:text-zinc-300 leading-relaxed border border-gray-200 dark:border-zinc-700 rounded-xl p-3 focus:border-violet-500 outline-none min-h-[100px] resize-none bg-gray-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-colors"
                   value={formData.bio}
                   onChange={(e) => handleChange('bio', e.target.value)}
               />
           ) : (
               <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-serif italic">
                  "{profile.bio}"
               </p>
           )}
        </div>

        {/* Contact Details */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-[#e5e0dc] dark:border-white/5 transition-colors">
           <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4">{isEn ? 'Contact Info' : '联系信息'}</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="space-y-1">
                 <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-1"><Mail className="w-3 h-3"/> Email</span>
                 {isEditing ? (
                    <input className="w-full border-b border-gray-200 dark:border-zinc-700 bg-transparent text-sm py-1 focus:border-violet-500 outline-none" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                 ) : <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{profile.email}</p>}
              </div>
              <div className="space-y-1">
                 <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</span>
                 {isEditing ? (
                    <input className="w-full border-b border-gray-200 dark:border-zinc-700 bg-transparent text-sm py-1 focus:border-violet-500 outline-none" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                 ) : <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{profile.phone}</p>}
              </div>
              <div className="space-y-1">
                 <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</span>
                 {isEditing ? (
                    <input className="w-full border-b border-gray-200 dark:border-zinc-700 bg-transparent text-sm py-1 focus:border-violet-500 outline-none" value={formData.location} onChange={e => handleChange('location', e.target.value)} />
                 ) : <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{profile.location}</p>}
              </div>
              <div className="space-y-1">
                 <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Student ID</span>
                 {isEditing ? (
                    <input className="w-full border-b border-gray-200 dark:border-zinc-700 bg-transparent text-sm py-1 focus:border-violet-500 outline-none" value={formData.studentId} onChange={e => handleChange('studentId', e.target.value)} />
                 ) : <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 font-mono">{profile.studentId}</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
