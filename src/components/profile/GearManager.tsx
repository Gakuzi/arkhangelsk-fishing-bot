import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Tag,
  Sparkles,
  Layers,
  Edit2,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';
import { FishingGear } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { hapticFeedback } from '../../services/telegramWebApp.ts';

interface GearManagerProps {
  userId: string;
}

const CATEGORIES: FishingGear['category'][] = [
  'Удилища и катушки',
  'Приманки и мормышки',
  'Зимнее снаряжение',
  'Электроника и навигация',
  'Транспорт и лодки',
  'Прочее'
];

export const GearManager: React.FC<GearManagerProps> = ({ userId }) => {
  const [gearList, setGearList] = useState<FishingGear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FishingGear['category']>('Удилища и катушки');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isReady, setIsReady] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<FishingGear['category']>('Удилища и катушки');
  const [editQuantity, setEditQuantity] = useState(1);

  const loadGear = async () => {
    try {
      setLoading(true);
      const data = await api.getGear(userId);
      setGearList(data);
    } catch (err) {
      console.error('Failed to load gear:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadGear();
    }
  }, [userId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const created = await api.addGear({
        userId,
        name: name.trim(),
        category,
        quantity: Math.max(1, Number(quantity) || 1),
        notes: notes.trim(),
        isReady
      });
      setGearList(prev => [created, ...prev]);
      setName('');
      setNotes('');
      setQuantity(1);
      setShowAddForm(false);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to add gear:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleReady = async (gear: FishingGear) => {
    try {
      hapticFeedback('light');
      const updated = await api.updateGear(gear.id, { isReady: !gear.isReady });
      setGearList(prev => prev.map(g => (g.id === gear.id ? updated : g)));
    } catch (err) {
      console.error('Failed to toggle ready:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту снасть из списка?')) return;
    try {
      hapticFeedback('medium');
      await api.deleteGear(id);
      setGearList(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete gear:', err);
    }
  };

  const startEdit = (gear: FishingGear) => {
    setEditingId(gear.id);
    setEditName(gear.name);
    setEditCategory(gear.category);
    setEditQuantity(gear.quantity || 1);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const updated = await api.updateGear(id, {
        name: editName.trim(),
        category: editCategory,
        quantity: editQuantity
      });
      setGearList(prev => prev.map(g => (g.id === id ? updated : g)));
      setEditingId(null);
      hapticFeedback('success');
    } catch (err) {
      console.error('Failed to save edit:', err);
    }
  };

  const filtered = selectedCategory === 'Все'
    ? gearList
    : gearList.filter(g => g.category === selectedCategory);

  const readyCount = gearList.filter(g => g.isReady).length;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">Снасти и экипировка</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {gearList.length} поз.
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Учет личного снаряжения для сборов на выезды ({readyCount} готово к рыбалке)
          </p>
        </div>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 text-xs font-medium transition shrink-0"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 text-emerald-400" />}
          <span>{showAddForm ? 'Закрыть' : 'Добавить снасть'}</span>
        </button>
      </div>

      {/* Add Form Collapsible */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-200">Новое снаряжение</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Название или модель *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например: Удочка зимняя Stinger Arctic 60MH"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Категория</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Количество (шт.)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Примечание / тест / леска</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Леска 0.16 мм, мормышка фосфорная капля"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isReady}
                onChange={e => setIsReady(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Готово к ближайшему выезду</span>
            </label>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-sm"
            >
              {submitting ? 'Сохранение...' : 'Занести в базу'}
            </button>
          </div>
        </form>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('Все')}
          className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
            selectedCategory === 'Все'
              ? 'bg-slate-200 text-slate-900 font-medium'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Все ({gearList.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = gearList.filter(g => g.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-200 text-slate-900 font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Gear Items List */}
      <div className="space-y-2 mt-1">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">Загрузка снастей...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
            {selectedCategory === 'Все'
              ? 'В вашем списке пока нет снастей. Нажмите «Добавить снасть», чтобы занести удочки, мормышки или экипировку.'
              : `В категории «${selectedCategory}» пока нет предметов.`}
          </div>
        ) : (
          filtered.map(gear => {
            const isEditingThis = editingId === gear.id;

            return (
              <div
                key={gear.id}
                className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  gear.isReady
                    ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-850 opacity-75'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleReady(gear)}
                    title={gear.isReady ? 'Готово к рыбалке' : 'Не готово / на обслуживании'}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-emerald-400 transition shrink-0"
                  >
                    {gear.isReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    {isEditingThis ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                        />
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as any)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editQuantity}
                          onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                        />
                        <button
                          onClick={() => saveEdit(gear.id)}
                          className="p-1 rounded bg-emerald-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${gear.isReady ? 'text-slate-100' : 'text-slate-400'}`}>
                            {gear.name}
                          </span>
                          {(gear.quantity || 1) > 1 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              ×{gear.quantity}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-normal">
                            • {gear.category}
                          </span>
                        </div>
                        {gear.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {gear.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isEditingThis && (
                  <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => startEdit(gear)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title="Редактировать"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(gear.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
