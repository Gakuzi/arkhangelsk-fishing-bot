import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Flame,
  CheckCircle2,
  XCircle,
  Truck,
  CheckSquare,
  Sparkles,
  Send,
  X,
  Fish,
  Share2,
  Car,
  UserCheck,
  Fuel,
  Compass,
  Download
} from 'lucide-react';
import { PlannedTrip, UserProfile } from '../../types/index.ts';
import { openTelegramLink, hapticFeedback } from '../../services/telegramWebApp.ts';

interface PlannedTripsViewProps {
  trips: PlannedTrip[];
  activeUser: UserProfile | null;
  onJoinTrip: (tripId: string) => Promise<void>;
  onLeaveTrip: (tripId: string) => Promise<void>;
  onCreateTrip: (trip: any) => Promise<void>;
}

// Popular fishing spots in Arkhangelsk region
const SPOT_PRESETS = [
  { name: 'Остров Мудьюг / Сухое Море', lat: 64.8820, lon: 40.2910 },
  { name: 'Никольское устье / Кузнечиха', lat: 64.5500, lon: 40.4200 },
  { name: 'Пос. Лапоминка (причал)', lat: 64.7800, lon: 40.4500 },
  { name: 'Маймакса / 26 л/з', lat: 64.6500, lon: 40.5200 },
  { name: 'Северодвинск / о. Ягры', lat: 64.5950, lon: 39.8200 },
  { name: 'Уемский затон (Северная Двина)', lat: 64.4400, lon: 40.8500 }
];

