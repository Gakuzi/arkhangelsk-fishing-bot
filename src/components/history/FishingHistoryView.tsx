import React, { useState } from 'react';
import {
  Fish,
  Star,
  Plus,
  Compass,
  Thermometer,
  Anchor,
  Sparkles,
  Layers,
  Award,
  Calendar,
  X,
  Trash2
} from 'lucide-react';
import { TripHistory, UserProfile, CatchItem } from '../../types/index.ts';

interface FishingHistoryViewProps {
  history: TripHistory[];
  activeUser: UserProfile | null;
  onAddHistory: (entry: any) => Promise<void>;
  onEditHistory?: (id: string, entry: any) => Promise<void>;
  onDeleteHistory?: (id: string) => Promise<void>;
}

const COMMON_FISH = [
  'Навага беломорская',
  'Корюшка-зубатка',
  'Сиг проходной',
  'Камбала полярная',
  'Окунь двинской',
  'Щука',
  'Судак',
  'Язь',
  'Лещ'
];

const COMMON_GEAR = [
  'Зимняя удилка с кивком',
  'Фосфорные мормышки (капли)',
  'Балансир Rapala 5-7см',
  'Леска 0.14-0.18мм',
  'Джиг-головка 18-28г',
  'Донка с грузом-ложкой',
  'Блесна "Маропедка"'
];

const COMMON_BAIT = [
  'Варено-мороженая креветка',
  'Опарыш белый и красный',
  'Пескожил (морской червь)',
  'Резка наваги / сельди',
  'Мотыль крупный',
  'Силиконовый виброхвост'
];

