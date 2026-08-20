
import React, { useState, useEffect } from 'react';
import { MessageSquare, X, CheckCircle, Loader2, Bug, Lightbulb, MoreHorizontal, Camera, Trash2, Image as ImageIcon } from './Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import html2canvas from 'html2canvas';

interface FeedbackModalProps {
  theme?: 'primary' | 'violet';
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHiddenForCapture, setIsHiddenForCapture] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Theme state: 'primary' (default/teacher) or 'violet' (student)
  const [internalTheme, setInternalTheme] = useState<'primary' | 'violet'>('primary');

  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const activeTheme = theme || internalTheme;

  // Detect Theme Context when opening (fallback if no prop provided)
  useEffect(() => {
    if (isOpen && !theme) {
      // Logic: Check URL OR check for specific student-DOM markers since routing might be state-based
      const isStudent = window.location.href.includes('student') || 
                        !!document.querySelector('.text-violet-900') ||
                        !!document.querySelector('.bg-violet-50');
      setInternalTheme(isStudent ? 'violet' : 'primary');
    }
  }, [isOpen, theme]);

  const resetForm = () => {
    setFeedbackType('bug');
    setContent('');
    setScreenshot(null);
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (isSubmitting || isCapturing) return;
    setIsOpen(false);
    setTimeout(resetForm, 300);
  };

  const handleCaptureScreen = async () => {
    setIsCapturing(true);
    // Hide modal temporarily
    setIsHiddenForCapture(true);

    // Wait for render cycle to hide modal visually
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 1, // Moderate quality
        allowTaint: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshot(dataUrl);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert(isEn ? "Screenshot failed" : "截图失败");
    } finally {
      setIsHiddenForCapture(false);
      setIsCapturing(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    setIsSubmitting(true);

    // 1. Capture Context
    const payload = {
      type: feedbackType,
      message: content,
      screenshot: screenshot ? 'Base64 Image Data (Attached)' : 'None',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
        language
      }
    };

    // 2. Log to Console
    console.group('📝 Feedback Submission');
    console.log('Details:', payload);
    if (screenshot) console.log('Screenshot Preview:', screenshot);
    console.groupEnd();

    // 3. Simulate API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-12 h-12 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-[100] group
          ${activeTheme === 'violet' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-primary-600 hover:bg-primary-700'}
        `}
        title={isEn ? "Feedback" : "问题反馈"}
      >
        <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
      </button>
    );
  }

  // Determine dynamic colors based on detected theme
  const activeBtnClass = activeTheme === 'violet' 
    ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-500/30' 
    : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-500/30';
  
  const submitBtnClass = activeTheme === 'violet'
    ? 'bg-violet-600 hover:bg-violet-700 hover:shadow-violet-600/30'
    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-600/30';

  const focusRingClass = activeTheme === 'violet'
    ? 'focus:ring-violet-500/20 focus:border-violet-500'
    : 'focus:ring-primary-500/20 focus:border-primary-500';

  return (
    <div className={`fixed inset-0 z-[101] flex items-center justify-center px-4 ${isHiddenForCapture ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className={`bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 border border-gray-100 dark:border-white/10`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
            {isEn ? 'Send Feedback' : '发送反馈'}
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTheme === 'violet' ? 'bg-violet-100 text-violet-600' : 'bg-green-100 text-green-600'}`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {isEn ? 'Thank You!' : '感谢您的反馈！'}
              </h4>
              <p className="text-gray-500 dark:text-zinc-400 text-sm">
                {isEn ? 'We have received your feedback.' : '我们已收到您的意见，会尽快处理。'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase mb-2">
                  {isEn ? 'Feedback Type' : '反馈类型'}
                </label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                  {[
                    { id: 'bug', label: isEn ? 'Bug' : '功能异常', icon: Bug },
                    { id: 'feature', label: isEn ? 'Idea' : '产品建议', icon: Lightbulb },
                    { id: 'other', label: isEn ? 'Other' : '吐槽', icon: MoreHorizontal },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFeedbackType(type.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all
                        ${feedbackType === type.id 
                          ? activeBtnClass + ' shadow-sm bg-white dark:bg-zinc-700' 
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}
                      `}
                    >
                      <type.icon className="w-3.5 h-3.5" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">
                  {isEn ? 'Details' : '详细描述'}
                </label>
                <textarea
                  className={`w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm outline-none transition-all resize-none h-32 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 ${focusRingClass}`}
                  placeholder={isEn ? "Describe the issue or idea..." : "请详细描述您遇到的问题或建议..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Screenshot Preview Area */}
              {screenshot && (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm animate-in fade-in zoom-in-95">
                   <div className="absolute top-2 right-2 z-10">
                      <button 
                        onClick={handleRemoveScreenshot}
                        className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm"
                      >
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   </div>
                   <div className="bg-gray-100 dark:bg-zinc-800 p-2 flex items-center gap-2 border-b border-gray-200 dark:border-white/5">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">{isEn ? 'Screenshot Attached' : '已添加屏幕截图'}</span>
                   </div>
                   <img src={screenshot} alt="Screenshot" className="w-full h-auto max-h-40 object-cover object-top opacity-90" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
            
            {/* Left: Screenshot Button */}
            {!screenshot && (
                <button
                    onClick={handleCaptureScreen}
                    disabled={isCapturing}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5"
                    title={isEn ? "Capture Screenshot" : "截取屏幕"}
                >
                    {isCapturing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />}
                    <span>{isCapturing ? (isEn ? 'Capturing...' : '截取中...') : (isEn ? 'Screenshot' : '一键截图')}</span>
                </button>
            )}
            {screenshot && <div></div>} {/* Spacer */}

            {/* Right: Actions */}
            <div className="flex gap-3">
                <button 
                onClick={handleClose}
                className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                disabled={isSubmitting}
                >
                {isEn ? 'Cancel' : '取消'}
                </button>
                <button 
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className={`px-6 py-2 text-white rounded-lg text-sm font-bold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${submitBtnClass}`}
                >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEn ? 'Submit Feedback' : '提交反馈'}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
