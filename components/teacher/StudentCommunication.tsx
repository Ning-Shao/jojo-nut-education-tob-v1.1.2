
import React, { useState } from 'react';
import { 
  MessageCircle, Phone, Mail, Users, Calendar, Plus, 
  Search, Filter, X, Sparkles, Loader2, Check, Clock, User,
  MoreHorizontal, Trash2, Edit
} from '../common/Icons';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../contexts/LanguageContext';

interface Log {
  id: string;
  type: 'Meeting' | 'Call' | 'Email' | 'WeChat';
  title: string;
  date: string;
  content: string; // Markdown or plain text
  participants: string[]; 
  tags: string[];
}

const INITIAL_LOGS: Log[] = [
  {
    id: '1',
    type: 'Meeting',
    title: 'G11 选课与暑期规划面谈',
    date: '2024-10-15 14:00',
    content: '**核心议题**：\n1. 确认 G11 下学期选课（增加 AP Psych）。\n2. 讨论暑期夏校申请策略（主申 Cornell SC）。\n\n**下一步**：\n- 学生：下周五前提交夏校文书初稿。\n- 家长：确认暑期预算。',
    participants: ['Student', 'Mom', 'Counselor'],
    tags: ['Planning', 'Important']
  },
  {
    id: '2',
    type: 'Call',
    title: '紧急：托福成绩沟通',
    date: '2024-10-10 19:30',
    content: '家长来电询问最新托福出分情况 (92分)。安抚家长焦虑，建议增加口语单项训练。',
    participants: ['Mom', 'Counselor'],
    tags: ['Urgent', 'Test Prep']
  },
  {
    id: '3',
    type: 'Email',
    title: '文书头脑风暴反馈',
    date: '2024-09-28 09:15',
    content: '已发送 PS 初稿批注。建议从“乐高搭建”这个点切入，不要写成流水账。',
    participants: ['Student', 'Counselor'],
    tags: ['Essay']
  }
];

