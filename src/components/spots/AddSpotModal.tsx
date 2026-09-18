import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  X,
  Send,
  Navigation,
  Check,
  AlertCircle,
  HelpCircle,
  Fish,
  Layers,
  Sparkles
} from 'lucide-react';
import { FishingSpot, UserProfile } from '../../types/index.ts';
import {
  requestTelegramLocation,
  isInsideTelegram,
  sendDataToBot,
  hapticFeedback
} from '../../services/telegramWebApp.ts';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSpot: (spot: Partial<FishingSpot>) => Promise<void>;
  editingSpot?: FishingSpot | null;
  activeUser: UserProfile | null;
  initialLat?: number;
  initialLon?: number;
}

const REGION_PRESETS = [
  { name: 'Сухое Море / Остров Мудьюг', lat: 64.8820, lon: 40.2910, fish: 'Навага, Корюшка, Сиг', depth: '4-7' },
  { name: 'Маймакса / 26 л/з протока', lat: 64.6200, lon: 40.5200, fish: 'Окунь, Налим, Сорога', depth: '3-5' },
  { name: 'Никольское устье (Белое море)', lat: 64.5500, lon: 40.2500, fish: 'Корюшка, Навага', depth: '3-6' },
  { name: 'Северодвинск (о. Ягры / Прилив)', lat: 64.6000, lon: 39.8500, fish: 'Навага, Корюшка', depth: '2-5' },
  { name: 'Лапоминка / Вход в Сухое море', lat: 64.8100, lon: 40.4500, fish: 'Навага, Сиг', depth: '4-6' },
  { name: 'Уйма / Дельта Северной Двины', lat: 64.4500, lon: 40.7500, fish: 'Лещ, Окунь, Щука', depth: '2-4' }
];

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  onSaveSpot,
  editingSpot,
  activeUser,
  initialLat = 64.8820,
  initialLon = 40.2910
}) => {
  const [name, setName] = useState(editingSpot?.name || '');
  const [description, setDescription] = useState(editingSpot?.description || '');
  const [area, setArea] = useState(editingSpot?.area || 'Сухое Море / Мудьюг');
  const [lat, setLat] = useState<number>(editingSpot?.lat ?? initialLat);
  const [lon, setLon] = useState<number>(editingSpot?.lon ?? initialLon);
  const [recommendedFish, setRecommendedFish] = useState(
    editingSpot?.recommendedFish?.join(', ') || 'Навага, Корюшка'
  );
  const [depthMeters, setDepthMeters] = useState(editingSpot?.depthMeters || '4-6');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const inTelegram = isInsideTelegram();

  // Request location using Telegram LocationManager or browser GPS
  const handleRequestTelegramLocation = async () => {
    setLocating(true);
    setLocationError(null);
    setLocationSuccess(null);
    hapticFeedback('medium');

    try {
      const loc = await requestTelegramLocation();
      if (loc && typeof loc.lat === 'number' && typeof loc.lon === 'number') {
        setLat(Number(loc.lat.toFixed(5)));
        setLon(Number(loc.lon.toFixed(5)));
        const sourceText = loc.source === 'telegram_native' ? 'Telegram GPS' : 'GPS устройства';
        setLocationSuccess(`Координаты определены через ${sourceText}: ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`);
        hapticFeedback('success');
      } else {
        setLocationError('Не удалось получить координаты. Разрешите доступ к геолокации в Telegram или выберите точку на карте.');
        hapticFeedback('error');
      }
    } catch (err: any) {
      setLocationError('Ошибка запроса геопозиции: ' + (err.message || 'нет доступа'));
      hapticFeedback('error');
    } finally {
      setLocating(false);
    }
  };

  const handleSelectPreset = (preset: typeof REGION_PRESETS[0]) => {
    setArea(preset.name);
    setLat(preset.lat);
    setLon(preset.lon);
    setRecommendedFish(preset.fish);
    setDepthMeters(preset.depth);
    if (!name) {
      setName(`Точка: ${preset.name}`);
    }
    hapticFeedback('selection');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const payload: Partial<FishingSpot> = {
        name: name.trim(),
        description: description.trim() || 'Рыбная точка в Поморье',
        area: area.trim(),
        lat: Number(lat),
        lon: Number(lon),
        recommendedFish: recommendedFish.split(',').map(s => s.trim()).filter(Boolean),
        depthMeters: depthMeters.trim() || '3-5',
        season: 'Круглый год',
        addedBy: activeUser?.name || 'Рыбак'
      };

      await onSaveSpot(payload);

      // If inside Telegram, notify bot via sendData
      if (inTelegram) {
        sendDataToBot({
          action: 'add_spot',
          name: payload.name,
          description: payload.description,
          lat: payload.lat,
          lon: payload.lon,
          area: payload.area
        });
      }

      hapticFeedback('success');
      onClose();
    } catch (err) {
      console.error(err);
      hapticFeedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="liquid-glass-card rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col border border-white/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-200/50 shadow-sm">
              <MapPin className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {editingSpot ? 'Редактировать точку' : 'Добавить точку лова'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {inTelegram
                  ? 'Встроенные функции карты и геолокации Telegram'
                  : 'Отметка координат на карте и параметры лова'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Telegram Native GPS / Location Button */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/60 border border-sky-100 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600 animate-pulse" />
                <span className="font-bold text-slate-800 text-xs">
                  Геолокация Telegram
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-200/60 text-sky-800">
                {inTelegram ? 'Telegram WebApp' : 'GPS Навигация'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Отметьте точку, в которой находитесь, или укажите координаты через встроенную функцию геолокации.
            </p>

            <button
              type="button"
              onClick={handleRequestTelegramLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              <span>
                {locating ? 'Определение координат...' : '📍 Получить точку через Telegram (GPS)'}
              </span>
            </button>

            {locationSuccess && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{locationSuccess}</span>
              </div>
            )}

            {locationError && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}
          </div>

          {/* Quick Region Presets */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Быстрый выбор проверенного района Поморья:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {REGION_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2 rounded-xl text-left border transition text-[11px] ${
                    area === p.name
                      ? 'bg-sky-100/90 border-sky-300 text-sky-900 font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="truncate font-medium">{p.name.split('/')[0].trim()}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.fish.split(',')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Название точки <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например: Кромка торосов у Мудьюга"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Район / Водоём
              </label>
              <input
                type="text"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="Сухое море, Маймакса, Никольское..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Description (Requested feature) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Описание точки и условий лова <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Опишите глубину, состояние льда, подъезд (на машине/собаке/пешком), на какую наживку берёт..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              required
            />
          </div>

          {/* Coordinates Lat & Lon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Широта (Lat)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={e => setLat(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Долгота (Lon)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={e => setLon(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-medium"
                required
              />
            </div>
          </div>

          {/* Fish & Depth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Рекомендуемая рыба
              </label>
              <input
                type="text"
                value={recommendedFish}
                onChange={e => setRecommendedFish(e.target.value)}
                placeholder="Корюшка, Навага, Сиг, Окунь"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Глубина в точке (метры)
              </label>
              <input
                type="text"
                value={depthMeters}
                onChange={e => setDepthMeters(e.target.value)}
                placeholder="4-6 м"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          {/* Map Preview Link / Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>
                Координаты для навигатора: <b>{lat.toFixed(4)}, {lon.toFixed(4)}</b>
              </span>
            </div>
            <a
              href={`https://yandex.ru/maps/?rtext=~${lat}%2C${lon}&rtt=auto`}
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:text-sky-700 font-semibold underline underline-offset-2"
            >
              Яндекс.Карты
            </a>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-md shadow-sky-500/25 active:scale-95 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'Сохранение...' : editingSpot ? 'Сохранить изменения' : 'Сохранить точку'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
