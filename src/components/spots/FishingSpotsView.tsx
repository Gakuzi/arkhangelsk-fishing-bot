import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Fish,
  Anchor,
  X
} from 'lucide-react';
import { FishingSpot, UserProfile } from '../../types/index.ts';

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
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Карта и Координаты Точек Лова</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Поморье & GPS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Координаты проверенных клевых мест, свалов, банок и проток Белого Моря и дельты Северной Двины.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-medium transition shadow-md shadow-sky-950 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Отметить новую точку</span>
        </button>
      </div>

      {/* Main Grid: Interactive Map preview + Spots list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spot Details & Map preview widget */}
        <div className="lg:col-span-2 space-y-4">
          {/* Visual Radar / Map Simulator Canvas */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950/40 border border-slate-800 p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
                <span>Навигатор Поморья: {selectedSpot?.name || 'Выберите точку'}</span>
              </div>
              {selectedSpot && (
                <a
                  href={`https://yandex.ru/maps/?pt=${selectedSpot.lon},${selectedSpot.lat}&z=13&l=sat`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                >
                  <span>Яндекс.Карты (Спутник)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Stylized Vector Radar Map Display */}
            <div className="relative w-full h-64 sm:h-72 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {/* Radar Grid Circles */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-72 h-72 rounded-full border border-sky-500/40" />
                <div className="w-48 h-48 rounded-full border border-sky-500/40 absolute" />
                <div className="w-24 h-24 rounded-full border border-sky-500/40 absolute" />
                <div className="w-full h-px bg-sky-500/30 absolute" />
                <div className="h-full w-px bg-sky-500/30 absolute" />
              </div>

              {/* Water background texture */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />

              {/* Spots pinned on the stylized map */}
              <div className="relative w-full h-full p-4">
                {spots.map((s, idx) => {
                  const isSelected = selectedSpot?.id === s.id;
                  // Map coordinates loosely inside the card
                  const leftPercent = 15 + ((s.lon - 39.8) / 0.8) * 70;
                  const topPercent = 85 - ((s.lat - 64.5) / 0.5) * 70;
                  const clampedX = Math.max(10, Math.min(85, leftPercent));
                  const clampedY = Math.max(10, Math.min(85, topPercent));

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSpot(s)}
                      style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition transform ${
                        isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition ${
                          isSelected
                            ? 'bg-sky-500 text-white ring-4 ring-sky-500/30'
                            : 'bg-slate-800 border border-slate-700 text-sky-400 group-hover:bg-sky-900'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap pointer-events-none shadow">
                        {s.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Geographic watermark */}
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-600 select-none">
                Дельта Северной Двины • 64°32'N 40°32'E
              </div>
            </div>

            {/* Selected Spot Detail strip */}
            {selectedSpot && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-100">{selectedSpot.name}</h4>
                    <p className="text-xs text-sky-400 font-medium">{selectedSpot.area}</p>
                  </div>
                  <button
                    onClick={() => handleCopyCoords(selectedSpot)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-mono transition"
                  >
                    {copiedId === selectedSpot.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{selectedSpot.lat.toFixed(5)}, {selectedSpot.lon.toFixed(5)}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedSpot.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Целевая рыба:</span>
                    <span className="font-semibold text-slate-200">
                      {selectedSpot.recommendedFish.join(', ')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Сезон лова:</span>
                    <span className="font-semibold text-slate-200">{selectedSpot.season}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Рабочая глубина:</span>
                    <span className="font-semibold text-slate-200">{selectedSpot.depthMeters || '3-6'} м</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Добавил:</span>
                    <span className="font-semibold text-sky-400">{selectedSpot.addedBy}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spots List sidebar */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            База точек лова ({spots.length})
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {spots.map(s => {
              const isSelected = selectedSpot?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSpot(s)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-100">{s.name}</span>
                    <span className="text-[11px] text-slate-500">{s.season}</span>
                  </div>
                  <div className="text-xs text-sky-400 font-medium mb-1.5">{s.area}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Рыба: {s.recommendedFish.slice(0, 2).join(', ')}</span>
                    <span className="font-mono text-slate-500">
                      {s.lat.toFixed(2)}, {s.lon.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Spot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-400" />
                <span>Отметить точку лова</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpot} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Название точки / ориентир</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Свал у 29 лесозавода / Банка Мудьюг"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Широта (Latitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={e => setLat(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Долгота (Longitude)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={e => setLon(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Район / Акватория</label>
                  <input
                    type="text"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Сухое Море / Маймакса"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Сезон</label>
                  <select
                    value={season}
                    onChange={e => setSeason(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Зима (со льда)">Зима (со льда)</option>
                    <option value="Лето / Открытая вода">Лето / Открытая вода</option>
                    <option value="Круглый год">Круглый год</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Рекомендуемая рыба (через запятую)</label>
                <input
                  type="text"
                  value={recommendedFishInput}
                  onChange={e => setRecommendedFishInput(e.target.value)}
                  placeholder="Навага, Корюшка, Окунь, Сиг"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Описание, подъезд и советы</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Как лучше подъехать на снегоходе / машине, при каком ветре клюет..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
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
                  {submitting ? 'Сохранение...' : 'Сохранить точку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