export const FishingHistoryView: React.FC<FishingHistoryViewProps> = ({
  history,
  activeUser,
  onAddHistory,
  onEditHistory,
  onDeleteHistory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);

  // Form State
  const [location, setLocation] = useState('Остров Мудьюг (Сухое Море)');
  const [date, setDate] = useState('14.09.2026');
  const [weather, setWeather] = useState('Пасмурно, -3°C, ветер ЮЗ 4 м/с, отлив в 12:00');
  const [durationHours, setDurationHours] = useState(6);
  const [depthMeters, setDepthMeters] = useState(5.0);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('Отличный клев наваги на перемене течений. Сработали мормышки-светлячки с кусочком креветки.');

  // Dynamic Catches in form
  const [catches, setCatches] = useState<CatchItem[]>([
    { species: 'Корюшка-зубатка', weightKg: 2.5, count: 48, isTrophy: false },
    { species: 'Навага беломорская', weightKg: 3.8, count: 28, isTrophy: true }
  ]);

  const [selectedGear, setSelectedGear] = useState<string[]>([
    'Зимняя удилка с кивком',
    'Фосфорные мормышки (капли)',
    'Леска 0.14-0.18мм'
  ]);

  const [selectedBait, setSelectedBait] = useState<string[]>([
    'Варено-мороженая креветка',
    'Опарыш белый и красный'
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Stats calculation
  const totalWeight = history.reduce((acc, h) => {
    return acc + h.catches.reduce((sub, c) => sub + (c.weightKg || 0), 0);
  }, 0);

  const totalCount = history.reduce((acc, h) => {
    return acc + h.catches.reduce((sub, c) => sub + (c.count || 0), 0);
  }, 0);

  const trophyCount = history.reduce((acc, h) => {
    return acc + h.catches.filter(c => c.isTrophy).length;
  }, 0);

  const handleAddCatchRow = () => {
    setCatches(prev => [
      ...prev,
      { species: COMMON_FISH[0], weightKg: 1.0, count: 10, isTrophy: false }
    ]);
  };

  const handleRemoveCatchRow = (idx: number) => {
    setCatches(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleGear = (item: string) => {
    if (selectedGear.includes(item)) {
      setSelectedGear(selectedGear.filter(g => g !== item));
    } else {
      setSelectedGear([...selectedGear, item]);
    }
  };

  const toggleBait = (item: string) => {
    if (selectedBait.includes(item)) {
      setSelectedBait(selectedBait.filter(b => b !== item));
    } else {
      setSelectedBait([...selectedBait, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || catches.length === 0 || !activeUser) return;

    setSubmitting(true);
    try {
      const historyData = {
        userId: activeUser.id,
        authorName: activeUser.name,
        date,
        location,
        weather,
        durationHours: Number(durationHours),
        depthMeters: Number(depthMeters),
        rating: Number(rating),
        review,
        catches,
        gearUsed: selectedGear,
        baitUsed: selectedBait
      };

      if (editingHistoryId && onEditHistory) {
        await onEditHistory(editingHistoryId, historyData);
      } else {
        await onAddHistory(historyData);
      }
      
      setEditingHistoryId(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Header & Stats */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-100">История рыбалок и журнал уловов</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Отчеты
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Фиксация улова (виды рыб, вес, штуки), проверенных снастей, наживок и отзывов о клеве
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 text-xs font-medium transition shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Добавить отчет</span>
          </button>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Выездов в базе</div>
            <div className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">{history.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Всего хвостов</div>
            <div className="text-base sm:text-lg font-bold text-slate-200 mt-0.5">{totalCount} шт</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Общий вес</div>
            <div className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">{totalWeight.toFixed(1)} кг</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Трофеев</div>
            <div className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">{trophyCount} 🏆</div>
          </div>
        </div>
      </div>

      {/* History Feed */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            История рыбалок пуста. Станьте первым, кто добавит отчет об улове!
          </div>
        ) : (
          history.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-600/30 flex items-center justify-center text-sky-400">
                    <Fish className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{item.location}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Автор: <strong className="text-slate-200">{item.authorName}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{item.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Rating stars */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-400 ml-1.5 font-medium">{item.rating}/5</span>
                  </div>
                  
                  {activeUser && item.userId === activeUser.id && (
                    <div className="flex items-center gap-3 text-xs mt-1">
                      {onEditHistory && (
                        <button
                          onClick={() => {
                            setEditingHistoryId(item.id);
                            setLocation(item.location);
                            setDate(item.date);
                            setWeather(item.weather);
                            setDurationHours(item.durationHours);
                            setDepthMeters(item.depthMeters || 0);
                            setRating(item.rating);
                            setReview(item.review || '');
                            setCatches(item.catches || []);
                            setSelectedGear(item.gearUsed || []);
                            setSelectedBait(item.baitUsed || []);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          Изменить
                        </button>
                      )}
                      {onDeleteHistory && (
                        <button
                          onClick={() => {
                            if (window.confirm('Точно удалить этот отчет?')) {
                              onDeleteHistory(item.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 transition"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Weather & Conditions Strip */}
              <div className="flex flex-wrap gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                  <span>{item.weather}</span>
                </div>
                {item.depthMeters && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>•</span>
                    <Anchor className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Глубина: {item.depthMeters} м</span>
                  </div>
                )}
                {item.durationHours && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>•</span>
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Время лова: {item.durationHours} ч</span>
                  </div>
                )}
              </div>

              {/* Catches Grid */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Отметки об улове:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {item.catches.map((c, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        c.isTrophy
                          ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1">
                          <span>{c.species}</span>
                          {c.isTrophy && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Трофей</span>}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Вес: <strong className="text-slate-200">{c.weightKg} кг</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-sky-400">{c.count}</span>
                        <span className="text-[10px] text-slate-500 ml-1">шт</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review & Gear */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-300">Впечатления и отзыв о клеве:</div>
                  <p className="text-slate-400 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    "{item.review}"
                  </p>
                </div>

                <div className="text-xs space-y-2.5">
                  <div>
                    <div className="font-semibold text-slate-300 mb-1">Снасти:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.gearUsed.map((g, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          🎣 {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-slate-300 mb-1">Наживка и приманка:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.baitUsed.map((b, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          🪱 {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Fish className="w-5 h-5 text-sky-400" />
                <span>Добавить отчет о рыбалке в журнал</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Водоем / Место лова</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    required
                    placeholder="Остров Мудьюг / Сухое Море"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Дата рыбалки</label>
                  <input
                    type="text"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    placeholder="ДД.ММ.ГГГГ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Погода, температура и лед</label>
                  <input
                    type="text"
                    value={weather}
                    onChange={e => setWeather(e.target.value)}
                    required
                    placeholder="-5°C, ветер ЮЗ, лед 35 см"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Глубина (м)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={depthMeters}
                      onChange={e => setDepthMeters(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Время (часов)</label>
                    <input
                      type="number"
                      value={durationHours}
                      onChange={e => setDurationHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Catches List */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Отметки об улове (рыба, вес, количество):</span>
                  <button
                    type="button"
                    onClick={handleAddCatchRow}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить вид рыбы</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {catches.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <select
                        value={item.species}
                        onChange={e => {
                          const val = e.target.value;
                          setCatches(prev => prev.map((c, i) => i === idx ? { ...c, species: val } : c));
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs flex-1"
                      >
                        {COMMON_FISH.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.1"
                        placeholder="Вес (кг)"
                        value={item.weightKg}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCatches(prev => prev.map((c, i) => i === idx ? { ...c, weightKg: val } : c));
                        }}
                        className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
                      />

                      <input
                        type="number"
                        placeholder="Штук"
                        value={item.count}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setCatches(prev => prev.map((c, i) => i === idx ? { ...c, count: val } : c));
                        }}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
                      />

                      <label className="flex items-center gap-1 text-[11px] text-amber-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.isTrophy}
                          onChange={e => {
                            const checked = e.target.checked;
                            setCatches(prev => prev.map((c, i) => i === idx ? { ...c, isTrophy: checked } : c));
                          }}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0"
                        />
                        <span>Трофей</span>
                      </label>

                      {catches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCatchRow(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gear selection */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Использованные снасти:</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_GEAR.map(g => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGear(g)}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition ${
                        selectedGear.includes(g)
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bait selection */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Наживка / Приманка:</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_BAIT.map(b => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => toggleBait(b)}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition ${
                        selectedBait.includes(b)
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review & Rating */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Отзыв о рыбалке и полезные наблюдения:</label>
                <textarea
                  rows={2}
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder="Что сработало, на какой глубине брало, как погода повлияла на клев..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Оценка выезда:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-slate-400 ml-2 font-semibold">{rating} из 5 звезд</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition shadow-md shadow-sky-950"
                >
                  {submitting ? 'Сохранение...' : 'Записать в журнал'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
