
import React, { useState, useRef } from 'react';
import { 
  Upload, Award, Layers, FileBadge, Share2, Briefcase, 
  FileText, Folder, ChevronRight, Filter, LayoutGrid, List,
  Image as ImageIcon, File as FileIcon, Search, MoreHorizontal,
  X, Check, Eye, Download, Trash2, User, FolderOpen
} from '../../common/Icons';
import { useLanguage } from '../../../contexts/LanguageContext';

// --- Types ---
interface Category {
  id: string;
  name: string;
  nameEn: string;
  count: number;
  icon: React.ElementType;
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'image' | 'pdf' | 'doc';
  category: string;
  uploader: 'Teacher' | 'Student';
}

// --- Mock Data ---
const CATEGORIES: Category[] = [
  { id: 'transcript', name: '学校成绩单', nameEn: 'School Transcript', count: 1, icon: FileText },
  { id: 'alevel', name: 'Alevel官考成绩单', nameEn: 'A-Level Results', count: 1, icon: FileText },
  { id: 'certs', name: '证书与奖状', nameEn: 'Certificates', count: 2, icon: Award },
  { id: 'portfolios', name: '作品集', nameEn: 'Portfolios', count: 1, icon: Layers },
  { id: 'activities', name: '活动证明', nameEn: 'Activities', count: 0, icon: FileBadge },
  { id: 'research', name: '科研论文', nameEn: 'Research', count: 1, icon: FileText },
  { id: 'others', name: '其他材料', nameEn: 'Others', count: 0, icon: Folder },
];

const INITIAL_FILES: FileItem[] = [
  { id: '0', name: 'School_Transcript_G10.pdf', size: '2.8MB', date: '2024-06-15', type: 'pdf', category: 'transcript', uploader: 'Teacher' },
  { id: '1', name: 'Robotics_Club_Award.jpg', size: '2.4MB', date: '2024-06-01', type: 'image', category: 'certs', uploader: 'Student' },
  { id: '2', name: 'AMC_12_Certificate.pdf', size: '1.2MB', date: '2024-05-12', type: 'pdf', category: 'certs', uploader: 'Student' },
  { id: '3', name: 'Portfolio_V1.pdf', size: '15MB', date: '2024-09-01', type: 'pdf', category: 'portfolios', uploader: 'Student' },
  { id: '4', name: 'Research_Paper.docx', size: '0.8MB', date: '2024-08-15', type: 'doc', category: 'research', uploader: 'Teacher' },
  { id: '5', name: 'A_Level_Official_Results.pdf', size: '0.5MB', date: '2024-07-20', type: 'pdf', category: 'alevel', uploader: 'Student' },
];

