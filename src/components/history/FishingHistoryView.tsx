import React, { useState } from 'react';
import {
  Fish,
  Star,
  Plus,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  X,
  Award,
  Clock,
  Compass
} from 'lucide-react';
import { TripHistory, UserProfile, CatchItem } from '../../types/index.ts';
import { hapticFeedback } from '../../services/telegramWebApp.ts';

interface FishingHistoryViewProps {
  history: TripHistory[];
  activeUser: UserProfile | null;
  onAddHistory: (entry: any) => Promise<void>;
  onEditHistory?: (id: string, entry: any) => Promise<void>;
  onDeleteHistory?: (id: string) => Promise<void>;
}

const COMMON_FISH = [
  'Корюшка-зубатка',
  'Навага беломорская',
  'Сиг проходной',
  'Камбала полярная',
  'Окунь двинской',
  'Щука',
  'Судак'
];

export const FishingHistoryView: React.FC<FishingHistoryViewProps> = ({
  history,
  activeUser,
  onAddHistory,
  onEditHistory,
  onDeleteHistory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [location, setLocation] = useState('Остров Мудьюг (Сухое Море)');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('Ясно, -4°C, ветер ЮЗ 3 м/с');
  const [durationHours, setDurationHours] = useState(5);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [catches, setCatches] = useState<CatchItem[]>([
    { species: 'Корюшка-зубатка', weightKg: 2.2, count: 42, isTrophy: false },
    { species: 'Навага беломорская', weightKg: 3.5, count: 25, isTrophy: true }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Summary stats
  const totalWeight = history.reduce((acc, h) => {
    return acc + (h.catches || []).reduce((sub, c) => sub + (Number(c.weightKg) || 0), 0);
  }, 0);

  const totalCount = history.reduce((acc, h) => {
    return acc + (h.catches || []).reduce((sub, c) => sub + (Number(c.count) || 0), 0);
  }, 0);

  const handleOpenAdd = () => {
    setEditingId(null);
    setLocation('Сухое море / о. Мудьюг');
    setDate(new Date().toISOString().split('T')[0]);
    setWeather('Пасмурно, -2°C, штиль');
    setDurationHours(5);
    setRating(5);
    setReview('Отличный клев на утреннем приливе.');
    setCatches([
      { species: 'Корюшка-зубатка', weightKg: 1.8, count: 35, isTrophy: false }
    ]);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleOpenEdit = (item: TripHistory) => {
    setEditingId(item.id);
    setLocation(item.location);
    setDate(item.date);
    setWeather(item.weather || '');
    setDurationHours(item.durationHours || 4);
    setRating(item.rating || 5);
    setReview(item.review || '');
    setCatches(item.catches && item.catches.length > 0 ? [...item.catches] : [
      { species: 'Навага беломорская', weightKg: 2.0, count: 15, isTrophy: false }
    ]);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleAddCatchRow = () => {
    setCatches([
      ...catches,
      { species: COMMON_FISH[0], weightKg: 1.0, count: 10, isTrophy: false }
    ]);
  };

  const handleRemoveCatchRow = (index: number) => {
    setCatches(catches.filter((_, i) => i !== index));
  };

  const handleUpdateCatchRow = (index: number, field: keyof CatchItem, value: any) => {
    const updated = [...catches];
    updated[index] = { ...updated[index], [field]: value };
    setCatches(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !activeUser) return;

    setSubmitting(true);
    try {
      const payload = {
        location: location.trim(),
        date,
        weather,
        durationHours: Number(durationHours),
        rating: Number(rating),
        review: review.trim(),
        catches: catches.filter(c => c.species && c.weightKg > 0),
        authorName: activeUser.name,
        userId: activeUser.id,
        gearUsed: ['Зимняя удочка', 'Мормышки фосфорные'],
        baitUsed: ['Креветка', 'Опарыш']
      };

      if (editingId && onEditHistory) {
        await onEditHistory(editingId, payload);
      } else {
        await onAddHistory(payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      hapticFeedback('success');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Журнал уловов
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              {history.length} записей
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            История рыбалок, вес пойманной рыбы, трофеи и заметки
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-sky-500/25 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Записать улов</span>
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/90">
          <div className="text-xs text-slate-500 font-medium">Общий вес улова</div>
          <div className="text-lg sm:text-xl font-bold text-sky-700 mt-0.5">
            {totalWeight.toFixed(1)} кг
          </div>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/90">
          <div className="text-xs text-slate-500 font-medium">Поймано хвостов</div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
            ~{totalCount} шт
          </div>
        </div>
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/90 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Рыбалок в журнале</div>
          <div className="text-lg sm:text-xl font-bold text-slate-800 mt-0.5">
            {history.length}
          </div>
        </div>
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 text-center border border-white/80">
          <Fish className="w-12 h-12 text-sky-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-700">Журнал уловов пуст</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Зафиксируйте свой первый поморский улов, укажите вес, снасти и погоду.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-md shadow-sky-500/20 transition"
          >
            + Записать первый улов
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map(item => {
            const tripWeight = (item.catches || []).reduce((acc, c) => acc + (Number(c.weightKg) || 0), 0);
            return (
              <div
                key={item.id}
                className="liquid-glass-card rounded-3xl p-5 border border-white/90 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <h3 className="text-base font-bold text-slate-800">
                        {item.location}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      <span>{item.date}</span>
                      {item.durationHours && (
                        <>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          <span>{item.durationHours} ч на льду</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Редактировать улов"
                      className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 border border-slate-200/80 shadow-sm transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    {onDeleteHistory && (
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить эту запись из журнала?')) {
                            hapticFeedback('heavy');
                            onDeleteHistory(item.id);
                          }
                        }}
                        title="Удалить улов"
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 shadow-sm transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Catches Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(item.catches || []).map((c, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs flex items-center gap-2"
                    >
                      <span className="font-semibold text-sky-950">{c.species}</span>
                      <span className="text-sky-700 font-bold">{c.weightKg} кг</span>
                      {c.count > 0 && <span className="text-slate-400 font-medium">({c.count} шт)</span>}
                      {c.isTrophy && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Трофей
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs ml-auto">
                    Итого: {tripWeight.toFixed(1)} кг
                  </div>
                </div>

                {/* Review / notes */}
                {item.review && (
                  <p className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-2xl border border-white italic">
                    «{item.review}»
                  </p>
                )}

                {/* Weather info */}
                {item.weather && (
                  <div className="text-[11px] text-slate-400">
                    Погода: {item.weather}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="liquid-glass-card rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-white/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {editingId ? 'Редактировать улов' : 'Записать улов'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Укажите водоем, дату и состав улова
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Место рыбалки
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Остров Мудьюг, Сухое море..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Дата</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Время ловли (часов)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={durationHours}
                    onChange={e => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Catches list */}
              <div className="bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Пойманная рыба
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCatchRow}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Добавить рыбу</span>
                  </button>
                </div>

                {catches.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    <select
                      value={c.species}
                      onChange={e => handleUpdateCatchRow(idx, 'species', e.target.value)}
                      className="flex-1 text-xs bg-transparent border-0 outline-none font-medium text-slate-800"
                    >
                      {COMMON_FISH.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.1"
                      placeholder="Вес (кг)"
                      value={c.weightKg}
                      onChange={e => handleUpdateCatchRow(idx, 'weightKg', Number(e.target.value))}
                      className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold"
                    />

                    <input
                      type="number"
                      placeholder="Шт"
                      value={c.count}
                      onChange={e => handleUpdateCatchRow(idx, 'count', Number(e.target.value))}
                      className="w-14 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center"
                    />

                    {catches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCatchRow(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Weather & Review */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Погода и условия
                </label>
                <input
                  type="text"
                  value={weather}
                  onChange={e => setWeather(e.target.value)}
                  placeholder="Ветер, температура, прилив..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Заметки и впечатления
                </label>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  rows={2}
                  placeholder="На что клевало, какие мормышки сработали..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition"
                >
                  {submitting ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Записать в журнал'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
