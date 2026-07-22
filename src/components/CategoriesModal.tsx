import React, { useState } from 'react';
import { Settings, X, Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryDef } from '../types';
import { resolveIcon } from '../utils';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_COLORS = [
  { id: 'blue', class: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Blue' },
  { id: 'orange', class: 'bg-orange-500/20 text-orange-300 border-orange-500/30', label: 'Orange' },
  { id: 'rose', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30', label: 'Rose' },
  { id: 'slate', class: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: 'Slate' },
  { id: 'indigo', class: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Indigo' },
  { id: 'emerald', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Emerald' },
  { id: 'amber', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Amber' },
  { id: 'purple', class: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'Purple' },
  { id: 'cyan', class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Cyan' },
  { id: 'pink', class: 'bg-pink-500/20 text-pink-300 border-pink-500/30', label: 'Pink' },
];

const AVAILABLE_EMOJIS = ['👤', '🏠', '❤️', '🚗', '💳', '💼', '🛒', '🐾', '🌴', '🎓', '📚', '🎁', '💡', '🎮', '🛠️', '💸'];

export default function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { categories, saveCategories } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('👤');
  const [editColor, setEditColor] = useState(AVAILABLE_COLORS[0].class);

  if (!isOpen) return null;

  const handleEdit = (cat: CategoryDef) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
  };

  const handleAddNew = () => {
    setEditingId('new');
    setEditName('');
    setEditIcon('👤');
    setEditColor(AVAILABLE_COLORS[0].class);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    
    let newCategories = [...categories];
    
    if (editingId === 'new') {
      const newCat: CategoryDef = {
        id: crypto.randomUUID(),
        name: editName.trim(),
        icon: editIcon,
        color: editColor
      };
      newCategories.push(newCat);
    } else {
      newCategories = newCategories.map(c => 
        c.id === editingId ? { ...c, name: editName.trim(), icon: editIcon, color: editColor } : c
      );
    }
    
    await saveCategories(newCategories);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this category? Tasks using it will keep the category ID but may lose their color styling.')) {
      await saveCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5" /> Manage Categories
          </h3>
          <button onClick={() => { setEditingId(null); onClose(); }} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {editingId ? (
            <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <h4 className="font-semibold text-white mb-2">{editingId === 'new' ? 'Add New Category' : 'Edit Category'}</h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none" 
                  placeholder="Category name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Color Theme</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditColor(c.class)}
                      className={`h-8 rounded border transition-all ${c.class} ${editColor === c.class ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Icon</label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-900 border border-slate-700 rounded-lg">
                  {AVAILABLE_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditIcon(emoji)}
                      className={`p-2 flex items-center justify-center rounded-lg transition-colors ${editIcon === emoji ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
                    >
                      <span className="text-xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button type="button" onClick={handleSave} disabled={!editName.trim()} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-md">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <button 
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>

              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded border ${cat.color} flex items-center gap-2 font-medium`}>
                        <span>{resolveIcon(cat.icon)}</span> {cat.name}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
