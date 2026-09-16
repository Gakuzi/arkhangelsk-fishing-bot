import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  Send,
  MapPin,
  Car,
  Package,
  Calendar,
  Fish,
  Edit3,
  Save,
  Check,
  Plus,
  Share2,
  Clock,
  Compass,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { UserProfile, TripHistory, PlannedTrip, FishingSpot } from '../../types/index.ts';
import { GearManager } from './GearManager.tsx';
import { TransportFuelManager } from './TransportFuelManager.tsx';
import { YandexFishingMap } from '../spots/YandexFishingMap.tsx';
import { openTelegramLink, isInsideTelegram, getTelegramUser, hapticFeedback } from '../../services/telegramWebApp.ts';

interface UserProfileViewProps {
  user: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<void>;
  history: TripHistory[];
  trips: PlannedTrip[];
  spots: FishingSpot[];
  onCreateTrip: (trip: any) => Promise<void>;
  onAddSpot?: (spot: any) => Promise<void>;
  onAddHistory?: (entry: any) => Promise<void>;
}

type CabinetSubTab = 'gear' | 'transport' | 'trips' | 'map' | 'history' | 'edit';

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
  trips,
  spots,
  onCreateTrip,
  onAddSpot,
  onAddHistory
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CabinetSubTab>('gear');

  // Edit Profile fields
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

  // Quick Plan Trip Form State
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripTitle, setTripTitle] = useState('Выезд за навагой на Мудьюг');
  const [tripDestination, setTripDestination] = useState('Остров Мудьюг / Сухое Море');
  const [tripDate, setTripDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [tripTime, setTripTime] = useState('06:00');
  const [tripPlace, setTripPlace] = useState('Пос. Лапоминка / причал');
  const [tripDistanceKm, setTripDistanceKm] = useState(160);
  const [tripCrewMax, setTripCrewMax] = useState(user.availableSeats ? user.availableSeats + 1 : 4);
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [lastSharedUrl, setLastSharedUrl] = useState<string | null>(null);

  // Selected map spot
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(spots[0] || null);

  // Quick Catch Log Modal State
  const [showCatchModal, setShowCatchModal] = useState(false);
  const [catchFish, setCatchFish] = useState('Навага беломорская');
  const [catchWeight, setCatchWeight] = useState(3.5);
  const [catchCount, setCatchCount] = useState(25);
  const [catchLocation, setCatchLocation] = useState('Сухое море');
  const [submittingCatch, setSubmittingCatch] = useState(false);

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

  // Derived user statistics
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
      hapticFeedback('medium');
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
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setActiveSubTab('gear');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Plan Trip from Cabinet and Share to Telegram
  const handleCreateAndShareTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTrip(true);
    try {
      hapticFeedback('success');

      // Fuel calculations based on user's vehicle
      const consumption = user.fuelConsumptionPer100km || 12.0;
      const fuelPrice = user.fuelPricePerLiter || 58.0;
      const fuelCostTotal = Math.round((tripDistanceKm / 100) * consumption * fuelPrice);
      const costPerPerson = tripCrewMax > 0 ? Math.round(fuelCostTotal / tripCrewMax) : fuelCostTotal;

      await onCreateTrip({
        organizerId: user.id,
        organizerName: user.name,
        title: tripTitle,
        destination: tripDestination,
        targetFish: ['Навага', 'Корюшка'],
        date: tripDate,
        meetTime: tripTime,
        meetPlace: tripPlace,
        transportType: user.transportName || 'Автотранспорт',
        maxCrew: tripCrewMax,
        checklist: ['Удочки с мормышками', 'Теплая одежда', 'Термос с чаем'],
        status: 'Набор открыт',
        distanceKm: tripDistanceKm,
        fuelCostTotal,
        costPerPerson,
        fuelType: user.fuelType || 'АИ-92',
        notes: `Сбор у "${tripPlace}". Расходы на бензин (~${costPerPerson} ₽ с человека).`
      });

      setShowTripModal(false);

      // Share directly to Telegram
      const shareText = encodeURIComponent(
        `🎣 Приглашаю на рыбалку: "${tripTitle}"\n📍 Место: ${tripDestination}\n📅 Дата: ${tripDate} в ${tripTime}\n🚗 Сбор: ${tripPlace}\n👥 Свободно мест: ${tripCrewMax - 1}\n⛽ Бензин: ~${costPerPerson} ₽ с рыбака\n\nЗаписаться в экипаж можно через бот:`
      );
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/fishing_pomor_bot')}&text=${shareText}`;
      setLastSharedUrl(tgUrl);
      openTelegramLink(tgUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTrip(false);
    }
  };

  const handleShareExistingTrip = (trip: PlannedTrip) => {
    hapticFeedback('light');
    const freeSeats = Math.max(0, trip.maxCrew - trip.participants.length);
    const fuelNote = trip.costPerPerson ? `\n⛽ Доля за бензин: ~${trip.costPerPerson} ₽` : '';
    const shareText = encodeURIComponent(
      `🎣 Рыбацкий выезд: "${trip.title}" (${trip.destination})\n📅 Дата: ${trip.date} в ${trip.meetTime}\n📍 Сбор: ${trip.meetPlace}\n👥 Свободных мест: ${freeSeats} из ${trip.maxCrew}${fuelNote}\n\nЗаходи в экипаж:`
    );
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/fishing_pomor_bot')}&text=${shareText}`);
  };

  // Add Catch handler
  const handleQuickAddCatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddHistory) return;

    setSubmittingCatch(true);
    try {
      hapticFeedback('success');
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

      await onAddHistory({
        userId: user.id,
        authorName: user.name,
        date: dateStr,
        location: catchLocation,
        weather: 'Ясно, умеренный ветер',
        durationHours: 5,
        catches: [
          {
            species: catchFish,
            weightKg: Number(catchWeight),
            count: Number(catchCount),
            isTrophy: Number(catchWeight) > 5
          }
        ],
        gearUsed: ['Зимняя удилка с кивком'],
        baitUsed: ['Вареная креветка'],
        review: 'Отличный выезд, стабильный поморский клёв!',
        rating: 5
      });
      setShowCatchModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCatch(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Minimalist Top Profile Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-200 shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                user.name[0] || 'Р'
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold text-slate-100 truncate">{user.name}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {user.experienceLevel}
                </span>
                {isInsideTelegram() && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    TG WebApp
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="text-sky-400 font-mono">@{user.telegramUsername || 'рыбак'}</span>
                <span>•</span>
                <span>{user.homeDistrict}</span>
                <span>•</span>
                <span>{user.boatType}</span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                hapticFeedback('selection');
                setShowTripModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Спланировать поездку</span>
            </button>

            <button
              onClick={() => {
                hapticFeedback('selection');
                setActiveSubTab(activeSubTab === 'edit' ? 'gear' : 'edit');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs transition"
              title="Настройки профиля"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 text-center">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Выезды</div>
            <div className="text-sm sm:text-base font-semibold text-slate-200 mt-0.5">{userTrips.length}</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Отчеты</div>
            <div className="text-sm sm:text-base font-semibold text-slate-200 mt-0.5">{userHistory.length}</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Улов (кг)</div>
            <div className="text-sm sm:text-base font-semibold text-emerald-400 mt-0.5">{totalCatchesWeight.toFixed(1)}</div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950 border border-slate-850">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Транспорт</div>
            <div className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5 truncate">
              {user.transportName || 'Не указан'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs inside Personal Cabinet */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('gear');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'gear'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Снасти</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('transport');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'transport'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Транспорт и бензин</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('trips');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'trips'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Мои выезды ({userTrips.length})</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('map');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'map'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Яндекс.Карты</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('history');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'history'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Fish className="w-3.5 h-3.5" />
          <span>История уловов ({userHistory.length})</span>
        </button>

        <button
          onClick={() => {
            hapticFeedback('selection');
            setActiveSubTab('edit');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap font-medium ${
            activeSubTab === 'edit'
              ? 'bg-slate-200 text-slate-900 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Профиль</span>
        </button>
      </div>

      {/* Tab 1: Gear Manager */}
      {activeSubTab === 'gear' && (
        <GearManager userId={user.id} />
      )}

      {/* Tab 2: Transport & Fuel */}
      {activeSubTab === 'transport' && (
        <TransportFuelManager user={user} onSaveProfile={onSaveProfile} />
      )}

      {/* Tab 3: Trips Section */}
      {activeSubTab === 'trips' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Запланированные рыбалки</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Выезды, в экипажах которых вы состоите или являетесь организатором
              </p>
            </div>

            <button
              onClick={() => setShowTripModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать выезд</span>
            </button>
          </div>

          {userTrips.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
              У вас пока нет активных запланированных поездок.
              <div className="mt-3">
                <button
                  onClick={() => setShowTripModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs transition"
                >
                  Спланировать первый выезд
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userTrips.map(trip => (
                <div
                  key={trip.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-100">{trip.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>📍 {trip.destination}</span>
                        <span>📅 {trip.date} в {trip.meetTime}</span>
                        <span>👥 {trip.participants.length} / {trip.maxCrew} чел.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleShareExistingTrip(trip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-sky-400 border border-slate-800 text-xs transition self-start sm:self-auto shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Кинуть в общий чат</span>
                    </button>
                  </div>

                  {/* Fuel / Cost breakdown */}
                  {trip.costPerPerson && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-850">
                      <span>⛽ Доля за бензин:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{trip.costPerPerson} ₽ с человека</span>
                      {trip.distanceKm && <span>({trip.distanceKm} км)</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Yandex Maps */}
      {activeSubTab === 'map' && (
        <YandexFishingMap
          spots={spots}
          selectedSpot={selectedSpot}
          onSelectSpot={setSelectedSpot}
          onOpenAddModal={() => {
            if (onAddSpot) {
              const name = prompt('Название рыбной точки:');
              if (name) {
                onAddSpot({
                  name,
                  lat: 64.8820,
                  lon: 40.2910,
                  area: 'Дельта Северной Двины',
                  recommendedFish: ['Навага', 'Корюшка'],
                  season: 'Зима (со льда)',
                  description: 'Точка добавлена из личного кабинета',
                  addedBy: user.name
                });
              }
            }
          }}
        />
      )}

      {/* Tab 5: History / Catches */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Личный журнал уловов</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Зафиксированные трофеи и отчеты о рыбалке в Поморье
              </p>
            </div>

            <button
              onClick={() => setShowCatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Записать улов</span>
            </button>
          </div>

          {userHistory.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
              Вы еще не заносили уловы в журнал.
            </div>
          ) : (
            <div className="space-y-3">
              {userHistory.map(entry => (
                <div key={entry.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{entry.location}</span>
                    <span className="text-slate-500 font-mono">{entry.date}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.catches.map((c, i) => (
                      <span
                        key={i}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                          c.isTrophy
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        {c.species} — {c.weightKg} кг {c.count ? `(${c.count} шт.)` : ''} {c.isTrophy ? '🏆' : ''}
                      </span>
                    ))}
                  </div>

                  {entry.review && (
                    <p className="text-[11px] text-slate-400 italic">«{entry.review}»</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Edit Profile */}
      {activeSubTab === 'edit' && (
        <form onSubmit={handleSave} className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-semibold text-slate-100">Настройки профиля рыбака</h3>
            <p className="text-xs text-slate-400 mt-0.5">Личные данные и контакты для связи в Telegram</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Имя или позывной *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Ник в Telegram (@username)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">@</span>
                <input
                  type="text"
                  value={telegramUsername.replace(/^@/, '')}
                  onChange={e => setTelegramUsername(e.target.value.replace(/^@/, ''))}
                  placeholder="pomor_fisherman"
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Телефон для экстренной связи</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7 (9xx) xxx-xx-xx"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Район проживания</label>
              <input
                type="text"
                value={homeDistrict}
                onChange={e => setHomeDistrict(e.target.value)}
                placeholder="Архангельск / Соломбала / Северодвинск"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Рыболовный опыт</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              >
                {EXPERIENCE_LEVELS.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Водная техника</label>
              <select
                value={boatType}
                onChange={e => setBoatType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
              >
                {BOAT_TYPES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">Предпочитаемые способы ловли</label>
            <div className="flex flex-wrap gap-1.5">
              {FISHING_STYLES.map(style => {
                const active = fishingStyles.includes(style);
                return (
                  <button
                    type="button"
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition ${
                      active
                        ? 'bg-slate-800 text-slate-100 border-slate-600 font-medium'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-white text-slate-900 text-xs font-medium transition shadow-sm"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal: Plan Trip & Share to Telegram */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateAndShareTrip}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Спланировать выезд</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTripModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Отмена
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Название поездки *</label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={e => setTripTitle(e.target.value)}
                  required
                  placeholder="Выезд за навагой на Сухое море"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Точка назначения</label>
                  <input
                    type="text"
                    value={tripDestination}
                    onChange={e => setTripDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Место сбора</label>
                  <input
                    type="text"
                    value={tripPlace}
                    onChange={e => setTripPlace(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Дата</label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Время</label>
                  <input
                    type="time"
                    value={tripTime}
                    onChange={e => setTripTime(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Мест в экипаже</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tripCrewMax}
                    onChange={e => setTripCrewMax(parseInt(e.target.value) || 2)}
                    className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Расчетная дистанция (туда и обратно):</span>
                  <span className="font-mono text-slate-200 font-bold">{tripDistanceKm} км</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="400"
                  step="10"
                  value={tripDistanceKm}
                  onChange={e => setTripDistanceKm(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-center text-xs">
                <span className="text-slate-400">Расчетная доля бензина на 1 человека: </span>
                <span className="text-emerald-400 font-bold font-mono">
                  ~{Math.round(((tripDistanceKm / 100) * (user.fuelConsumptionPer100km || 12) * (user.fuelPricePerLiter || 58)) / tripCrewMax)} ₽
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTripModal(false)}
                className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={creatingTrip}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{creatingTrip ? 'Создание...' : 'Создать и кинуть в чат'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Quick Catch Log */}
      {showCatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleQuickAddCatch}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Записать улов</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatchModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Отмена
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Вид рыбы</label>
                <input
                  type="text"
                  value={catchFish}
                  onChange={e => setCatchFish(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={catchWeight}
                    onChange={e => setCatchWeight(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Количество (шт)</label>
                  <input
                    type="number"
                    min="1"
                    value={catchCount}
                    onChange={e => setCatchCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Место лова</label>
                <input
                  type="text"
                  value={catchLocation}
                  onChange={e => setCatchLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCatchModal(false)}
                className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={submittingCatch}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
              >
                {submittingCatch ? 'Сохранение...' : 'Записать в журнал'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
