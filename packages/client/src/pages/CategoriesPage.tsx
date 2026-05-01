import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories.js';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Category } from '@littysplitty/shared';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6B7280');
  const [newIsBusiness, setNewIsBusiness] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIsBusiness, setEditIsBusiness] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    createCat.mutate({ name: newName, color: newColor, is_business: newIsBusiness }, {
      onSuccess: () => { setShowAdd(false); setNewName(''); setNewColor('#6B7280'); setNewIsBusiness(false); },
    });
  }

  function startEdit(cat: Category) {
    setEditing(cat);
    setEditName(cat.name);
    setEditColor(cat.color || '#6B7280');
    setEditIsBusiness(cat.is_business);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    updateCat.mutate({ id: editing.id, data: { name: editName, color: editColor, is_business: editIsBusiness } }, {
      onSuccess: () => setEditing(null),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" required className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <button type="submit" disabled={createCat.isPending} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-5 h-5" /></button>
            <button type="button" onClick={() => setShowAdd(false)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={newIsBusiness} onChange={(e) => setNewIsBusiness(e.target.checked)} className="rounded" />
            Include in Tax Report
          </label>
        </form>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-4 py-3">
              {editing?.id === cat.id ? (
                <form onSubmit={handleEdit} className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded-lg px-3 py-1.5 text-sm" required />
                    <button type="submit" className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pl-1">
                    <input type="checkbox" checked={editIsBusiness} onChange={(e) => setEditIsBusiness(e.target.checked)} className="rounded" />
                    Include in Tax Report
                  </label>
                </form>
              ) : (
                <>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#9E9E9E' }} />
                  <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
                  {cat.is_business && <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">Tax</span>}
                  {cat.is_default && <span className="text-xs text-gray-400">Default</span>}
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate(cat.id); }}
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
