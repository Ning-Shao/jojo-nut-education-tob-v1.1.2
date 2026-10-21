import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, CheckCircle, XCircle, Clock, Edit, Trash2, X
} from '../common/Icons';
import { AlertTriangle, Trophy, School, BookOpen, Calendar, ChevronDown, ChevronUp, Check, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

import { Application, DecisionHistory, currentDecision, sortedDecisions, saveDecision, deleteDecision, demoSteps } from '../../lib/offerApplications';

export interface OfferRecord {
  id: string;
  school: string;
  major: string;
  round: string;
  result: 'Pending' | 'Admitted' | 'Rejected' | 'Deferred' | 'Waitlisted';
  condition?: string;
  date: string;
}

export const initialOffers: OfferRecord[] = [
  { id: 'o1', school: 'Carnegie Mellon Univ', major: 'CS', round: 'ED1', result: 'Pending', condition: '', date: '-' },
  { id: 'o2', school: 'UIUC', major: 'CS', round: 'EA', result: 'Admitted', condition: 'Maintain 3.8 GPA', date: '2024-12-15' },
  { id: 'o3', school: 'Georgia Tech', major: 'CS', round: 'EA', result: 'Deferred', condition: '', date: '2024-12-10' },
];

interface TopAlert {
  type: 'warning' | 'success' | 'error';
  message: string;
}

const StudentOfferTracking: React.FC<{ studentId: string }> = ({ studentId }) => {
  const storageKey = `nut-offer-prototype-v1:${studentId}`;
  const [applications, setApplications] = useState<Application[]>(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) return JSON.parse(saved); } catch { /* use local demo defaults */ }
    return initialOffers.map(({ id, school, major, round, ...decision }) => ({ id, school, major, round, decisions: [{ ...decision, date: decision.date === '-' ? '' : decision.date, id: `${id}-decision` }] }));
  });
  const offers = applications.map(a => ({ ...a, ...currentDecision(a), id: a.id }));
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  const [historyDeleteId, setHistoryDeleteId] = useState<string | null>(null);
  const historyApplication = applications.find(a => a.id === historyId);
  const commit = (next: Application[]) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { triggerAlert(isEn ? 'Local saving failed. Please free browser storage and retry.' : '本地保存失败，请检查浏览器存储后重试。', 'error'); return false; }
    setApplications(next);
    return true;
  };
  
  // Inline Form State (无需弹窗)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formSchool, setFormSchool] = useState<string>('');
  const [formMajor, setFormMajor] = useState<string>('');
  const [formRound, setFormRound] = useState<string>('ED1');
  const [formResult, setFormResult] = useState<OfferRecord['result']>('Pending');
  const [formCondition, setFormCondition] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // 顶部提示（4秒自动淡出 / 手动关闭）
  const [topAlert, setTopAlert] = useState<TopAlert | null>(null);
  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 防多次快速点击控制
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const lastSubmitTimeRef = useRef<number>(0);

  // 删除操作（行内确认，不弹窗）
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const schoolInputRef = useRef<HTMLInputElement>(null);

  const { language } = useLanguage();
  const isEn = language === 'en-US';

  const commonRounds = ['ED1', 'ED2', 'EA', 'REA', 'RD', 'Rolling'];

  // 触发顶部提示并在4秒后自动淡出
  const triggerAlert = (message: string, type: 'warning' | 'success' | 'error' = 'warning') => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }
    setTopAlert({ type, message });
    alertTimerRef.current = setTimeout(() => {
      setTopAlert(null);
    }, 4000);
  };

  const closeAlert = () => {
    if (alertTimerRef.current) {
      clearTimeout(alertTimerRef.current);
    }
    setTopAlert(null);
  };

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  const resetForm = () => {
    setFormSchool('');
    setFormMajor('');
    setFormRound('ED1');
    setFormResult('Pending');
    setFormCondition('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
    setEditingDecisionId(null);
  };

  const openCreateForm = () => {
    if (isFormOpen && !editingId) {
      setIsFormOpen(false);
      resetForm();
      return;
    }
    resetForm();
    setIsFormOpen(true);
    setTimeout(() => {
      schoolInputRef.current?.focus();
    }, 100);
  };

  const openEditForm = (offer: OfferRecord, decisionId?: string) => {
    setHistoryId(offer.id);
    setEditingDecisionId(decisionId || currentDecision(applications.find(a => a.id === offer.id)!).id);
    setEditingId(offer.id);
    setFormSchool(offer.school);
    setFormMajor(offer.major);
    setFormRound(offer.round);
    setFormResult(offer.result);
    setFormCondition(offer.condition || '');
    setFormDate(offer.date && offer.date !== '-' ? offer.date : new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
    setTimeout(() => {
      schoolInputRef.current?.focus();
    }, 100);
  };

  const cancelForm = () => {
    resetForm();
    setIsFormOpen(false);
  };

  // 提交保存（包含多字段组合查重与防快速点击）
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const now = Date.now();
    // 防多次快速点击：拦截 600ms 内的重复触发或提交中状态
    if (isSubmitting || now - lastSubmitTimeRef.current < 600) {
      return;
    }
    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);

    const schoolTrimmed = formSchool.trim();
    const majorTrimmed = formMajor.trim();
    const roundTrimmed = formRound.trim();

    if (!schoolTrimmed) {
      triggerAlert(isEn ? 'Please enter the school name.' : '请输入学校名称。', 'warning');
      setIsSubmitting(false);
      return;
    }

    if (!majorTrimmed || !roundTrimmed || !formDate) {
      triggerAlert(isEn ? 'Please enter major, round and decision date.' : '请填写申请专业、申请轮次和通知日期。');
      setIsSubmitting(false);
      return;
    }
    try {
      const next = saveDecision(applications, { school: schoolTrimmed, major: majorTrimmed, round: roundTrimmed },
        { id: editingDecisionId || crypto.randomUUID(), result: formResult, date: formDate, condition: formCondition.trim() }, editingId, editingDecisionId);
      if (!commit(next)) { setIsSubmitting(false); return; }
      triggerAlert(isEn ? 'Decision saved.' : '录取状态已保存！', 'success');
    } catch (error) {
      triggerAlert((error as Error).message);
      setIsSubmitting(false);
      return;
    }

    resetForm();
    setIsFormOpen(false);

    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  const handleDelete = (id: string) => {
    if (!commit(applications.filter(o => o.id !== id))) return;
    if (editingId === id) cancelForm();
    if (historyId === id) setHistoryId(null);
    setDeleteConfirmId(null);
    triggerAlert(isEn ? 'Offer record deleted.' : '已删除录取记录。', 'success');
  };

  // 统计概览
  const totalOffers = offers.length;
  const admittedCount = offers.filter(o => o.result === 'Admitted').length;
  const pendingCount = offers.filter(o => o.result === 'Pending').length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col space-y-5">
      {/* 顶部全局提示横幅（4秒自动淡出 / 可手动关闭） */}
      {topAlert && (
        <div role="alert"
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            topAlert.type === 'warning' 
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300' 
              : topAlert.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {topAlert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
            {topAlert.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
            {topAlert.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
            <span className="font-bold">{topAlert.message}</span>
          </div>
          <button
            onClick={closeAlert}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200"
            title={isEn ? "Close" : "关闭"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 顶部标题栏与添加按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            {isEn ? 'Application & Offer Tracking' : '申请与录取追踪'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            {isEn 
              ? `Total ${totalOffers} applications, ${admittedCount} admitted, ${pendingCount} pending decision.`
              : `共追踪 ${totalOffers} 份申请，已获 ${admittedCount} 份录取，${pendingCount} 份审核中。`}
          </p>
        </div>
        <button 
          id="btn-add-offer-record"
          onClick={openCreateForm} 
          className={`px-4 py-2 text-white text-sm font-bold rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
            isFormOpen && !editingId
              ? 'bg-gray-700 hover:bg-gray-800'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {isFormOpen && !editingId ? (
            <>
              <X className="w-4 h-4" />
              <span>{isEn ? 'Cancel Adding' : '收起录入'}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> 
              <span>{isEn ? 'Add Offer Record' : '添加录取记录'}</span>
            </>
          )}
        </button>
      </div>

      {import.meta.env.DEV && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>本地演示填入（点击后仍需确认添加）：</span>
          {demoSteps.map((step, index) => <button key={index} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => {
            resetForm(); setFormSchool(step.school); setFormMajor(step.major); setFormRound(step.round); setFormResult(step.result); setFormDate(step.date); setIsFormOpen(true);
          }}>场景 {index + 1}{index === 2 ? '（重复）' : ''}</button>)}
        </div>
      )}
      {historyApplication && (
        <section className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold">{isEn ? 'Decision History' : '录取状态历史'} · {historyApplication.school} / {historyApplication.major} / {historyApplication.round}</h4>
            <button type="button" onClick={() => { setHistoryId(null); cancelForm(); }} className="text-xs text-gray-500">{isEn ? 'Close' : '关闭详情'}</button>
          </div>
          <p className="text-xs text-gray-500">{isEn ? 'Latest date first; for the same date, the later added decision is current.' : '按通知日期倒序；同日存在不同状态时，以后添加的状态为当前结果。'}</p>
          {sortedDecisions(historyApplication).map((d, index) => <div key={d.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-gray-100 dark:border-zinc-800 text-xs">
            <span className="font-mono">{d.date || '-'}</span><span className="font-bold">{d.result}</span>
            {index === 0 && <span className="text-primary-600">{isEn ? 'Current' : '当前状态'}</span>}
            <span className="flex-1 text-gray-500">{d.condition}</span>
            <button type="button" className="text-primary-600" onClick={() => openEditForm({ ...historyApplication, ...d, id: historyApplication.id }, d.id)}>{isEn ? 'Edit decision' : '编辑此状态'}</button>
            {historyDeleteId === d.id ? <>
              <span>{historyApplication.decisions.length === 1 ? '删除后该申请也将删除，确认？' : '确认删除此状态？'}</span>
              <button type="button" className="text-rose-600" onClick={() => {
                if (!commit(deleteDecision(applications, historyApplication.id, d.id))) return;
                if (editingId === historyApplication.id) cancelForm();
                setHistoryDeleteId(null);
                triggerAlert(isEn ? 'Decision deleted; current status recalculated.' : '状态已删除，当前结果已自动更新。', 'success');
              }}>确认删除状态</button>
              <button type="button" onClick={() => setHistoryDeleteId(null)}>取消</button>
            </> : <button type="button" className="text-rose-600" onClick={() => setHistoryDeleteId(d.id)}>{isEn ? 'Delete decision' : '删除此状态'}</button>}
          </div>)}
          <button type="button" className="text-xs font-bold text-primary-600" onClick={() => {
            resetForm(); setEditingId(historyApplication.id); setFormSchool(historyApplication.school); setFormMajor(historyApplication.major); setFormRound(historyApplication.round); setIsFormOpen(true);
          }}>{isEn ? 'Add decision' : '添加新的状态'}</button>
        </section>
      )}

      {/* 行内录入 / 编辑表单（无需弹窗） */}
      {isFormOpen && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-primary-200 dark:border-primary-800/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="px-5 py-3 bg-primary-50/70 dark:bg-primary-950/30 border-b border-primary-100 dark:border-primary-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                {editingId 
                  ? (isEn ? 'Edit Offer Record' : (editingDecisionId ? '编辑历史状态 / 申请信息' : '为该申请添加状态'))
                  : (isEn ? 'New Offer Record (Inline Input)' : '新建录取记录（行内直接录入）')}
              </h4>
            </div>
            <button 
              type="button" 
              onClick={cancelForm}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isEn ? 'Cancel' : '取消'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 学校名称 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'School / University' : '学校名称'} <span className="text-rose-500">*</span>
                </label>
                <input 
                  ref={schoolInputRef}
                  type="text"
                  required
                  placeholder={isEn ? "e.g., Carnegie Mellon Univ" : "例如：卡内基梅隆大学 (CMU)"}
                  value={formSchool}
                  onChange={e => setFormSchool(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* 申请专业 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'Intended Major' : '申请专业'}
                </label>
                <input 
                  type="text"
                  placeholder={isEn ? "e.g., Computer Science, CS" : "例如：计算机科学 (CS)"}
                  value={formMajor}
                  onChange={e => setFormMajor(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              {/* 申请轮次 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'Application Round' : '申请轮次'}
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={commonRounds.includes(formRound) ? formRound : 'Other'}
                    onChange={e => {
                      setFormRound(e.target.value === 'Other' ? '' : e.target.value);
                    }}
                    className="px-2.5 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                  >
                    {commonRounds.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="Other">{isEn ? 'Custom...' : '自定义...'}</option>
                  </select>
                  <input 
                    type="text"
                    placeholder={isEn ? "Round (e.g. ED1, RD)" : "轮次 (如 ED1, RD)"}
                    value={formRound}
                    onChange={e => setFormRound(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* 录取结果 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'Admission Result' : '录取结果'}
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { val: 'Pending', label: isEn ? 'Pend' : '待定', color: 'text-gray-700 bg-gray-50 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300' },
                    { val: 'Admitted', label: isEn ? 'Offer' : '录取', color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300' },
                    { val: 'Deferred', label: isEn ? 'Def' : '延期', color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300' },
                    { val: 'Waitlisted', label: isEn ? 'Wait' : '候补', color: 'text-purple-700 bg-purple-50 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300' },
                    { val: 'Rejected', label: isEn ? 'Rej' : '拒绝', color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setFormResult(opt.val as OfferRecord['result'])}
                      className={`px-1.5 py-1.5 text-[11px] font-bold rounded-md border text-center transition-all cursor-pointer ${
                        formResult === opt.val
                          ? `${opt.color} ring-2 ring-primary-500/60 font-black shadow-2xs`
                          : 'bg-gray-50 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 录取条件 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'Condition (Optional)' : '录取条件 (选填)'}
                </label>
                <input 
                  type="text"
                  placeholder={isEn ? "e.g., Maintain 3.8 GPA" : "例如：GPA维持3.8以上"}
                  value={formCondition}
                  onChange={e => setFormCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 通知日期 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {isEn ? 'Decision Date' : '通知日期'}
                </label>
                <input 
                  type="date"
                  required
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* 操作保存栏 */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : '取消'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEn ? 'Saving...' : '保存中...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingId ? (isEn ? 'Update Record' : '保存修改') : (isEn ? 'Save Record' : '确认添加')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offer 记录表格 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/60 text-gray-500 dark:text-zinc-400 font-bold border-b border-gray-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">{isEn ? 'School' : '学校名称'}</th>
                <th className="px-6 py-4">{isEn ? 'Major' : '申请专业'}</th>
                <th className="px-6 py-4">{isEn ? 'Round' : '申请轮次'}</th>
                <th className="px-6 py-4">{isEn ? 'Result' : '录取结果'}</th>
                <th className="px-6 py-4">{isEn ? 'Condition' : '录取条件'}</th>
                <th className="px-6 py-4">{isEn ? 'Date' : '通知日期'}</th>
                <th className="px-6 py-4 text-right">{isEn ? 'Actions' : '操作'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <School className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                      <p>{isEn ? 'No offer records found. Click "Add Offer Record" to create one.' : '暂无录取记录，点击右上角“添加录取记录”开始录入。'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map(offer => {
                  const isBeingEdited = editingId === offer.id;
                  const isDeleting = deleteConfirmId === offer.id;

                  return (
                    <tr 
                      key={offer.id} 
                      className={`transition-colors group ${
                        isBeingEdited 
                          ? 'bg-primary-50/50 dark:bg-primary-950/20 ring-1 ring-inset ring-primary-300 dark:ring-primary-700' 
                          : 'hover:bg-gray-50/80 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {isBeingEdited && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" title={isEn ? "Editing" : "编辑中"} />
                          )}
                          <span>{offer.school}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-zinc-300">
                        {offer.major || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded text-xs font-semibold border border-gray-200 dark:border-zinc-700">
                          {offer.round}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                          ${offer.result === 'Admitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                            offer.result === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' :
                            offer.result === 'Pending' ? 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' :
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'}
                        `}>
                          {offer.result === 'Admitted' && <CheckCircle className="w-3.5 h-3.5" />}
                          {offer.result === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {offer.result === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                          {offer.result === 'Admitted' ? (isEn ? 'Admitted' : '已录取') :
                           offer.result === 'Rejected' ? (isEn ? 'Rejected' : '未录取') :
                           offer.result === 'Deferred' ? (isEn ? 'Deferred' : '延迟决定') :
                           offer.result === 'Waitlisted' ? (isEn ? 'Waitlisted' : '候补名单') :
                           (isEn ? 'Pending' : '审核中')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-zinc-400 text-xs max-w-[180px] truncate" title={offer.condition}>
                        {offer.condition || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-zinc-500 font-mono text-xs">
                        {offer.date || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-2 animate-in fade-in">
                            <span className="text-xs text-rose-600 font-medium">{isEn ? 'Delete?' : '删除申请及全部历史？'}</span>
                            <button
                              onClick={() => handleDelete(offer.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              {isEn ? 'Yes' : '是'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded text-xs font-medium hover:bg-gray-300 cursor-pointer"
                            >
                              {isEn ? 'No' : '否'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditForm(offer)} 
                              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={isEn ? "Edit" : "编辑"}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(offer.id)} 
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title={isEn ? "Delete application and history" : "删除申请及全部历史"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentOfferTracking;