export const PlannedTripsView: React.FC<PlannedTripsViewProps> = ({
  trips,
  activeUser,
  onJoinTrip,
  onLeaveTrip,
  onCreateTrip
}) => {
  const [filter, setFilter] = useState<'all' | 'driver' | 'passenger' | 'my'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Trip Form state
  const [tripType, setTripType] = useState<'driver' | 'passenger'>('driver');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('Остров Мудьюг / Сухое Море');
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>({ lat: 64.8820, lon: 40.2910 });
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetTime, setMeetTime] = useState('06:00');
  const [meetPlace, setMeetPlace] = useState('Причал в пос. Лапоминка');
  const [transportType, setTransportType] = useState('УАЗ Патриот / Нива 4x4');
  const [maxCrew, setMaxCrew] = useState(4);
  const [passengerSeatsNeeded, setPassengerSeatsNeeded] = useState(1);
  const [splitFuelCost, setSplitFuelCost] = useState(true);
  const [hasOwnGear, setHasOwnGear] = useState(true);
  const [targetFishInput, setTargetFishInput] = useState('Корюшка, Навага, Сиг');
  const [notes, setNotes] = useState('Выезд по утренней воде по приливу.');
  const [submitting, setSubmitting] = useState(false);

  // Quick Date Helpers
  const setQuickDate = (daysAhead: number) => {
    hapticFeedback('selection');
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDate(d.toISOString().split('T')[0]);
  };

  const setNextWeekend = (dayOfWeek: number) => { // 6 = Saturday, 0 = Sunday
    hapticFeedback('selection');
    const d = new Date();
    const currentDay = d.getDay();
    let distance = (dayOfWeek + 7 - currentDay) % 7;
    if (distance === 0) distance = 7;
    d.setDate(d.getDate() + distance);
    setDate(d.toISOString().split('T')[0]);
  };

  const filteredTrips = trips.filter(t => {
    if (filter === 'driver') return t.tripType === 'driver' || t.hasCar !== false;
    if (filter === 'passenger') return t.tripType === 'passenger' || t.hasCar === false;
    if (filter === 'my' && activeUser) {
      return t.participants.some(p => p.userId === activeUser.id);
    }
    return true;
  });

  const handleShareTrip = (trip: PlannedTrip) => {
    hapticFeedback('light');
    const isPassenger = trip.tripType === 'passenger' || trip.hasCar === false;
    const header = isPassenger
      ? `🚶‍♂️ Ищу экипаж / водителя: "${trip.title}" (${trip.destination})`
      : `🚗 Собираю экипаж на рыбалку: "${trip.title}" (${trip.destination})`;

    const text = encodeURIComponent(
      `${header}\n📅 Дата: ${trip.date} в ${trip.meetTime}\n👤 Организатор: ${trip.organizerName}\nМест: ${Math.max(0, trip.maxCrew - trip.participants.length)} из ${trip.maxCrew}`
    );
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/ArkhangelskFishingBot')}&text=${text}`);
  };

  const handleAddToCalendar = (trip: PlannedTrip) => {
    hapticFeedback('light');
    const cleanDate = trip.date.replace(/-/g, '');
    const cleanTime = (trip.meetTime || '06:00').replace(':', '') + '00';
    const startIso = `${cleanDate}T${cleanTime}`;

    // 6 hours duration by default
    const [h, m] = (trip.meetTime || '06:00').split(':').map(Number);
    const endH = (h + 6) % 24;
    const endTime = `${String(endH).padStart(2, '0')}${String(m || 0).padStart(2, '0')}00`;
    const endIso = `${cleanDate}T${endTime}`;

    const titleStr = encodeURIComponent(`Рыбалка: ${trip.title}`);
    const detailsStr = encodeURIComponent(
      `Поморский выезд на рыбалку.\nВодоем: ${trip.destination}\nОрганизатор: ${trip.organizerName}\nТранспорт: ${trip.transportType}\nПримечания: ${trip.notes || 'Без особых пометок'}`
    );
    const locationStr = encodeURIComponent(trip.destination);

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleStr}&dates=${startIso}/${endIso}&details=${detailsStr}&location=${locationStr}`;
    openTelegramLink(googleCalUrl);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destination || !activeUser) return;

    setSubmitting(true);
    try {
      const targetFish = targetFishInput.split(',').map(s => s.trim()).filter(Boolean);
      const isPassenger = tripType === 'passenger';

      const finalTransport = isPassenger
        ? 'Без машины (ищу экипаж с авто)'
        : transportType || 'УАЗ Патриот / Нива';

      const finalMaxCrew = isPassenger
        ? passengerSeatsNeeded + 2 // Passenger + companion + driver + 1
        : Number(maxCrew);

      await onCreateTrip({
        organizerId: activeUser.id,
        organizerName: activeUser.name,
        title,
        destination,
        coordinates: destCoords || undefined,
        targetFish,
        date,
        meetTime,
        meetPlace: isPassenger ? `Подсяду: ${meetPlace}` : meetPlace,
        transportType: finalTransport,
        maxCrew: finalMaxCrew,
        tripType,
        hasCar: !isPassenger,
        passengerSeatsNeeded: isPassenger ? passengerSeatsNeeded : undefined,
        checklist: [
          'Удочки с мормышками и блеснами',
          'Наживка (креветка, опарыш)',
          hasOwnGear ? 'Ледобур и ящик (со своими)' : 'Нужен бур напрокат',
          splitFuelCost ? 'Готов разделить расходы на бензин' : 'Расходы согласованы',
          'Термос с горячим чаем'
        ],
        status: 'Набор открыт',
        notes: `${isPassenger ? '🚶‍♂️ Пассажир ищет авто. ' : '🚗 Водитель с авто. '}${notes}`
      });

      setIsModalOpen(false);
      setTitle('');
      hapticFeedback('success');
    } catch (err) {
      console.error('Error creating trip:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-slate-100">Экипажи и Поездки на рыбалку</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-950 text-sky-300 border border-sky-800/60">
              Поморье 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Объединяйтесь в экипажи: водители с авто берут попутчиков, а рыбаки без машин находят попутку
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => {
                hapticFeedback('selection');
                setFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'all'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({trips.length})
            </button>
            <button
              onClick={() => {
                hapticFeedback('selection');
                setFilter('driver');
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                filter === 'driver'
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Есть авто</span>
            </button>
            <button
              onClick={() => {
                hapticFeedback('selection');
                setFilter('passenger');
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                filter === 'passenger'
                  ? 'bg-slate-800 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ищут машину</span>
            </button>
            <button
              onClick={() => {
                hapticFeedback('selection');
                setFilter('my');
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'my'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Мой экипаж
            </button>
          </div>

          <button
            onClick={() => {
              hapticFeedback('selection');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/50 text-xs font-semibold transition shadow-md shadow-sky-950 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Опубликовать выезд</span>
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTrips.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm space-y-3">
            <p>Нет запланированных рыбалок по выбранному фильтру.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 text-xs font-medium border border-slate-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Опубликовать первую поездку или заявку на поиск машины</span>
            </button>
          </div>
        ) : (
          filteredTrips.map(trip => {
            const isUserJoined = activeUser
              ? trip.participants.some(p => p.userId === activeUser.id)
              : false;
            const isOrganizer = activeUser && trip.organizerId === activeUser.id;
            const freeSlots = trip.maxCrew - trip.participants.length;
            const isPassengerTrip = trip.tripType === 'passenger' || trip.hasCar === false;

            return (
              <div
                key={trip.id}
                className={`bg-slate-900 rounded-2xl border p-5 shadow-xl flex flex-col justify-between transition space-y-4 ${
                  isPassengerTrip
                    ? 'border-emerald-900/50 hover:border-emerald-700/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                          isPassengerTrip
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                        }`}
                      >
                        {isPassengerTrip ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ищу водителя с авто</span>
                          </>
                        ) : (
                          <>
                            <Car className="w-3.5 h-3.5 text-sky-400" />
                            <span>Водитель с авто</span>
                          </>
                        )}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          trip.status === 'Набор открыт'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                            : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                        }`}
                      >
                        {trip.status} {freeSlots > 0 && `(${freeSlots} мест)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{trip.date}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{trip.meetTime}</span>
                    </div>
                  </div>

                  {/* Title & Destination */}
                  <h3 className="text-base font-bold text-slate-100 hover:text-sky-300 transition cursor-pointer">
                    {trip.title}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-medium text-slate-200">{trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{trip.transportType}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Сбор: {trip.meetPlace}</span>
                    </div>

                    {trip.targetFish && trip.targetFish.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-400 pt-1">
                        <Fish className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {trip.targetFish.map((fish, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                            >
                              {fish}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Crew progress */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                        <span>Экипаж: {trip.participants.length} из {trip.maxCrew} чел.</span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {freeSlots <= 0 ? 'Мест нет' : `Свободно мест: ${freeSlots}`}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-3 border border-slate-800">
                      <div
                        className={`h-full transition-all ${
                          trip.participants.length >= trip.maxCrew ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, (trip.participants.length / trip.maxCrew) * 100)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {trip.participants.map(p => (
                        <span
                          key={p.userId}
                          className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 border ${
                            p.role === 'Организатор'
                              ? 'bg-indigo-950/80 text-indigo-200 border-indigo-800/60'
                              : 'bg-slate-950 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span className="font-medium">{p.userName}</span>
                          {p.role === 'Организатор' && (
                            <span className="text-[10px] text-indigo-400 font-bold">★ Капитан</span>
                          )}
                          {p.telegramUsername && (
                            <span className="text-[10px] text-slate-500">@{p.telegramUsername}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notes / Special conditions */}
                  {trip.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400">
                      <span className="text-slate-300 font-medium mr-1">Инфо:</span>
                      {trip.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Share in Telegram button */}
                    <button
                      onClick={() => handleShareTrip(trip)}
                      title="Поделиться в Telegram (группы / чаты)"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">В чат</span>
                    </button>

                    {/* Add to Google Calendar button */}
                    <button
                      onClick={() => handleAddToCalendar(trip)}
                      title="Добавить напоминание в календарь"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>В календарь</span>
                    </button>
                  </div>

                  {isUserJoined ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Вы в экипаже
                      </span>
                      {!isOrganizer && (
                        <button
                          onClick={() => {
                            hapticFeedback('selection');
                            onLeaveTrip(trip.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-medium transition"
                        >
                          Выйти
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        hapticFeedback('selection');
                        onJoinTrip(trip.id);
                      }}
                      disabled={freeSlots <= 0}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition shadow-md ${
                        isPassengerTrip
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                          : 'bg-sky-600 hover:bg-sky-500 shadow-sky-950'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isPassengerTrip ? (
                        <>
                          <Car className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Взять в свой экипаж</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-3.5 h-3.5 text-amber-300" />
                          <span>{freeSlots <= 0 ? 'Мест нет' : 'Записаться в экипаж'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Опубликовать поездку на рыбалку
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Control: I have a car vs I am a passenger */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('selection');
                  setTripType('driver');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                  tripType === 'driver'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Я за рулём (Есть авто)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('selection');
                  setTripType('passenger');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
                  tripType === 'passenger'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Я пассажир (Ищу авто)</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  {tripType === 'driver'
                    ? 'Название выезда / Маршрут'
                    : 'Что ищете? (Например: Ищу попутку на Мудьюг в субботу)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={
                    tripType === 'driver'
                      ? 'Выезд на Мудьюг за навагой и корюшкой'
                      : 'Ищу экипаж на Белое Море, готов скинуться на бензин'
                  }
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Destination & Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-300">Водоем / Локация</label>
                  <span className="text-[11px] text-slate-500">Быстрый выбор:</span>
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Мудьюг / Сухое Море / Маймакса"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500 mb-2"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {SPOT_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        hapticFeedback('selection');
                        setDestination(preset.name);
                        setDestCoords({ lat: preset.lat, lon: preset.lon });
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] border transition ${
                        destination === preset.name
                          ? 'bg-sky-950 text-sky-200 border-sky-700'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset.name.split('/')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time with Quick Helpers */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Дата и время выезда</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      Завтра
                    </button>
                    <button
                      type="button"
                      onClick={() => setNextWeekend(6)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 font-medium"
                    >
                      В субботу
                    </button>
                    <button
                      type="button"
                      onClick={() => setNextWeekend(0)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 font-medium"
                    >
                      В воскресенье
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={meetTime}
                      onChange={e => setMeetTime(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Specific fields depending on driver vs passenger */}
              {tripType === 'driver' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-300 mb-1">Транспорт / Техника</label>
                      <input
                        type="text"
                        value={transportType}
                        onChange={e => setTransportType(e.target.value)}
                        placeholder="УАЗ / Нива / Снегоход"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-300 mb-1">Всего мест в машине</label>
                      <input
                        type="number"
                        min={2}
                        max={8}
                        value={maxCrew}
                        onChange={e => setMaxCrew(Number(e.target.value))}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Место сбора / Старт</label>
                    <input
                      type="text"
                      value={meetPlace}
                      onChange={e => setMeetPlace(e.target.value)}
                      placeholder="Причал пос. Лапоминка / набережная Седова"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-300 mb-1">Сколько вас человек?</label>
                      <select
                        value={passengerSeatsNeeded}
                        onChange={e => setPassengerSeatsNeeded(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value={1}>1 человек (я один)</option>
                        <option value={2}>2 человека (я с напарником)</option>
                        <option value={3}>3 человека</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-300 mb-1">Где удобно подсесть?</label>
                      <input
                        type="text"
                        value={meetPlace}
                        onChange={e => setMeetPlace(e.target.value)}
                        placeholder="Соломбала / Центр / Левый берег"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Passenger toggles */}
                  <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splitFuelCost}
                        onChange={e => setSplitFuelCost(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span className="text-slate-300 font-medium">
                        ⛽️ Готов разделить расходы на бензин с водителем (100%)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasOwnGear}
                        onChange={e => setHasOwnGear(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span className="text-slate-300 font-medium">
                        🎣 Свои снасти, рыболовный ящик и бур с собой
                      </span>
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1">Целевая рыба</label>
                <input
                  type="text"
                  value={targetFishInput}
                  onChange={e => setTargetFishInput(e.target.value)}
                  placeholder="Корюшка, Навага, Сиг, Окунь"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Дополнительные пожелания</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Особенности ледовой обстановки, насадки, договоренности по связи..."
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
                  className={`px-5 py-2 rounded-xl text-white text-sm font-semibold transition shadow-md ${
                    tripType === 'driver'
                      ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                  } disabled:opacity-50`}
                >
                  {submitting
                    ? 'Публикация...'
                    : tripType === 'driver'
                    ? 'Опубликовать выезд экипажа'
                    : 'Опубликовать заявку на поиск авто'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
