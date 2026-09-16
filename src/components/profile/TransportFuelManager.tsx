import React, { useState, useEffect } from 'react';
import {
  Car,
  Fuel,
  Users,
  Calculator,
  Compass,
  Check,
  Save,
  Info,
  Navigation
} from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { hapticFeedback } from '../../services/telegramWebApp.ts';

interface TransportFuelManagerProps {
  user: UserProfile;
  onSaveProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const FUEL_TYPES = [
  'АИ-92',
  'АИ-95',
  'Дизель',
  'Смесь 2Т (бензин+масло)',
  'Газ'
] as const;

const POPULAR_DESTINATIONS = [
  { name: 'Сухое море / Мудьюг', roundtripKm: 170 },
  { name: 'Остров Ягры (Северодвинск)', roundtripKm: 90 },
  { name: 'Луда / Унская губа', roundtripKm: 330 },
  { name: 'Никольское устье', roundtripKm: 70 },
  { name: 'Верховья Северной Двины (Холмогоры)', roundtripKm: 150 }
];

export const TransportFuelManager: React.FC<TransportFuelManagerProps> = ({
  user,
  onSaveProfile
}) => {
  const [transportName, setTransportName] = useState(user.transportName || 'УАЗ Патриот');
  const [totalSeats, setTotalSeats] = useState(user.totalSeats || 5);
  const [availableSeats, setAvailableSeats] = useState(user.availableSeats || 3);
  const [fuelType, setFuelType] = useState<any>(user.fuelType || 'АИ-92');
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(user.fuelPricePerLiter || 58.5);
  const [fuelConsumptionPer100km, setFuelConsumptionPer100km] = useState(user.fuelConsumptionPer100km || 13.0);
  const [tankCapacityLiters, setTankCapacityLiters] = useState(user.tankCapacityLiters || 68);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calculator State
  const [calcDistanceKm, setCalcDistanceKm] = useState(160);
  const [calcPassengers, setCalcPassengers] = useState(3);

  useEffect(() => {
    if (user.transportName) setTransportName(user.transportName);
    if (user.totalSeats != null) setTotalSeats(user.totalSeats);
    if (user.availableSeats != null) setAvailableSeats(user.availableSeats);
    if (user.fuelType) setFuelType(user.fuelType);
    if (user.fuelPricePerLiter != null) setFuelPricePerLiter(user.fuelPricePerLiter);
    if (user.fuelConsumptionPer100km != null) setFuelConsumptionPer100km(user.fuelConsumptionPer100km);
    if (user.tankCapacityLiters != null) setTankCapacityLiters(user.tankCapacityLiters);
  }, [user]);

  // Derived calculations
  const costPerKm = (fuelConsumptionPer100km / 100) * fuelPricePerLiter;
  const totalTripFuelLiters = (calcDistanceKm / 100) * fuelConsumptionPer100km;
  const totalTripFuelCost = totalTripFuelLiters * fuelPricePerLiter;
  const costPerCrewMember = calcPassengers > 0 ? totalTripFuelCost / calcPassengers : totalTripFuelCost;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      hapticFeedback('medium');
      await onSaveProfile({
        transportName,
        totalSeats: Number(totalSeats),
        availableSeats: Number(availableSeats),
        fuelType,
        fuelPricePerLiter: Number(fuelPricePerLiter),
        fuelConsumptionPer100km: Number(fuelConsumptionPer100km),
        tankCapacityLiters: Number(tankCapacityLiters)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-slate-100">Транспорт и расчет расхода топлива</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Параметры машины или техники для справедливого деления расходов на бензин
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          Расход: <span className="text-emerald-400 font-bold">{costPerKm.toFixed(2)} ₽/км</span>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Марка / техника</label>
            <input
              type="text"
              value={transportName}
              onChange={e => setTransportName(e.target.value)}
              placeholder="УАЗ Патриот / Нива / Собака"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Всего посадочных мест</label>
            <input
              type="number"
              min="1"
              max="12"
              value={totalSeats}
              onChange={e => setTotalSeats(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Свободно для попутчиков</label>
            <input
              type="number"
              min="0"
              max={totalSeats}
              value={availableSeats}
              onChange={e => setAvailableSeats(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Тип топлива</label>
            <select
              value={fuelType}
              onChange={e => setFuelType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            >
              {FUEL_TYPES.map(ft => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Расход (л / 100 км)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="60"
              value={fuelConsumptionPer100km}
              onChange={e => setFuelConsumptionPer100km(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Цена за литр (₽)</label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="150"
              value={fuelPricePerLiter}
              onChange={e => setFuelPricePerLiter(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Объем бака (л)</label>
            <input
              type="number"
              min="5"
              max="200"
              value={tankCapacityLiters}
              onChange={e => setTankCapacityLiters(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-medium transition"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-sky-400" />}
            <span>{saving ? 'Сохранение...' : saved ? 'Сохранено!' : 'Сохранить настройки транспорта'}</span>
          </button>
        </div>
      </form>

      {/* Interactive Trip Cost Calculator */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Калькулятор затрат на выезд
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Автоматический подсчет</span>
        </div>

        {/* Popular Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] text-slate-500 whitespace-nowrap mr-1">Маршруты:</span>
          {POPULAR_DESTINATIONS.map(dest => (
            <button
              key={dest.name}
              type="button"
              onClick={() => {
                hapticFeedback('selection');
                setCalcDistanceKm(dest.roundtripKm);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition whitespace-nowrap ${
                calcDistanceKm === dest.roundtripKm
                  ? 'bg-slate-800 text-slate-100 border-slate-600'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {dest.name} ({dest.roundtripKm} км)
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Дистанция туда и обратно:</span>
              <span className="font-mono text-slate-200 font-bold">{calcDistanceKm} км</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={calcDistanceKm}
              onChange={e => setCalcDistanceKm(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Человек в экипаже:</span>
              <span className="font-mono text-slate-200 font-bold">{calcPassengers} чел.</span>
            </div>
            <input
              type="range"
              min="1"
              max={Math.max(1, totalSeats)}
              value={calcPassengers}
              onChange={e => setCalcPassengers(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Results Summary Box */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-850 text-center">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Топлива уйдет</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              {totalTripFuelLiters.toFixed(1)} л
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Всего на бензин</div>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              {Math.round(totalTripFuelCost)} ₽
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
            <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">С каждого рыбака</div>
            <div className="text-base font-extrabold text-emerald-300 mt-0.5">
              {Math.round(costPerCrewMember)} ₽
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