const StudentCommunication: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const [logs, setLogs] = useState<Log[]>(INITIAL_LOGS);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [newLog, setNewLog] = useState<Partial<Log>>({
    type: 'Meeting',
    date: new Date().toISOString().slice(0, 16),
    participants: ['Student', 'Counselor'],
    tags: [],
    content: ''
  });

  // --- Helpers ---
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Meeting': return <Users className="w-4 h-4 text-purple-600" />;
      case 'Call': return <Phone className="w-4 h-4 text-green-600" />;
      case 'Email': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'WeChat': return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Meeting': return 'bg-purple-50 border-purple-100 text-purple-700';
      case 'Call': return 'bg-green-50 border-green-100 text-green-700';
      case 'Email': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'WeChat': return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      default: return 'bg-gray-50 border-gray-100 text-gray-700';
    }
  };

  // --- Handlers ---
  const handleSaveLog = () => {
    if (!newLog.title || !newLog.content) return;
    const log: Log = {
      id: Date.now().toString(),
      type: newLog.type as any,
      title: newLog.title!,
      date: newLog.date!,
      content: newLog.content!,
      participants: newLog.participants!,
      tags: newLog.tags!
    };
    setLogs([log, ...logs]);
    setIsModalOpen(false);
    // Reset form
    setNewLog({
      type: 'Meeting',
      date: new Date().toISOString().slice(0, 16),
      participants: ['Student', 'Counselor'],
      tags: [],
      content: ''
    });
  };

  const handleDeleteLog = (id: string) => {
    if (confirm(isEn ? 'Are you sure you want to delete this log?' : '确认删除这条记录吗？')) {
      setLogs(logs.filter(l => l.id !== id));
    }
  };

  const handleAiOrganize = async () => {
    if (!newLog.content?.trim()) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Role: Professional Secretary.
        Task: Organize the following raw meeting notes into a structured summary.
        Raw Notes: "${newLog.content}"
        
        Requirements:
        1. Summarize "Core Topics".
        2. Extract "Action Items".
        3. Keep it concise and professional.
        4. Use Markdown formatting (bold, bullet points).
        5. Language: ${isEn ? 'English' : 'Simplified Chinese'}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      if (response.text) {
        setNewLog({ ...newLog, content: response.text });
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert(isEn ? "AI Organization failed" : "AI 整理失败，请稍后重试");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'All' || log.type === filterType;
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#f9f8f6] relative animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
           {isEn ? 'Communication Logs' : '沟通记录'}
        </h3>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm transition-colors"
        >
           <Plus className="w-4 h-4" /> {isEn ? 'New Log' : '新增记录'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-[#e5e0dc] shadow-sm mb-6 flex items-center justify-between">
         <div className="flex gap-2">
            {['All', 'Meeting', 'Call', 'Email', 'WeChat'].map(type => (
               <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                     ${filterType === type 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}
                  `}
               >
                  {type === 'All' ? (isEn ? 'All' : '全部') : type}
               </button>
            ))}
         </div>
         <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
               className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary-400 w-48 transition-all"
               placeholder={isEn ? "Search logs..." : "搜索记录..."}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 relative">
         {/* Vertical Line */}
         <div className="absolute left-[23px] top-4 bottom-0 w-0.5 bg-gray-200"></div>

         <div className="space-y-6">
            {filteredLogs.map((log) => (
               <div key={log.id} className="relative pl-12 group">
                  {/* Timeline Dot */}
                  <div className={`absolute left-3 top-4 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 bg-white`}>
                     {getTypeIcon(log.type)}
                  </div>

                  {/* Card */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all">
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getTypeColor(log.type)}`}>
                              {log.type}
                           </span>
                           <h4 className="font-bold text-gray-800 text-sm">{log.title}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {log.date.replace('T', ' ')}
                           </span>
                           <button onClick={() => handleDeleteLog(log.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-sans mb-4 pl-1 border-l-2 border-gray-100">
                        {log.content}
                     </div>

                     <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                           <Users className="w-3.5 h-3.5" />
                           {log.participants.join(', ')}
                        </div>
                        {log.tags.length > 0 && (
                           <div className="flex gap-2">
                              {log.tags.map(t => (
                                 <span key={t} className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            ))}
            
            {filteredLogs.length === 0 && (
               <div className="text-center py-12 text-gray-400 text-sm pl-12">
                  {isEn ? 'No logs found' : '暂无相关沟通记录'}
               </div>
            )}
         </div>
      </div>

      {/* --- Create Modal --- */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Edit className="w-4 h-4 text-primary-600" /> {isEn ? 'New Log' : '新增沟通记录'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Type' : '类型'}</label>
                        <select 
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary-500"
                           value={newLog.type}
                           onChange={(e) => setNewLog({...newLog, type: e.target.value as any})}
                        >
                           <option value="Meeting">Meeting (面谈)</option>
                           <option value="Call">Call (通话)</option>
                           <option value="Email">Email (邮件)</option>
                           <option value="WeChat">WeChat (微信)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Time' : '时间'}</label>
                        <input 
                           type="datetime-local"
                           className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary-500"
                           value={newLog.date}
                           onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Subject' : '主题摘要'}</label>
                     <input 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary-500 placeholder:text-gray-400"
                        placeholder={isEn ? "e.g., G11 Course Selection..." : "例如：G11 选课确认..."}
                        value={newLog.title}
                        onChange={(e) => setNewLog({...newLog, title: e.target.value})}
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{isEn ? 'Participants' : '参与人'}</label>
                     <div className="flex flex-wrap gap-2">
                        {['Student', 'Mom', 'Dad', 'Counselor', 'Tutor'].map(p => (
                           <button
                              key={p}
                              onClick={() => {
                                 const current = newLog.participants || [];
                                 const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                                 setNewLog({...newLog, participants: next});
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors
                                 ${newLog.participants?.includes(p) 
                                    ? 'bg-primary-50 border-primary-200 text-primary-700' 
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}
                              `}
                           >
                              {p}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-end mb-1.5">
                        <label className="block text-xs font-bold text-gray-500 uppercase">{isEn ? 'Details / Minutes' : '详细记录 / 纪要'}</label>
                        <button 
                           onClick={handleAiOrganize}
                           disabled={isAiProcessing || !newLog.content}
                           className="text-[10px] flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 hover:bg-purple-100 transition-colors disabled:opacity-50"
                        >
                           {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                           {isEn ? 'AI Organize' : 'AI 整理纪要'}
                        </button>
                     </div>
                     <textarea 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-primary-500 min-h-[150px] resize-none placeholder:text-gray-400"
                        placeholder={isEn ? "Enter notes here..." : "在此输入沟通流水账，点击上方 AI 按钮自动整理格式..."}
                        value={newLog.content}
                        onChange={(e) => setNewLog({...newLog, content: e.target.value})}
                     />
                  </div>
               </div>

               <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button 
                     onClick={() => setIsModalOpen(false)}
                     className="px-4 py-2 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                  >
                     {isEn ? 'Cancel' : '取消'}
                  </button>
                  <button 
                     onClick={handleSaveLog}
                     disabled={!newLog.title || !newLog.content}
                     className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50"
                  >
                     {isEn ? 'Save' : '保存记录'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default StudentCommunication;
