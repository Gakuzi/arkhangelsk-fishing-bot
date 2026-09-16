import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  Layers,
  Check,
  Copy,
  Plus
} from 'lucide-react';
import { FishingSpot } from '../../types/index.ts';
import { hapticFeedback } from '../../services/telegramWebApp.ts';

interface YandexFishingMapProps {
  spots: FishingSpot[];
  selectedSpot: FishingSpot | null;
  onSelectSpot: (spot: FishingSpot) => void;
  onOpenAddModal?: () => void;
}

export const YandexFishingMap: React.FC<YandexFishingMapProps> = ({
  spots,
  selectedSpot,
  onSelectSpot,
  onOpenAddModal
}) => {
  const [mapType, setMapType] = useState<'map' | 'sat' | 'skl'>('sat'); // Default to satellite for fishing ice/water
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const active = selectedSpot || spots[0] || {
    id: 'default',
    name: 'Сухое море / Мудьюг',
    lat: 64.8820,
    lon: 40.2910,
    area: 'Белое Море'
  };

  const centerLat = active.lat;
  const centerLon = active.lon;

  // Generate Yandex static/interactive map embed URL
  const yandexEmbedUrl = `https://yandex.ru/map-widget/v1/?ll=${centerLon}%2C${centerLat}&z=11&l=${mapType}&pt=${spots
    .map(s => `${s.lon},${s.lat},pm2rdm`)
    .join('~')}`;

  const yandexRouteUrl = `https://yandex.ru/maps/?rtext=~${centerLat}%2C${centerLon}&rtt=auto`;

  const handleCopyCoords = (s: FishingSpot) => {
    hapticFeedback('light');
    const text = `${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header & Layer Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">Рыболовные точки • Яндекс.Карты</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Спутниковые снимки ледовых полей, русел рек и проток дельты Северной Двины
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                hapticFeedback('selection');
                setMapType('sat');
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                mapType === 'sat'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Спутник
            </button>
            <button
              onClick={() => {
                hapticFeedback('selection');
                setMapType('map');
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                mapType === 'map'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Схема
            </button>
            <button
              onClick={() => {
                hapticFeedback('selection');
                setMapType('skl');
              }}
              className={`px-2.5 py-1 rounded-lg transition ${
                mapType === 'skl'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Гибрид
            </button>
          </div>

          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Добавить точку</span>
            </button>
          )}
        </div>
      </div>

      {/* Yandex Map Iframe */}
      <div className="relative w-full h-80 sm:h-96 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
        <iframe
          src={yandexEmbedUrl}
          title="Яндекс Карты Рыболовные точки Архангельска"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          className="w-full h-full filter brightness-95 contrast-105"
        />

        {/* Floating Quick Action: Open in Yandex Maps App */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <a
            href={yandexRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-100 border border-slate-700 text-xs font-medium shadow-xl backdrop-blur transition"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Маршрут в Яндекс.Картах</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Selected Spot Detail Strip */}
      {active && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-100 truncate">{active.name}</span>
              {active.area && (
                <span className="text-[11px] text-slate-400 font-normal truncate">• {active.area}</span>
              )}
            </div>
            {active.description && (
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{active.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => handleCopyCoords(active as FishingSpot)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[11px] font-mono transition"
              title="Скопировать GPS координаты"
            >
              {copiedId === active.id ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
              <span>{active.lat.toFixed(4)}, {active.lon.toFixed(4)}</span>
            </button>

            <a
              href={`https://yandex.ru/maps/?pt=${active.lon},${active.lat}&z=14&l=${mapType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[11px] transition"
            >
              <span>В Яндексе</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      )}

      {/* Spots Quick Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[11px] text-slate-500 whitespace-nowrap mr-1">Локации:</span>
        {spots.map(spot => {
          const isSelected = active.id === spot.id;
          return (
            <button
              key={spot.id}
              onClick={() => {
                hapticFeedback('selection');
                onSelectSpot(spot);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-800 text-slate-100 border-slate-600 font-medium'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span>{spot.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
