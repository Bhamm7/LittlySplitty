import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Category, Tag, Transaction } from '@littysplitty/shared';
import { useCreateRule } from '../../hooks/useRules.js';

interface Props {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  categories: Category[];
  tags: Tag[];
  prefill: {
    categoryId?: string;
    tagId?: string;
    isIgnored?: boolean;
  };
}

export default function RuleCreateDialog({ open, onClose, transaction, categories, tags, prefill }: Props) {
  const [matchPattern, setMatchPattern] = useState(transaction.description);
  const [matchType, setMatchType] = useState<'contains' | 'starts_with' | 'exact'>('contains');
  const [categoryId, setCategoryId] = useState(prefill.categoryId || '');
  const [tagId, setTagId] = useState(prefill.tagId || '');
  const [isIgnored, setIsIgnored] = useState(prefill.isIgnored || false);
  const [applyRetroactively, setApplyRetroactively] = useState(true);
  const createRule = useCreateRule();

  const hasAction = categoryId || tagId || isIgnored;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAction) return;
    createRule.mutate(
      {
        name: `Auto: ${matchPattern.substring(0, 50)}`,
        match_field: 'description',
        match_pattern: matchPattern,
        match_type: matchType,
        category_id: categoryId || undefined,
        tag_id: tagId || undefined,
        is_ignored: isIgnored || undefined,
        apply_retroactively: applyRetroactively,
      },
      { onSuccess: () => onClose() }
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Create Rule</Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Match Pattern</label>
              <input
                type="text"
                value={matchPattern}
                onChange={(e) => setMatchPattern(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Shorten to match broadly — e.g. "SOBEYS" instead of the full description</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as typeof matchType)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="contains">Contains</option>
                <option value="starts_with">Starts with</option>
                <option value="exact">Exact match</option>
              </select>
            </div>

            {/* Actions — all optional, any combination */}
            <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions (choose any combination)</p>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Set Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">(none)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Set Tag</label>
                <select
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">(none)</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Ignore */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIgnored}
                  onChange={(e) => setIsIgnored(e.target.checked)}
                  className="rounded"
                />
                Ignore matching transactions
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={applyRetroactively}
                onChange={(e) => setApplyRetroactively(e.target.checked)}
                className="rounded"
              />
              Apply to all existing matching transactions
            </label>

            {!hasAction && (
              <p className="text-xs text-amber-600">Choose at least one action above.</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRule.isPending || !hasAction}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createRule.isPending ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