const StudentMaterials: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en-US';
  
  const [activeCategory, setActiveCategory] = useState('transcript');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);

  // Sorting State
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Process Files (Filter & Sort)
  const processedFiles = files
    .filter(f => f.category === activeCategory)
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const activeCatInfo = CATEGORIES.find(c => c.id === activeCategory);

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
      size: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)}MB` : '0.5MB',
      date: new Date().toISOString().split('T')[0],
      type: selectedFile?.type.includes('image') ? 'image' : (selectedFile?.name.endsWith('pdf') ? 'pdf' : 'doc'),
      category: uploadCategory,
      uploader: 'Student' // Student view uploads are always student
    };

    setFiles([newFile, ...files]);
    setActiveCategory(uploadCategory); // Switch to the category of the new file
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
    // Simulate real download by creating a blob
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

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-6 h-6 text-purple-500" />;
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'doc': return <FileText className="w-6 h-6 text-blue-500" />;
      default: return <FileIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getIconWrapper = (type: string) => {
     switch (type) {
        case 'image': return 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-500/20';
        case 'pdf': return 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-500/20';
        case 'doc': return 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-500/20';
        default: return 'bg-gray-50 border-gray-100 dark:bg-zinc-800 dark:border-white/5';
     }
  };

  const getUploaderBadge = (uploader: 'Teacher' | 'Student', variant: 'list' | 'grid' = 'list') => {
    const isTeacher = uploader === 'Teacher';
    // Violet theme for student view context
    const bgClass = isTeacher 
      ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500/20' 
      : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-500/20';
    
    const label = isTeacher 
      ? (isEn ? 'Teacher' : '老师上传') 
      : (isEn ? 'Me' : '我');

    if (variant === 'grid') {
      return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${bgClass}`}>
          {isTeacher ? 'T' : 'Me'}
        </span>
      );
    }

    return (
      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${bgClass}`}>
        <User className="w-2.5 h-2.5"/>
        {label}
      </span>
    );
  };

  return (
    <div className="flex h-full gap-6 p-6 animate-in fade-in slide-in-from-bottom-2 relative" onClick={() => setIsSortMenuOpen(false)}>
      
      {/* --- Left Sidebar --- */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-6">
        
        {/* Upload Zone Button */}
        <div 
           onClick={(e) => {
             e.stopPropagation();
             setUploadCategory(activeCategory); // Default to current category
             setIsUploadModalOpen(true);
           }}
           className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-900/50 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer group"
        >
           <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
           </div>
           <span className="font-bold text-sm">{isEn ? 'Upload New File' : '上传新文件'}</span>
        </div>

        {/* Categories */}
        <div className="space-y-2">
           {CATEGORIES.map(cat => {
             const isActive = activeCategory === cat.id;
             // Calculate real-time count
             const count = files.filter(f => f.category === cat.id).length;
             
             return (
               <div 
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                    ${isActive 
                       ? 'bg-white dark:bg-zinc-800 border-violet-200 dark:border-violet-500/50 shadow-sm text-violet-900 dark:text-violet-100' 
                       : 'bg-transparent border-transparent text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800/50 hover:shadow-sm'}
                 `}
               >
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center 
                        ${isActive ? 'bg-violet-100 text-violet-600' : 'bg-white dark:bg-zinc-800 text-gray-400'}`}>
                        <cat.icon className="w-4 h-4" />
                     </div>
                     <div>
                        <p className={`text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : ''}`}>
                           {isEn ? cat.nameEn : cat.name}
                        </p>
                        <p className="text-[10px] opacity-60">{count} {isEn ? 'files' : '个文件'}</p>
                     </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-violet-400" />}
               </div>
             )
           })}
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl border border-[#e5e0dc] dark:border-white/5 shadow-sm flex flex-col overflow-hidden">
         
         {/* Header */}
         <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center">
                  {activeCatInfo && <activeCatInfo.icon className="w-6 h-6" />}
               </div>
               <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                     {isEn ? activeCatInfo?.nameEn : activeCatInfo?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                     {processedFiles.length} {isEn ? 'files' : '个文件'}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {/* Sort Button with Dropdown */}
               <div className="relative">
                  <button 
                     onClick={(e) => { e.stopPropagation(); setIsSortMenuOpen(!isSortMenuOpen); }}
                     className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors rounded-lg
                        ${isSortMenuOpen ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'}
                     `}
                  >
                     <Filter className="w-3.5 h-3.5" /> {isEn ? 'Sort' : '排序'}
                  </button>
                  {isSortMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {[
                           { label: isEn ? 'Newest First' : '最新上传', value: 'newest' },
                           { label: isEn ? 'Oldest First' : '最早上传', value: 'oldest' },
                           { label: isEn ? 'Name (A-Z)' : '名称排序', value: 'name' }
                        ].map(option => (
                           <button
                              key={option.value}
                              onClick={() => setSortOrder(option.value as any)}
                              className="w-full px-4 py-2.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between text-gray-700 dark:text-zinc-300"
                           >
                              {option.label}
                              {sortOrder === option.value && <Check className="w-3 h-3 text-violet-600 dark:text-violet-400" />}
                           </button>
                        ))}
                     </div>
                  )}
               </div>

               <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>
               
               {/* View Toggle */}
               <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                  <button 
                     onClick={() => setViewMode('list')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     <List className="w-4 h-4" />
                  </button>
                  <button 
                     onClick={() => setViewMode('grid')}
                     className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     <LayoutGrid className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>

         {/* File List */}
         <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc] dark:bg-zinc-950/30">
            {processedFiles.length > 0 ? (
               viewMode === 'list' ? (
                  // --- LIST VIEW ---
                  <div className="space-y-3">
                     {processedFiles.map(file => (
                        <div key={file.id} className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/30 transition-all cursor-default">
                           <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getIconWrapper(file.type)}`}>
                                 {getFileIcon(file.type)}
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">
                                    {file.name}
                                 </h4>
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
                     {processedFiles.map(file => (
                        <div key={file.id} className="group flex flex-col p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/30 transition-all cursor-default relative">
                           <div className={`aspect-square w-full rounded-xl flex items-center justify-center border mb-3 ${getIconWrapper(file.type)}`}>
                              <div className="transform scale-150">
                                 {getFileIcon(file.type)}
                              </div>
                              <div className="absolute top-2 right-2">
                                 {getUploaderBadge(file.uploader, 'grid')}
                              </div>
                           </div>
                           <h4 className="font-bold text-gray-800 dark:text-zinc-200 text-sm mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors line-clamp-1" title={file.name}>
                              {file.name}
                           </h4>
                           <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                              {file.date}
                           </p>
                           
                           {/* Hover Overlay */}
                           <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-3">
                              <button onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-violet-700 flex items-center gap-2">
                                 <Eye className="w-3 h-3" /> {isEn ? 'Preview' : '预览'}
                              </button>
                              <div className="flex gap-2">
                                 <button onClick={(e) => handleDownload(file, e)} className="p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-violet-600 hover:border-violet-300">
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
                             ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/20' 
                             : 'border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-violet-300 dark:hover:border-violet-500 bg-gray-50/50 dark:bg-zinc-800/50'
                         }`}
                  >
                     {selectedFile ? (
                         <>
                             <FileIcon className="w-10 h-10 text-violet-500 mb-2" />
                             <p className="text-sm font-bold text-violet-700 dark:text-violet-300">{selectedFile.name}</p>
                             <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-violet-500 transition-all text-gray-900 dark:text-white"
                        placeholder={isEn ? "e.g., G10 Transcript" : "例如：G10 成绩单扫描件"}
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                     />
                  </div>

                  {/* Category Select */}
                  <div>
                     <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-1.5">{isEn ? 'Category' : '所属分类'}</label>
                     <select 
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                     >
                        <option value="" disabled>{isEn ? 'Select...' : '选择分类...'}</option>
                        {CATEGORIES.map(c => (
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
                     className="px-6 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
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
                        <button onClick={(e) => handleDownload(previewFile, e)} className="text-violet-600 text-xs font-bold hover:underline flex items-center gap-1">
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
