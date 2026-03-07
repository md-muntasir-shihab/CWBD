import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminGuardShell from '../../../components/admin/AdminGuardShell';
import {
  getStudentGroups, createStudentGroup, updateStudentGroup, deleteStudentGroup,
  addGroupMembers, removeGroupMembers, getStudentsList,
} from '../../../api/adminStudentApi';

type Toast = { show: boolean; message: string; type: 'success' | 'error' };
type GroupType = 'manual' | 'dynamic';
type RuleField = 'department' | 'ssc_batch' | 'hsc_batch' | 'status' | 'profile_score';
type RuleOp = 'eq' | 'contains' | 'gt' | 'lt';

interface Rule { field: RuleField; op: RuleOp; value: string }
interface GroupForm { name: string; description: string; type: GroupType; rules: Rule[] }

const RULE_FIELDS: RuleField[] = ['department', 'ssc_batch', 'hsc_batch', 'status', 'profile_score'];
const RULE_OPS: RuleOp[] = ['eq', 'contains', 'gt', 'lt'];

const TYPE_BADGE: Record<string, string> = {
  manual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  dynamic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const EMPTY_FORM: GroupForm = { name: '', description: '', type: 'manual', rules: [] };

function inp(extra = '') {
  return `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${extra}`;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function StudentGroupsPage() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [groupModal, setGroupModal] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [form, setForm] = useState<GroupForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [memberPanel, setMemberPanel] = useState<{ open: boolean; groupId: string; groupName: string } | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [addMemberIds, setAddMemberIds] = useState('');

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
  };

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['admin-student-groups'],
    queryFn: () => getStudentGroups(),
  });

  const { data: membersData } = useQuery({
    queryKey: ['admin-group-members', memberPanel?.groupId],
    queryFn: () => getStudentGroups(memberPanel?.groupId),
    enabled: !!memberPanel?.open,
  });

  const { data: studentSearchData } = useQuery({
    queryKey: ['admin-students-search', memberSearch],
    queryFn: () => getStudentsList({ q: memberSearch, limit: 10 }),
    enabled: memberSearch.length >= 2,
  });

  const openCreate = () => { setForm(EMPTY_FORM); setGroupModal({ open: true }); };
  const openEdit = (g: Record<string, unknown>) => {
    setForm({
      name: (g.name as string) ?? '',
      description: (g.description as string) ?? '',
      type: (g.type as GroupType) ?? 'manual',
      rules: (g.rules as Rule[]) ?? [],
    });
    setGroupModal({ open: true, editId: g._id as string });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      const payload = { ...form };
      if (groupModal.editId) {
        await updateStudentGroup(groupModal.editId, payload as Record<string, unknown>);
        showToast('Group updated');
      } else {
        await createStudentGroup(payload as Record<string, unknown>);
        showToast('Group created');
      }
      qc.invalidateQueries({ queryKey: ['admin-student-groups'] });
      setGroupModal({ open: false });
    } catch { showToast('Failed to save group', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await deleteStudentGroup(deleteConfirm.id);
      qc.invalidateQueries({ queryKey: ['admin-student-groups'] });
      setDeleteConfirm({ open: false, id: '', name: '' });
      showToast('Group deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleAddMembers = async () => {
    if (!memberPanel || !addMemberIds.trim()) return;
    const ids = addMemberIds.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    try {
      await addGroupMembers(memberPanel.groupId, ids);
      qc.invalidateQueries({ queryKey: ['admin-group-members'] });
      setAddMemberIds('');
      showToast('Members added');
    } catch { showToast('Failed', 'error'); }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!memberPanel) return;
    try {
      await removeGroupMembers(memberPanel.groupId, [studentId]);
      qc.invalidateQueries({ queryKey: ['admin-group-members'] });
      showToast('Member removed');
    } catch { showToast('Failed', 'error'); }
  };

  const addRule = () => setForm(f => ({ ...f, rules: [...f.rules, { field: 'department', op: 'eq', value: '' }] }));
  const removeRule = (i: number) => setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }));
  const updateRule = (i: number, key: keyof Rule, val: string) =>
    setForm(f => ({ ...f, rules: f.rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  const groups: Record<string, unknown>[] = (groupsData as { groups?: Record<string, unknown>[] })?.groups ?? (Array.isArray(groupsData) ? groupsData as Record<string, unknown>[] : []);

  return (
    <AdminGuardShell title="Student Groups" description="Manage manual and dynamic student groups">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Groups</h2>
          <button onClick={openCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Group</button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  {['Name', 'Type', 'Members', 'Description', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {groups.map((g: Record<string, unknown>) => (
                  <tr key={g._id as string} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{g.name as string}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${TYPE_BADGE[(g.type as string)] ?? TYPE_BADGE.manual}`}>{g.type as string}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{(g.memberCount as number) ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{g.description as string}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(g)} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200">Edit</button>
                        <button onClick={() => setMemberPanel({ open: true, groupId: g._id as string, groupName: g.name as string })} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200">Members</button>
                        <button onClick={() => setDeleteConfirm({ open: true, id: g._id as string, name: g.name as string })} className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {groups.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No groups yet. Create one to get started.</div>}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={groupModal.open} onClose={() => setGroupModal({ open: false })} title={groupModal.editId ? 'Edit Group' : 'New Group'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Group Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp()} placeholder="e.g. HSC 2024 Batch" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp()} placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Group Type</label>
            <div className="flex gap-4">
              {(['manual', 'dynamic'] as GroupType[]).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t, rules: t === 'manual' ? [] : f.rules }))} className="accent-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {form.type === 'dynamic' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter Rules</label>
                <button onClick={addRule} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Rule</button>
              </div>
              {form.rules.map((rule, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)} className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {RULE_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select value={rule.op} onChange={e => updateRule(i, 'op', e.target.value)} className="w-24 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    {RULE_OPS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)} className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="value" />
                  <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">&times;</button>
                </div>
              ))}
              {form.rules.length === 0 && <p className="text-xs text-gray-400 italic">No rules yet. Students won&apos;t be auto-added.</p>}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setGroupModal({ open: false })} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
            <button onClick={handleSave} disabled={!form.name.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
              {groupModal.editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: '', name: '' })} title="Delete Group">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete <strong className="text-gray-900 dark:text-gray-100">{deleteConfirm.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      {/* Members Panel Modal */}
      {memberPanel?.open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMemberPanel(null)} />
          <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{memberPanel.groupName} — Members</h3>
              <button onClick={() => setMemberPanel(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* Add member */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-2">
              <label className="block text-xs text-gray-500 dark:text-gray-400">Search students to add</label>
              <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} className={inp()} placeholder="Type name or phone..." />
              {memberSearch.length >= 2 && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
                  {((studentSearchData as { students?: Record<string, unknown>[] })?.students || []).map((s: Record<string, unknown>) => (
                    <div key={s._id as string} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{(s.fullName || s.name) as string}</p>
                        <p className="text-xs text-gray-400">{s.phone as string}</p>
                      </div>
                      <button onClick={async () => { await addGroupMembers(memberPanel.groupId, [s._id as string]); qc.invalidateQueries({ queryKey: ['admin-group-members'] }); showToast('Added'); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium">Add</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={addMemberIds} onChange={e => setAddMemberIds(e.target.value)} className={inp()} placeholder="Or paste IDs, comma separated" />
                <button onClick={handleAddMembers} disabled={!addMemberIds.trim()} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-40 whitespace-nowrap">Add</button>
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {((membersData as { members?: Record<string, unknown>[] })?.members || []).map((m: Record<string, unknown>) => (
                <div key={m._id as string} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{(m.fullName || m.name) as string}</p>
                    <p className="text-xs text-gray-400">{m.phone as string}</p>
                  </div>
                  <button onClick={() => handleRemoveMember(m._id as string)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              {!(membersData as { members?: unknown[] })?.members?.length && (
                <div className="p-8 text-center text-sm text-gray-400">No members in this group.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminGuardShell>
  );
}
