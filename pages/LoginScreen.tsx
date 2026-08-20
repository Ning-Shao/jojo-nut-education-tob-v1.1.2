
import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, GraduationCap, ArrowRight, ArrowLeft, Mail, Lock, Loader2, Eye, EyeOff, CheckCircle, X, Phone, Send, MessageSquare } from '../components/common/Icons';
import LoginMascot, { MascotState } from '../components/common/LoginMascot';

interface LoginScreenProps {
  onLogin: (role: 'teacher' | 'student') => void;
  onRoleSelect?: (role: 'teacher' | 'student' | null) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [hoveredRole, setHoveredRole] = useState<'teacher' | 'student' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Mascot Interaction
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [showPassword, setShowPassword] = useState(false);

  // State for Contact Admin Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // State for Forgot Password Modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Ref to prevent hover-leave from overriding selection
  const isSelectingRef = useRef(false);

  // Pre-fill email in contact form if user already typed it
  useEffect(() => {
    if (isContactModalOpen && email) {
      setContactForm(prev => ({ ...prev, email }));
    }
  }, [isContactModalOpen, email]);

  const handleRoleSelection = (role: 'teacher' | 'student') => {
    isSelectingRef.current = true;
    setSelectedRole(role);
    if (onRoleSelect) onRoleSelect(role);
  };

