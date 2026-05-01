import { useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTags.js';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Tag } from '@littysplitty/shared';

export default function TagsPage() {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createTag.mutate({ name: newName, color: newColor }, {
      onSuccess: () => { setShowAdd(false); setNewName(''); setNewColor('#6B7280'); },
    });
  }

  function startEdit(tag: Tag) {
    setEditing(tag);
    setEditName(tag.name);
    setEditColor(tag.color || '#6B7280');
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    updateTag.mutate({ id: editing.id, data: { name: editName, color: editColor } }, {
      onSuccess: () => setEditing(null),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tags</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 mb-4 flex items-center gap-3">
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tag name" required className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" disabled={createTag.isPending} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
          <button type="button" onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-5 h-5" /></button>
        </form>
      )}

      <p className="text-sm text-gray-500 mb-4">Tags are used to assign transactions to people (e.g., Me, Wife, Split)</p>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-4 px-4 py-3">
              {editing?.id === tag.id ? (
                <form onSubmit={handleEdit} className="flex items-center gap-3 flex-1">
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm" required />
                  <button type="submit" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color || '#9E9E9E' }} />
                  <span className="flex-1 text-sm font-medium text-gray-900">{tag.name}</span>
                  <button onClick={() => startEdit(tag)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${tag.name}"?`)) deleteTag.mutate(tag.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
