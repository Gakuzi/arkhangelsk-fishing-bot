import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  CalendarDays,
  Layers,
  X,
  Fish
} from 'lucide-react';
import { FishingSpot, UserProfile } from '../../types/index.ts';
import { hapticFeedback } from '../../services/telegramWebApp.ts';
import { AddSpotModal } from './AddSpotModal.tsx';

interface FishingSpotsViewProps {
  spots: FishingSpot[];
  activeUser: UserProfile | null;
  onAddSpot: (spot: any) => Promise<void>;
  onEditSpot?: (id: string, spot: any) => Promise<void>;
  onDeleteSpot?: (id: string) => Promise<void>;
  onCreateTripWithSpot?: (spot: FishingSpot) => void;
}

export const FishingSpotsView: React.FC<FishingSpotsViewProps> = ({
  spots,
  activeUser,
  onAddSpot,
  onEditSpot,
  onDeleteSpot,
  onCreateTripWithSpot
}) => {
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(spots[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<FishingSpot | null>(null);
  const [mapType, setMapType] = useState<'sat' | 'map'>('sat');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const active = selectedSpot || spots[0] || {
    id: 'default',
    name: 'Сухое море / Мудьюг',
    lat: 64.8820,
    lon: 40.2910,
    area: 'Белое Море'
  };

  const handleOpenAdd = () => {
    setEditingSpot(null);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleOpenEdit = (spot: FishingSpot) => {
    setEditingSpot(spot);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleCopy = (spot: FishingSpot) => {
    hapticFeedback('light');
    const text = `${spot.lat.toFixed(5)}, ${spot.lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(spot.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Точки лова и карта
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              Яндекс.Карты
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Спутниковые снимки ледовых полей, проток дельты Двины и проверенные уловистые места
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-sky-500/25 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить точку</span>
        </button>
      </div>

      {/* Main Map Box */}
      <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 overflow-hidden space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-slate-800 truncate">
              {active.name}
            </span>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              ({active.lat.toFixed(4)}, {active.lon.toFixed(4)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Map Mode selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMapType('sat')}
                className={`px-3 py-1 rounded-lg transition ${
                  mapType === 'sat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Спутник
              </button>
              <button
                onClick={() => setMapType('map')}
                className={`px-3 py-1 rounded-lg transition ${
                  mapType === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Схема
              </button>
            </div>

            <a
              href={`https://yandex.ru/maps/?rtext=~${active.lat}%2C${active.lon}&rtt=auto`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">В Навигатор</span>
            </a>
          </div>
        </div>

        {/* Interactive Yandex Map iFrame with all spots pinned */}
        <div className="rounded-2xl overflow-hidden h-[340px] sm:h-[420px] border border-slate-200 relative bg-slate-100 shadow-inner">
          <iframe
            src={`https://yandex.ru/map-widget/v1/?ll=${active.lon}%2C${active.lat}&z=11&l=${mapType}&pt=${spots
              .map(s => `${s.lon},${s.lat},pm2rdm`)
              .join('~')}`}
            className="w-full h-full border-0"
            title="Рыболовная карта Архангельской области"
          />
        </div>
      </div>

      {/* Spots Grid / Cards with Edit & Delete */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 px-1">
          Сохранённые точки ({spots.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {spots.map(spot => {
            const isSelected = selectedSpot?.id === spot.id;
            return (
              <div
                key={spot.id}
                onClick={() => {
                  setSelectedSpot(spot);
                  hapticFeedback('selection');
                }}
                className={`liquid-glass-card rounded-2xl p-4 cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                    : 'border-white/90 hover:border-sky-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">
                        {spot.name}
                      </h4>
                      <p className="text-xs text-sky-600 font-medium mt-0.5">
                        {spot.area}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleCopy(spot);
                        }}
                        title="Скопировать координаты"
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500"
                      >
                        {copiedId === spot.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenEdit(spot);
                        }}
                        title="Редактировать точку"
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-sky-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteSpot && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm(`Удалить точку "${spot.name}"?`)) {
                              hapticFeedback('heavy');
                              onDeleteSpot(spot.id);
                            }
                          }}
                          title="Удалить точку"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fish & Depth */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 font-medium border border-sky-100">
                      🐟 {spot.recommendedFish?.join(', ') || 'Любая рыба'}
                    </span>
                    {spot.depthMeters && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
                        Глубина: {spot.depthMeters} м
                      </span>
                    )}
                  </div>

                  {spot.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {spot.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[10px]">
                    {spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}
                  </span>

                  {onCreateTripWithSpot && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onCreateTripWithSpot(spot);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold text-[11px] flex items-center gap-1 transition"
                    >
                      <CalendarDays className="w-3 h-3" />
                      <span>Рыбалка сюда</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD / EDIT SPOT MODAL */}
      <AddSpotModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSpot(null);
        }}
        onSaveSpot={async (spotData) => {
          if (editingSpot && onEditSpot) {
            await onEditSpot(editingSpot.id, spotData);
          } else {
            await onAddSpot(spotData);
          }
        }}
        editingSpot={editingSpot}
        activeUser={activeUser}
        initialLat={active.lat}
        initialLon={active.lon}
      />
    </div>
  );
};
