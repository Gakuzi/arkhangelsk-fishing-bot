import React, { useState } from 'react';
import { MapPin, Navigation, Plus, ExternalLink, Compass } from 'lucide-react';
import { FishingSpot } from '../types.ts';

interface FishingSpotsMapProps {
  spots: FishingSpot[];
  onSpotAdded: () => void;
}

const PRESET_SPOTS = [
  { name: 'Сухое море / Мудьюг', lat: 64.8564, lon: 40.2812, desc: 'Навага, корюшка, сиговые' },
  { name: 'Маймаксанский рукав', lat: 64.5381, lon: 40.5234, desc: 'Окунь, щука, язь' },
  { name: 'Остров Ягры (Северодвинск)', lat: 64.6012, lon: 39.8450, desc: 'Камбала, навага на отливе' },
  { name: 'Никольское устье', lat: 64.5520, lon: 40.2100, desc: 'Лещ, плотва, судак' },
  { name: 'Уемля (Приморский район)', lat: 64.4421, lon: 40.8540, desc: 'Судак, окунь на перекатах' }
];

export const FishingSpotsMap: React.FC<FishingSpotsMapProps> = ({ spots, onSpotAdded }) => {
  const [userName, setUserName] = useState('Рыбак_Севера');
  const [spotName, setSpotName] = useState('');
  const [lat, setLat] = useState('64.54');
  const [lon, setLon] = useState('40.53');
  const [areaDescription, setAreaDescription] = useState('Хороший клев на блесну');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBotReply, setLastBotReply] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lon) return;

    setIsSubmitting(true);
    setLastBotReply(null);

    try {
      const res = await fetch('/api/spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userName,
          name: spotName || `Точка в дельте (${lat}, ${lon})`,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          areaDescription
        })
      });
      const data = await res.json();
      if (data.botReply) {
        setLastBotReply(data.botReply);
      }
      setSpotName('');
      onSpotAdded();
    } catch (err) {
      console.error('Error adding spot:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_SPOTS[0]) => {
    setSpotName(preset.name);
    setLat(preset.lat.toString());
    setLon(preset.lon.toString());
    setAreaDescription(preset.desc);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Карта и Координаты Лова</h2>
            <p className="text-xs text-slate-400">Архангельск, дельта Северной Двины, Белое Море</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
          {spots.length} точек
        </span>
      </div>

      {lastBotReply && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200">
          <div className="font-semibold text-emerald-400 mb-0.5">Ответ бота Spark:</div>
          <div dangerouslySetInnerHTML={{ __html: lastBotReply }} />
        </div>
      )}

      {/* Preset Quick Buttons */}
      <div className="mt-3">
        <div className="text-[11px] font-medium text-slate-400 mb-1.5">Быстрый выбор рыбных мест Поморья:</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SPOTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 hover:border-slate-600 text-slate-300 border border-slate-700/60 transition flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spot List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-56 pr-1">
        {spots.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">Точки лова еще не добавлены</div>
        ) : (
          spots.map(s => (
            <div
              key={s.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{s.name || 'Точка на карте'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.areaDescription}</div>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{s.timestamp}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                <span className="font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/50">
                  {s.lat.toFixed(4)}, {s.lon.toFixed(4)}
                </span>
                <span className="text-slate-500">Прислал: {s.user}</span>
                <a
                  href={`https://yandex.ru/maps/?pt=${s.lon},${s.lat}&z=13&l=map`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 transition"
                >
                  <span>На карте</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Spot Form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Отправить новую точку (эмуляция msg.location в бот)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Ваше имя"
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
          />
          <input
            type="text"
            value={spotName}
            onChange={e => setSpotName(e.target.value)}
            placeholder="Название места"
            className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">Шир:</span>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-transparent text-slate-200 font-mono focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500">Долг:</span>
            <input
              type="number"
              step="0.0001"
              value={lon}
              onChange={e => setLon(e.target.value)}
              className="w-full bg-transparent text-slate-200 font-mono focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-950"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Отправить координаты в бот</span>
        </button>
      </form>
    </div>
  );
};
