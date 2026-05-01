import { useState } from 'react';
import { useRules, useCreateRule, useToggleRule, useApplyRule, useDeleteRule } from '../hooks/useRules.js';
import { useCategories } from '../hooks/useCategories.js';
import { useTags } from '../hooks/useTags.js';
import { Plus, Play, Trash2, Check } from 'lucide-react';
import type { CreateRuleRequest } from '@littysplitty/shared';
import UserSelector from '../components/UserSelector.js';
import { useUserContext } from '../contexts/UserContext.js';

const EMPTY_FORM: CreateRuleRequest = {
  name: '',
  match_field: 'description',
  match_pattern: '',
  match_type: 'contains',
  apply_retroactively: true,
};

export default function RulesPage() {
  const { selectedUserId } = useUserContext();
  const { data: rules = [], isLoading } = useRules();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const createRule = useCreateRule();
  const toggleRule = useToggleRule();
  const applyRule = useApplyRule();
  const deleteRule = useDeleteRule();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CreateRuleRequest>(EMPTY_FORM);

  const hasAction = form.category_id || form.tag_id || form.is_ignored;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAction || !selectedUserId) return;
    createRule.mutate({ ...form, user_id: selectedUserId }, {
      onSuccess: () => {
        setShowAdd(false);
        setForm(EMPTY_FORM);
      },
    });
  }

  function actionSummary(rule: any) {
    const parts: string[] = [];
    if (rule.category_name) parts.push(`Category: ${rule.category_name}`);
    if (rule.tag_name)      parts.push(`Tag: ${rule.tag_name}`);
    if (rule.is_ignored)    parts.push('Ignore');
    return parts.length ? parts.join(' · ') : '—';
  }

  return (
    <div>
      <UserSelector />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Rules</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Rules match transactions by pattern and can set a category, a tag, and/or ignore — all in one rule. They apply on every future import and can be re-applied retroactively.
      </p>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Rule name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Match pattern (e.g. SOBEYS)"
              value={form.match_pattern}
              onChange={(e) => setForm({ ...form, match_pattern: e.target.value })}
              required
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.match_type}
              onChange={(e) => setForm({ ...form, match_type: e.target.value as any })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="contains">Contains</option>
              <option value="starts_with">Starts with</option>
              <option value="exact">Exact match</option>
            </select>
          </div>

          {/* Combined actions */}
          <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions (any combination)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Set Category</label>
                <select
                  value={form.category_id || ''}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value || undefined })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">(none)</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Set Tag</label>
                <select
                  value={form.tag_id || ''}
                  onChange={(e) => setForm({ ...form, tag_id: e.target.value || undefined })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">(none)</option>
                  {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_ignored || false}
                onChange={(e) => setForm({ ...form, is_ignored: e.target.checked })}
                className="rounded"
              />
              Ignore matching transactions
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.apply_retroactively}
              onChange={(e) => setForm({ ...form, apply_retroactively: e.target.checked })}
              className="rounded"
            />
            Apply to existing transactions
          </label>

          {!hasAction && (
            <p className="text-xs text-amber-600">Choose at least one action.</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createRule.isPending || !hasAction}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Create
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No rules yet. Create one from the Transactions page or here.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Pattern</th>
                <th className="px-4 py-3 font-medium">Match</th>
                <th className="px-4 py-3 font-medium">Actions</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{rule.match_pattern}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{rule.match_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {rule.category_name && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{rule.category_name}</span>
                      )}
                      {rule.tag_name && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{rule.tag_name}</span>
                      )}
                      {rule.is_ignored && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Ignore</span>
                      )}
                      {!rule.category_name && !rule.tag_name && !rule.is_ignored && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRule.mutate({ id: rule.id, isActive: !rule.is_active })}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {rule.is_active ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <button
                      onClick={() => applyRule.mutate(rule.id)}
                      title="Re-apply to all transactions"
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete rule "${rule.name}"?`)) deleteRule.mutate(rule.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