  const handleBack = () => {
    isSelectingRef.current = false;
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setMascotState('idle');
    if (onRoleSelect) onRoleSelect(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    if (!email || !password) {
        setMascotState('error');
        setTimeout(() => setMascotState('idle'), 2000);
        return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        if (email.includes('error')) {
            setIsLoading(false);
            setMascotState('error');
            setTimeout(() => setMascotState('idle'), 2000);
        } else {
            setIsLoading(false);
            setMascotState('success');
            // Wait for confetti animation (approx 0.8s) to complete fully before navigating
            setTimeout(() => {
                onLogin(selectedRole);
            }, 1500);
        }
    }, 1500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) return;

    setContactStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
        setContactStatus('success');
        setTimeout(() => {
            setIsContactModalOpen(false);
            setContactStatus('idle');
            setContactForm({ email: '', message: '' });
        }, 2000);
    }, 1500);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus('submitting');
    setTimeout(() => {
        setResetStatus('success');
        setTimeout(() => {
            setIsForgotPasswordOpen(false);
            setResetStatus('idle');
            setResetEmail('');
        }, 2000);
    }, 1500);
  };

  const togglePasswordVisibility = () => {
      const nextShow = !showPassword;
      setShowPassword(nextShow);
      setMascotState(nextShow ? 'peek' : 'password');
  };

  // Determine the active role for the mascot to display
  const activeMascotRole = selectedRole || hoveredRole;
  
  // Determine if student theme should be active
  const isStudentActive = activeMascotRole === 'student';

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* LEFT COLUMN: Visual & Mascot */}
      <div 
        className={`hidden lg:flex lg:w-1/2 relative flex-col border-r border-[#e5e0dc] dark:border-white/5 transition-colors duration-500
            ${isStudentActive ? 'bg-slate-50 dark:bg-zinc-900' : 'bg-[#fbf7f5] dark:bg-zinc-900'}
        `}
      >
         {/* Branding */}
         <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
            <div className={`w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center font-black text-xl transition-colors duration-300
                ${isStudentActive ? 'text-violet-600' : 'text-primary-600'}
            `}>N</div>
            <span className={`font-bold text-xl tracking-tight transition-colors duration-300 dark:text-white
                ${isStudentActive ? 'text-violet-900' : 'text-primary-900'}
            `}>Nut Education</span>
         </div>
         
         {/* Mascot Container */}
         <div className="relative flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-full max-w-lg aspect-square relative">
                <LoginMascot state={mascotState} role={activeMascotRole} />
            </div>
            
            <div className="mt-8 text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {mascotState === 'success' ? "Ready for Liftoff! 🚀" : "Your Journey Starts Here."}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Connecting counselors, students, and parents in one unified ecosystem for international education success.
                </p>
            </div>
         </div>

         {/* Footer Info */}
         <div className="absolute bottom-8 left-8 text-xs text-gray-400 font-medium">
            © 2026 Nut Education Group. All rights reserved.
         </div>
      </div>

      {/* RIGHT COLUMN: Interaction Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white dark:bg-zinc-950 transition-colors duration-500">
         
         {/* Mobile Logo */}
         <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Nut</span>
         </div>

         <div className="w-full max-w-md mx-auto">
            
            {/* View 1: Role Selection */}
            {!selectedRole ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Welcome back!</h1>
                        <p className="text-gray-500 dark:text-gray-400">Please choose your portal to continue.</p>
                    </div>

                    <div className="grid gap-4">
                        {/* Teacher Card */}
                        <button
                            onClick={() => handleRoleSelection('teacher')}
                            onMouseEnter={() => {
                                setHoveredRole('teacher');
                                onRoleSelect?.('teacher');
                            }}
                            onMouseLeave={() => {
                                setHoveredRole(null);
                                if (!isSelectingRef.current) onRoleSelect?.(null);
                            }}
                            className="group relative p-6 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-primary-600 dark:hover:border-primary-500 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-300 text-left flex items-center gap-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Briefcase className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">Teacher Portal</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Counselors, Admins & Staff</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Student Card */}
                        <button
                            onClick={() => handleRoleSelection('student')}
                            onMouseEnter={() => {
                                setHoveredRole('student');
                                onRoleSelect?.('student');
                            }}
                            onMouseLeave={() => {
                                setHoveredRole(null);
                                if (!isSelectingRef.current) onRoleSelect?.(null);
                            }}
                            className="group relative p-6 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-xl hover:shadow-violet-900/5 transition-all duration-300 text-left flex items-center gap-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <GraduationCap className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Student Portal</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Students & Parents</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                    
                    <div className="text-center pt-8">
                        <p className="text-xs text-gray-400">
                            Trouble logging in? <span onClick={() => setIsContactModalOpen(true)} className="text-gray-900 dark:text-white font-bold cursor-pointer hover:underline">Contact Admin</span>
                        </p>
                    </div>
                </div>
            ) : (
                /* View 2: Login Form */
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 w-full">
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                    </button>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            {selectedRole === 'teacher' ? 'Counselor Login' : 'Student Login'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Email Address</label>
                            <div className="relative group">
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 pl-11 text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-gray-900 dark:focus:border-white transition-all placeholder:text-gray-400"
                                    placeholder="name@school.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setMascotState('email')}
                                    onBlur={() => setMascotState('idle')}
                                />
                                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                            </div>
                        </div>
                        
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Password</label>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setResetEmail(email);
                                        setIsForgotPasswordOpen(true);
                                    }}
                                    className={`text-xs font-medium transition-colors ${
                                        selectedRole === 'student'
                                        ? 'text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300'
                                        : 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                                    }`}
                                    tabIndex={-1}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative group">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 pl-11 pr-12 text-gray-900 dark:text-white outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-gray-900 dark:focus:border-white transition-all placeholder:text-gray-400 tracking-widest"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setMascotState(showPassword ? 'peek' : 'password')}
                                    onBlur={() => setMascotState('idle')}
                                />
                                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                                <button 
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold text-base hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
                                ) : (
                                    <>Log In</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
         </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary-600" /> Reset Password
                    </h3>
                    <button onClick={() => setIsForgotPasswordOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    {resetStatus === 'success' ? (
                        <div className="py-8 flex flex-col items-center text-center animate-in fade-in zoom-in">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Link Sent!</h4>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">Check your email for reset instructions.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed mb-4">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white"
                                    placeholder="name@school.edu"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={resetStatus === 'submitting' || !resetEmail}
                                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                            >
                                {resetStatus === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {resetStatus === 'submitting' ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Contact Admin Modal (Enhanced with Messaging Form) */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
              
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                 <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary-600" /> Contact Admin
                 </h3>
                 <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6">
                 {contactStatus === 'success' ? (
                    <div className="py-8 flex flex-col items-center text-center animate-in fade-in zoom-in">
                       <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                          <CheckCircle className="w-6 h-6" />
                       </div>
                       <h4 className="font-bold text-gray-900 dark:text-white mb-1">Message Sent!</h4>
                       <p className="text-xs text-gray-500 dark:text-zinc-400">Admin will contact you shortly.</p>
                    </div>
                 ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed mb-4">
                           Having trouble logging in? Send a message to our support team directly.
                        </p>
                        
                        <div className="space-y-1.5">
                           <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">Your Email</label>
                           <input 
                              type="email" 
                              required
                              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 dark:text-white"
                              placeholder="e.g., student@school.edu"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase">Message</label>
                           <textarea 
                              required
                              className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none h-24 text-gray-900 dark:text-white placeholder:text-gray-400"
                              placeholder="Describe your issue..."
                              value={contactForm.message}
                              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                           />
                        </div>

                        <button 
                           type="submit" 
                           disabled={contactStatus === 'submitting' || !contactForm.email || !contactForm.message}
                           className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                           {contactStatus === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                           {contactStatus === 'submitting' ? 'Sending...' : 'Send Request'}
                        </button>
                    </form>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
