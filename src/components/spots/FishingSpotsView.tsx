import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Plus,
  X
} from 'lucide-react';
import { FishingSpot, UserProfile } from '../../types/index.ts';
import { YandexFishingMap } from './YandexFishingMap.tsx';
import { hapticFeedback } from '../../services/telegramWebApp.ts';

interface FishingSpotsViewProps {
  spots: FishingSpot[];
  activeUser: UserProfile | null;
  onAddSpot: (spot: any) => Promise<void>;
}

export const FishingSpotsView: React.FC<FishingSpotsViewProps> = ({
  spots,
  activeUser,
  onAddSpot
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(spots[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [lat, setLat] = useState<number>(64.8820);
  const [lon, setLon] = useState<number>(40.2910);
  const [area, setArea] = useState('Сухое Море / Мудьюг');
  const [recommendedFishInput, setRecommendedFishInput] = useState('Навага, Корюшка');
  const [season, setSeason] = useState<FishingSpot['season']>('Зима (со льда)');
  const [depthMeters, setDepthMeters] = useState('4-6');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCopyCoords = (spot: FishingSpot) => {
    hapticFeedback('light');
    const text = `${spot.lat.toFixed(5)}, ${spot.lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(spot.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !activeUser) return;

    setSubmitting(true);
    try {
      const recommendedFish = recommendedFishInput.split(',').map(s => s.trim()).filter(Boolean);
      await onAddSpot({
        name,
        lat: Number(lat),
        lon: Number(lon),
        area,
        recommendedFish,
        season,
        depthMeters,
        description: description || 'Рыбное место Поморья',
        addedBy: activeUser.name
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      hapticFeedback('success');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">Карта и точки лова</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Яндекс.Карты
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Проверенные клевые места, протоки, свалы и банки в дельте Северной Двины и на Белом Море
          </p>
        </div>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 text-xs font-medium transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Добавить точку</span>
        </button>
      </div>

      {/* Embedded Yandex Map */}
      <YandexFishingMap
        spots={spots}
        selectedSpot={selectedSpot}
        onSelectSpot={setSelectedSpot}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* Spots Grid */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 px-1">
          Все сохраненные рыболовные локации ({spots.length})
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {spots.map(s => {
            const isSelected = selectedSpot?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  hapticFeedback('selection');
                  setSelectedSpot(s);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-900 border-slate-600 shadow-sm'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-semibold text-xs text-slate-100 truncate">{s.name}</div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                    {s.season}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mb-2 truncate">
                  📍 {s.area}
                </div>

                {s.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {s.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCoords(s);
                    }}
                    className="flex items-center gap-1 font-mono text-slate-400 hover:text-slate-200 transition"
                  >
                    {copiedId === s.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{s.lat.toFixed(2)}, {s.lon.toFixed(2)}</span>
                  </button>

                  <a
                    href={`https://yandex.ru/maps/?rtext=~${s.lat}%2C${s.lon}&rtt=auto`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <span>Маршрут</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Spot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSpot}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Добавить рыболовную точку</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Название точки *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Банка наважья у маяка"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Широта (Latitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={e => setLat(parseFloat(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Долгота (Longitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={e => setLon(parseFloat(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Район / Акватория</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Сезон</label>
                  <select
                    value={season}
                    onChange={e => setSeason(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  >
                    <option value="Зима (со льда)">Зима (со льда)</option>
                    <option value="Лето (открытая вода)">Лето (открытая вода)</option>
                    <option value="Круглый год">Круглый год</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Целевая рыба (через запятую)</label>
                <input
                  type="text"
                  value={recommendedFishInput}
                  onChange={e => setRecommendedFishInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Описание / ориентиры / глубины</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-900 text-xs font-medium transition shadow-sm"
              >
                {submitting ? 'Сохранение...' : 'Добавить точку'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
