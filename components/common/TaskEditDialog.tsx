import React, { useState } from 'react';
import { History, Save, X } from './Icons';
import { TaskAuditEntry } from './taskAudit';

export interface TaskEditField {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'date' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

interface TaskEditDialogProps {
  title: string;
  fields: TaskEditField[];
  auditHistory: TaskAuditEntry[];
  restrictionNote?: string;
  isEn: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}

const TaskEditDialog: React.FC<TaskEditDialogProps> = ({
  title,
  fields,
  auditHistory,
  restrictionNote,
  isEn,
  onClose,
  onSave,
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(field => [field.key, field.value])),
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-white/5">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{isEn ? 'Edit Task' : '编辑任务'}</h3>
            <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-zinc-400">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 custom-scrollbar md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {restrictionNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {restrictionNote}
              </div>
            )}
            {fields.map(field => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-xs font-bold text-gray-500 dark:text-zinc-400">{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea value={values[field.key]} disabled={field.disabled} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:disabled:bg-zinc-800/50" />
                ) : field.type === 'select' ? (
                  <select value={values[field.key]} disabled={field.disabled} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:disabled:bg-zinc-800/50">
                    {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type === 'date' ? 'date' : 'text'} value={values[field.key]} disabled={field.disabled} onChange={event => setValues(previous => ({ ...previous, [field.key]: event.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:disabled:bg-zinc-800/50" />
                )}
              </label>
            ))}
          </div>

          <div className="min-w-0 border-t border-gray-100 pt-5 dark:border-white/5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-zinc-200"><History className="h-4 w-4" />{isEn ? 'Change History' : '字段变更历史'}</h4>
            {auditHistory.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-600">{isEn ? 'No changes recorded' : '暂无字段修改记录'}</p>
            ) : (
              <div className="space-y-4">
                {[...auditHistory].reverse().map(entry => (
                  <div key={entry.id} className="rounded-xl bg-gray-50 p-3 dark:bg-zinc-800/60">
                    <p className="text-xs font-bold text-gray-700 dark:text-zinc-200">{entry.actorName} · {entry.actorRole === 'teacher' ? (isEn ? 'Teacher' : '教师') : (isEn ? 'Student' : '学生')}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{new Date(entry.changedAt).toLocaleString(isEn ? 'en-US' : 'zh-CN')}</p>
                    <div className="mt-2 space-y-1.5">
                      {entry.changes.map(change => (
                        <p key={`${entry.id}-${change.field}`} className="break-words text-xs text-gray-600 dark:text-zinc-400"><span className="font-bold">{change.field}</span>：<span className="line-through opacity-60">{change.before || '—'}</span> → {change.after || '—'}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/5">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5">{isEn ? 'Cancel' : '取消'}</button>
          <button type="button" onClick={() => onSave(values)} className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"><Save className="h-4 w-4" />{isEn ? 'Save' : '保存修改'}</button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditDialog;
