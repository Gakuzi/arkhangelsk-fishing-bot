import React, { useState } from 'react';
import {
  User,
  Phone,
  Send,
  MapPin,
  Car,
  Fuel,
  Compass,
  Check,
  Save,
  RotateCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../../types/index.ts';
import { isInsideTelegram, hapticFeedback } from '../../services/telegramWebApp.ts';

interface UserProfileViewProps {
  user: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onRefresh?: () => void;
}

const DISTRICT_PRESETS = [
  'Архангельск (Октябрьский / Центр)',
  'Архангельск (Соломбала)',
  'Архангельск (Маймакса / 26 л/з)',
  'Архангельск (Варавино-Фактория)',
  'Северодвинск (о. Ягры)',
  'Северодвинск (Центр)',
  'Новодвинск',
  'Приморский район (Лапоминка / Уйма)'
];

const BOAT_TYPES: UserProfile['boatType'][] = [
  'Без техники',
  'Мотособака / Буксировщик',
  'Снегоход',
  'Лодка ПВХ с мотором',
  'Катер'
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onSaveProfile,
  onRefresh
}) => {
  const inTelegram = isInsideTelegram();

  // Personal Fields
  const [name, setName] = useState(user.name);
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [homeDistrict, setHomeDistrict] = useState(user.homeDistrict || DISTRICT_PRESETS[0]);
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || 'Любитель');
  const [boatType, setBoatType] = useState(user.boatType || 'Без техники');
  const [bio, setBio] = useState(user.bio || '');

  // Transport & Fuel settings
  const [transportName, setTransportName] = useState(user.transportName || 'УАЗ Патриот 4x4');
  const [availableSeats, setAvailableSeats] = useState(user.availableSeats ?? 3);
  const [fuelType, setFuelType] = useState(user.fuelType || 'АИ-92');
  const [fuelConsumption, setFuelConsumption] = useState(user.fuelConsumptionPer100km ?? 11.5);
  const [fuelPrice, setFuelPrice] = useState(user.fuelPricePerLiter ?? 56.5);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSaveProfile({
        name: name.trim(),
        telegramUsername: telegramUsername.replace('@', '').trim(),
        phone: phone.trim(),
        homeDistrict,
        experienceLevel,
        boatType,
        bio: bio.trim(),
        transportName: transportName.trim(),
        availableSeats: Number(availableSeats),
        fuelType,
        fuelConsumptionPer100km: Number(fuelConsumption),
        fuelPricePerLiter: Number(fuelPrice)
      });
      setSavedSuccess(true);
      hapticFeedback('success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Top Profile Header Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-white shadow-lg overflow-hidden flex items-center justify-center text-white text-2xl font-bold shrink-0 relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{name[0] || 'Р'}</span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              {name || 'Рыбак Поморья'}
            </h1>
            {inTelegram && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Telegram синхронизирован
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-sky-600 font-medium mt-1">
            {telegramUsername ? `@${telegramUsername}` : 'Без никнейма'} • {homeDistrict}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3 text-xs">
            <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-semibold border border-sky-100">
              Статус: {experienceLevel}
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium">
              Техника: {boatType}
            </span>
            {transportName && (
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-sky-600" />
                {transportName} ({availableSeats} мест)
              </span>
            )}
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              onRefresh();
            }}
            title="Обновить профиль из Telegram"
            className="p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 border border-slate-200 shadow-sm transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Личные данные */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">
              Личные данные рыбака
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Имя или позывной
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Telegram @username (для связи в экипаже)
              </label>
              <div className="relative">
                <Send className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={e => setTelegramUsername(e.target.value)}
                  placeholder="ivan_rybak"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Телефон (для экстренной связи на льду)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (900) 000-00-00"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Район проживания / сбора
              </label>
              <select
                value={homeDistrict}
                onChange={e => setHomeDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              >
                {DISTRICT_PRESETS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Автомобиль, техника и расчет топлива */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Car className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Транспорт и расчет топлива
              </h2>
              <p className="text-xs text-slate-400">
                Параметры автоматически используются при планировании рыбалки и делёжке расходов
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Автомобиль / Снегоход
              </label>
              <input
                type="text"
                value={transportName}
                onChange={e => setTransportName(e.target.value)}
                placeholder="УАЗ Патриот, Нива, Буран..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Свободных пассажирских мест: {availableSeats}
              </label>
              <input
                type="range"
                min="0"
                max="6"
                value={availableSeats}
                onChange={e => setAvailableSeats(Number(e.target.value))}
                className="w-full accent-sky-500 mt-2"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Средний расход (л / 100 км)
              </label>
              <input
                type="number"
                step="0.5"
                value={fuelConsumption}
                onChange={e => setFuelConsumption(Number(e.target.value))}
                placeholder="11.5"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Цена топлива за 1 литр (₽)
              </label>
              <input
                type="number"
                step="0.5"
                value={fuelPrice}
                onChange={e => setFuelPrice(Number(e.target.value))}
                placeholder="56.5"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Снаряжение и опыт */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Compass className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">
              Опыт и снаряжение
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Опыт рыбалки
              </label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium"
              >
                <option value="Новичок">Новичок (первые выезды)</option>
                <option value="Любитель">Любитель (выходные на льду)</option>
                <option value="Опытный">Опытный (знаю фарватер и приливы)</option>
                <option value="Бывалый помор">Бывалый помор (рыбачу с детства)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Техника на водоеме
              </label>
              <select
                value={boatType}
                onChange={e => setBoatType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium"
              >
                {BOAT_TYPES.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                О себе / Имеющееся снаряжение
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={2}
                placeholder="Ледобур 130мм, зимняя палатка Куб, санки-волокуши, запасной черпак..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-200 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Профиль успешно сохранен</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-sky-500/25 active:scale-95 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Сохранение...' : 'Сохранить профиль'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
