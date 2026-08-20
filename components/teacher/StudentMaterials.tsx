
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  FolderOpen, Award, Layers, FileBadge, Share2, Briefcase, 
  FileText, Folder, Upload, ChevronRight, Filter, List, LayoutGrid,
  Image as ImageIcon, File as FileIcon, Eye, Download, Trash2, X, MoreHorizontal, Check, User
} from '../common/Icons';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Types ---
export interface MaterialCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  bg: string;
  textColor: string;
}

export interface FileItem {
  id: string;
  name: string;
  category: string;
  date: string; // YYYY-MM-DD
  size: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  uploader: 'Teacher' | 'Student';
}

// --- Mock Data ---
export const INITIAL_CATEGORIES: MaterialCategory[] = [
  { id: 'transcript', name: '学校成绩单', nameEn: 'School Transcript', icon: <FileText className="w-5 h-5" />, bg: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'alevel', name: 'Alevel官考成绩单', nameEn: 'A-Level Results', icon: <FileText className="w-5 h-5" />, bg: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'certs', name: '证书与奖状', nameEn: 'Certificates', icon: <Award className="w-5 h-5" />, bg: 'bg-yellow-50', textColor: 'text-yellow-600' },
  { id: 'portfolios', name: '作品集', nameEn: 'Portfolios', icon: <Layers className="w-5 h-5" />, bg: 'bg-purple-50', textColor: 'text-purple-600' },
  { id: 'activities', name: '活动证明', nameEn: 'Activity Proofs', icon: <FileBadge className="w-5 h-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
  { id: 'research', name: '科研论文', nameEn: 'Research Papers', icon: <FileText className="w-5 h-5" />, bg: 'bg-teal-50', textColor: 'text-teal-600' },
  { id: 'others', name: '其他材料', nameEn: 'Others', icon: <Folder className="w-5 h-5" />, bg: 'bg-gray-50', textColor: 'text-gray-600' },
];

export const INITIAL_FILES: FileItem[] = [
  { id: '0', name: 'School_Transcript_G10.pdf', category: 'transcript', date: '2024-06-15', size: '2.8MB', type: 'pdf', uploader: 'Teacher' },
  { id: '1', name: 'AMC_12_Certificate.pdf', category: 'certs', date: '2024-05-12', size: '1.2MB', type: 'pdf', uploader: 'Student' },
  { id: '2', name: 'Robotics_Club_Award.jpg', category: 'certs', date: '2024-06-01', size: '2.4MB', type: 'image', uploader: 'Student' },
  { id: '3', name: 'Portfolio_V2.pdf', category: 'portfolios', date: '2024-09-10', size: '15.6MB', type: 'pdf', uploader: 'Teacher' },
  { id: '4', name: 'Research_Paper_Draft.docx', category: 'research', date: '2024-08-20', size: '0.8MB', type: 'doc', uploader: 'Student' },
  { id: '5', name: 'A_Level_Official_Results.pdf', category: 'alevel', date: '2024-07-15', size: '0.5MB', type: 'pdf', uploader: 'Student' },
];

interface StudentMaterialsProps {
  files?: FileItem[];
  onUpdateFiles?: (files: FileItem[]) => void;
  initialCategory?: string;
}

const StudentMaterials: React.FC<StudentMaterialsProps> = ({ files: propFiles, onUpdateFiles, initialCategory = 'transcript' }) => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';

  // --- State ---
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  
  React.useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);
  // Use props if available, otherwise internal state
  const [localFiles, setLocalFiles] = useState<FileItem[]>(INITIAL_FILES);
  
  const files = propFiles || localFiles;
  const setFiles = onUpdateFiles || setLocalFiles;

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Helpers ---
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'image': return <ImageIcon className="w-6 h-6 text-purple-500" />;
      case 'doc': return <FileText className="w-6 h-6 text-blue-500" />;
      default: return <FileIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getFilteredFiles = () => {
    let filtered = files.filter(f => f.category === activeCategory);
    
    // Sort
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOrder === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        setUploadFileName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          setSelectedFile(file);
          setUploadFileName(file.name);
      }
  };

  const handleUpload = () => {
    if (!uploadFileName || !uploadCategory) return;
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: uploadFileName,
      category: uploadCategory,
      date: new Date().toISOString().split('T')[0],
      size: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : '0.1MB',
      type: selectedFile?.type.includes('image') ? 'image' : (selectedFile?.name.endsWith('pdf') ? 'pdf' : 'doc'),
      uploader: 'Teacher', // Teacher View always uploads as Teacher
    };
    setFiles([newFile, ...files]);
    setActiveCategory(uploadCategory); // Switch to that category
    setIsUploadModalOpen(false);
    setUploadFileName('');
    setUploadCategory('');
    setSelectedFile(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(isEn ? 'Are you sure you want to delete this file?' : '确定要删除这个文件吗?')) {
      setFiles(files.filter(f => f.id !== id));
    }
  };

  const handleDownload = (file: FileItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Create a dummy text file to simulate download
    const textContent = `File: ${file.name}\nCategory: ${file.category}\nDate: ${file.date}\n\nThis is a mock file content for demonstration purposes.`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name.includes('.') ? file.name : `${file.name}.txt`);
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filteredFiles = getFilteredFiles();
  const currentCategoryInfo = INITIAL_CATEGORIES.find(c => c.id === activeCategory);

  const getUploaderBadge = (uploader: 'Teacher' | 'Student', variant: 'list' | 'grid' = 'list') => {
    const isTeacher = uploader === 'Teacher';
    const bgClass = isTeacher 
      ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500/20' 
      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-500/20';
    
    const label = isTeacher 
      ? (isEn ? 'Teacher' : '老师上传') 
      : (isEn ? 'Student' : '学生上传');

    if (variant === 'grid') {
      return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${bgClass}`}>
          {isTeacher ? 'T' : 'S'}
        </span>
      );
    }

    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${bgClass}`}>
        {uploader === 'Teacher' ? <User className="w-2.5 h-2.5"/> : <User className="w-2.5 h-2.5"/>}
        {label}
      </span>
    );
  };

  return (
     <div className="flex h-full gap-6 animate-in fade-in slide-in-from-bottom-2 relative">
         
         {/* 1. Left Sidebar: Categories */}
         <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
            <button 
               onClick={() => {
                 setUploadCategory(activeCategory); // Default to current
                 setIsUploadModalOpen(true);
               }}
               className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl text-gray-500 dark:text-zinc-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center justify-center gap-2 group font-medium"
            >
               <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" /> {isEn ? 'Upload File' : '上传新文件'}
            </button>
            
            <div className="space-y-2">
              {INITIAL_CATEGORIES.map(cat => {
                 const count = files.filter(f => f.category === cat.id).length;
                 return (
                   <div 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group border
                         ${activeCategory === cat.id 
                            ? `bg-white dark:bg-zinc-800 border-primary-500 shadow-md ring-1 ring-primary-500` 
                            : 'bg-white dark:bg-zinc-900 border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 hover:shadow-sm'}
                      `}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg} ${cat.textColor}`}>
                            {cat.icon}
                         </div>
                         <div>
                            <p className={`text-sm font-bold ${activeCategory === cat.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-400'}`}>{isEn ? cat.nameEn : cat.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">{count} {isEn ? 'files' : '个文件'}</p>
                         </div>
                      </div>
                      {activeCategory === cat.id && <ChevronRight className="w-4 h-4 text-primary-500" />}
                   </div>
                 );
              })}
            </div>
         </div>

         {/* 2. Main Content: File List */}
         <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-[#e5e0dc] dark:border-white/5 p-6 flex flex-col min-w-0 transition-colors">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentCategoryInfo?.bg} ${currentCategoryInfo?.textColor}`}>
                     {currentCategoryInfo?.icon}
                  </div>
                  <div>
                     <h3 className="font-bold text-lg text-gray-800 dark:text-zinc-100">{isEn ? currentCategoryInfo?.nameEn : currentCategoryInfo?.name}</h3>
                     <p className="text-xs text-gray-500 dark:text-zinc-400">{filteredFiles.length} {isEn ? 'files' : '个文件'}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-2 relative">
                  {/* Sort Filter */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm ${isFilterOpen ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                    >
                       <Filter className="w-4 h-4" /> {isEn ? 'Sort' : '排序'}
                    </button>
                    {isFilterOpen && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-10 py-1">
                        {[
                          { label: isEn ? 'Newest' : '最新上传', value: 'newest' },
                          { label: isEn ? 'Oldest' : '最早上传', value: 'oldest' },
                          { label: isEn ? 'Name' : '文件名称', value: 'name' }
                        ].map(opt => (
                          <button 
                            key={opt.value}
                            onClick={() => { setSortOrder(opt.value as any); setIsFilterOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between ${sortOrder === opt.value ? 'text-primary-600 font-bold' : 'text-gray-600 dark:text-zinc-300'}`}
                          >
                            {opt.label}
                            {sortOrder === opt.value && <Check className="w-3 h-3"/>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>

                  {/* View Toggles */}
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                  >
                     <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                  >
                     <LayoutGrid className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
               {filteredFiles.length > 0 ? (
                  viewMode === 'list' ? (
                    // --- LIST VIEW ---
                    <div className="space-y-2">
                       {filteredFiles.map(file => (
                          <div key={file.id} className="group flex items-center justify-between p-3 border border-gray-100 dark:border-white/5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:border-primary-100 dark:hover:border-primary-500/20 transition-all cursor-default">
                             <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-sm transition-colors`}>
                                   {getFileIcon(file.type)}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 truncate">{file.name}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-400 dark:text-zinc-500">{file.size} • {file.date}</span>
                                      {getUploaderBadge(file.uploader)}
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors" title={isEn ? "Preview" : "预览"}>
                                   <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => handleDownload(file, e)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors" title={isEn ? "Download" : "下载"}>
                                   <Download className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => handleDelete(file.id, e)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors" title={isEn ? "Delete" : "删除"}>
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                  ) : (
                    // --- GRID VIEW ---
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                       {filteredFiles.map(file => (
                          <div key={file.id} className="border border-gray-200 dark:border-white/5 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-500/30 hover:shadow-md transition-all group bg-white dark:bg-zinc-800 flex flex-col relative aspect-[4/5]">
                             <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg mb-3 group-hover:bg-primary-50/20 dark:group-hover:bg-primary-500/10 transition-colors relative">
                                {getFileIcon(file.type)}
                                <div className="absolute top-2 right-2">
                                   {getUploaderBadge(file.uploader, 'grid')}
                                </div>
                             </div>
                             <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200 line-clamp-2 leading-tight mb-1" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">{file.date}</p>
                             </div>

                             {/* Hover Overlay */}
                             <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
                                   <Eye className="w-3 h-3" /> {isEn ? 'Preview' : '预览'}
                                </button>
                                <div className="flex gap-2">
                                   <button onClick={(e) => handleDownload(file, e)} className="p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-primary-600 hover:border-primary-300">
                                      <Download className="w-4 h-4" />
                                   </button>
                                   <button onClick={(e) => handleDelete(file.id, e)} className="p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-red-500 hover:border-red-200">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                  )
               ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-10">
                     <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <FolderOpen className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
                     </div>
                     <p className="text-sm">{isEn ? 'No files in this category' : '该分类下暂无文件'}</p>
                     <button 
                        onClick={() => {
                           setUploadCategory(activeCategory);
                           setIsUploadModalOpen(true);
                        }}
                        className="mt-4 text-xs text-primary-600 font-bold hover:underline"
                     >
                        {isEn ? 'Upload First File' : '上传第一个文件'}
                     </button>
                  </div>
               )}
            </div>
         </div>

         {/* --- Upload Modal --- */}
         {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
               <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                     <h3 className="font-bold text-gray-800 dark:text-white">{isEn ? 'Upload File' : '上传新文件'}</h3>
                     <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                     {/* File Input */}
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect} 
                     />
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer
                            ${selectedFile 
                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' 
                                : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-primary-300 dark:hover:border-primary-500 bg-gray-50/50 dark:bg-zinc-800/50'
                            }`}
                     >
                        {selectedFile ? (
                            <>
                                <FileIcon className="w-10 h-10 text-primary-500 mb-2" />
                                <p className="text-sm font-bold text-primary-700 dark:text-primary-300">{selectedFile.name}</p>
                                <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" />
                                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{isEn ? 'Click or drag file here' : '点击或拖拽文件至此'}</p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{isEn ? 'Supports PDF, JPG, PNG, DOCX (Max 20MB)' : '支持 PDF, JPG, PNG, DOCX (Max 20MB)'}</p>
                            </>
                        )}
                     </div>

                     {/* Name Input */}
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5">{isEn ? 'File Name' : '文件名称'}</label>
                        <input 
                           type="text" 
                           className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-primary-500 transition-all text-gray-900 dark:text-white"
                           placeholder={isEn ? "e.g., G10 Transcript" : "例如：G10 成绩单扫描件"}
                           value={uploadFileName}
                           onChange={(e) => setUploadFileName(e.target.value)}
                        />
                     </div>

                     {/* Category Select */}
                     <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5">{isEn ? 'Category' : '所属分类'}</label>
                        <select 
                           className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-primary-500 text-gray-900 dark:text-white"
                           value={uploadCategory}
                           onChange={(e) => setUploadCategory(e.target.value)}
                        >
                           <option value="" disabled>{isEn ? 'Select...' : '选择分类...'}</option>
                           {INITIAL_CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{isEn ? c.nameEn : c.name}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                     <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 font-medium">{isEn ? 'Cancel' : '取消'}</button>
                     <button 
                        disabled={!uploadFileName || !uploadCategory}
                        onClick={handleUpload}
                        className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                     >
                        {isEn ? 'Upload' : '开始上传'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- Preview Modal --- */}
         {previewFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8" onClick={() => setPreviewFile(null)}>
               <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center pointer-events-none">
                  {/* Close Btn */}
                  <button 
                     onClick={() => setPreviewFile(null)} 
                     className="absolute top-0 right-0 p-2 text-white/70 hover:text-white pointer-events-auto"
                  >
                     <X className="w-8 h-8" />
                  </button>

                  <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl overflow-hidden flex flex-col w-full max-h-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                     <div className="h-12 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 bg-gray-50 dark:bg-zinc-800 flex-shrink-0">
                        <span className="font-bold text-gray-700 dark:text-zinc-200 text-sm truncate">{previewFile.name}</span>
                        <button onClick={(e) => handleDownload(previewFile, e)} className="text-primary-600 text-xs font-bold hover:underline flex items-center gap-1">
                           <Download className="w-3 h-3" /> {isEn ? 'Download' : '下载'}
                        </button>
                     </div>
                     <div className="flex-1 bg-gray-200 dark:bg-zinc-950 flex items-center justify-center p-8 overflow-auto">
                        {/* Mock Content */}
                        <div className="bg-white dark:bg-zinc-800 shadow-lg w-[210mm] min-h-[297mm] flex flex-col items-center justify-center text-gray-300 dark:text-zinc-600 p-10">
                           {getFileIcon(previewFile.type)}
                           <p className="mt-4 text-sm font-medium text-gray-400 dark:text-zinc-500">Preview Placeholder for {previewFile.type.toUpperCase()}</p>
                           <p className="text-xs mt-2">{previewFile.name}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

     </div>
  );
};

export default StudentMaterials;
