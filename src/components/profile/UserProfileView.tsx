import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  Send,
  MapPin,
  Anchor,
  Award,
  Edit3,
  Save,
  CheckCircle2,
  Fish,
  Compass
} from 'lucide-react';
import { UserProfile, TripHistory, PlannedTrip } from '../../types/index.ts';

interface UserProfileViewProps {
  user: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void>;
  history: TripHistory[];
  trips: PlannedTrip[];
}

const FISHING_STYLES = [
  'Зимняя со льда',
  'Мормышка фосфорная',
  'Балансир на окуня',
  'Зимняя блесна',
  'Спиннинг и джиг',
  'Троллинг по Двине',
  'Донка / Фидер',
  'Поплавочная снасть'
];

const BOAT_TYPES: UserProfile['boatType'][] = [
  'Без техники',
  'Мотособака / Буксировщик',
  'Снегоход',
  'Лодка ПВХ с мотором',
  'Катер'
];

const EXPERIENCE_LEVELS: UserProfile['experienceLevel'][] = [
  'Новичок',
  'Любитель',
  'Опытный',
  'Бывалый помор'
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onSaveProfile,
  history,
  trips
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername);
  const [phone, setPhone] = useState(user.phone || '');
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel);
  const [boatType, setBoatType] = useState(user.boatType);
  const [homeDistrict, setHomeDistrict] = useState(user.homeDistrict);
  const [bio, setBio] = useState(user.bio || '');
  const [fishingStyles, setFishingStyles] = useState<string[]>(user.fishingStyles || []);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    setName(user.name);
    setTelegramUsername(user.telegramUsername);
    setPhone(user.phone || '');
    setExperienceLevel(user.experienceLevel);
    setBoatType(user.boatType);
    setHomeDistrict(user.homeDistrict);
    setBio(user.bio || '');
    setFishingStyles(user.fishingStyles || []);
  }, [user]);

  // Compute stats
  const userHistory = history.filter(h => h.userId === user.id || h.authorName === user.name);
  const userTrips = trips.filter(t => t.participants.some(p => p.userId === user.id));

  const totalCatchesWeight = userHistory.reduce((acc, h) => {
    return acc + h.catches.reduce((sub, c) => sub + (c.weightKg || 0), 0);
  }, 0);

  const totalTrophies = userHistory.reduce((acc, h) => {
    return acc + h.catches.filter(c => c.isTrophy).length;
  }, 0);

  const toggleStyle = (style: string) => {
    if (fishingStyles.includes(style)) {
      setFishingStyles(fishingStyles.filter(s => s !== style));
    } else {
      setFishingStyles([...fishingStyles, style]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        name,
        telegramUsername,
        phone,
        experienceLevel,
        boatType,
        homeDistrict,
        bio,
        fishingStyles
      });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border-2 border-sky-500/40 overflow-hidden shrink-0 shadow-lg shadow-sky-950/60 flex items-center justify-center text-2xl font-bold text-sky-400">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {user.experienceLevel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                <span className="flex items-center gap-1 text-sky-400 font-mono">
                  <Send className="w-3.5 h-3.5" />
                  @{user.telegramUsername}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {user.homeDistrict}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Anchor className="w-3.5 h-3.5 text-amber-400" />
                  {user.boatType}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition shadow"
          >
            <Edit3 className="w-4 h-4 text-sky-400" />
            <span>{isEditing ? 'Отмена' : 'Редактировать профиль'}</span>
          </button>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Участие в выездах</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{userTrips.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Отчетов в журнале</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">{userHistory.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Поймано рыбы (кг)</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {totalCatchesWeight.toFixed(1)} кг
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">Трофейных хвостов</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{totalTrophies} 🏆</div>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Профиль рыбака успешно обновлен и синхронизирован с Telegram ботом!</span>
        </div>
      )}

      {/* Edit Form or Details View */}
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-semibold text-slate-100 text-base flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span>Настройка профиля рыбака</span>
            </h3>
            <span className="text-xs text-slate-400">Синхронизируется с ботом @{telegramUsername}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Имя и Фамилия</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telegram Username (без @)
              </label>
              <input
                type="text"
                value={telegramUsername}
                onChange={e => setTelegramUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Телефон для связи в экипаже</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Район проживания</label>
              <input
                type="text"
                value={homeDistrict}
                onChange={e => setHomeDistrict(e.target.value)}
                placeholder="Архангельск / Северодвинск / Приморский р-н"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Опыт и статус</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {EXPERIENCE_LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Техника / Транспорт на водоеме</label>
              <select
                value={boatType}
                onChange={e => setBoatType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {BOAT_TYPES.map(bt => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Предпочитаемые стили ловли и снасти:
            </label>
            <div className="flex flex-wrap gap-2">
              {FISHING_STYLES.map(style => (
                <button
                  type="button"
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    fishingStyles.includes(style)
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">О себе и любимых местах Поморья</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажите об опыте, на каких реках/заливах чаще бываете..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition shadow-md shadow-sky-950"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider text-sky-400">
                Снасти и рыболовные стили
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.fishingStyles?.map(st => (
                  <span
                    key={st}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    🎣 {st}
                  </span>
                ))}
              </div>

              {user.bio && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-1">О рыбаке:</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>

            {/* User's recent fishing entries */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider text-sky-400 mb-4">
                Последние рыбалки {user.name}
              </h3>
              {userHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Вы еще не добавили ни одного отчета об улове в журнал.
                </div>
              ) : (
                <div className="space-y-3">
                  {userHistory.map(h => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{h.location}</span>
                        <span className="text-slate-500 font-mono">{h.date}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{h.review}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        {h.catches.map((c, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded ${
                              c.isTrophy
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {c.species}: {c.count} шт ({c.weightKg} кг) {c.isTrophy && '🏆'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact & Info Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider text-sky-400">
                Связь в экипаже
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-0.5 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>Telegram для координации:</span>
                  </div>
                  <div className="font-semibold text-slate-200 font-mono text-sm">
                    @{user.telegramUsername}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Телефон:</span>
                  </div>
                  <div className="font-semibold text-slate-200 font-mono text-sm">
                    {user.phone || 'Не указан'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-0.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Статус в клубе:</span>
                  </div>
                  <div className="font-medium text-slate-200">
                    Верифицированный поморский рыбак
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
