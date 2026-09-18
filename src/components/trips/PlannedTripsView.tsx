import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit3,
  Trash2,
  Share2,
  Car,
  Fuel,
  Compass,
  X,
  Check,
  ChevronRight,
  Route,
  Navigation,
  Sparkles,
  Zap,
  RotateCw,
  Waves,
  Moon,
  Wind,
  Gauge
} from 'lucide-react';
import { PlannedTrip, UserProfile, FishingSpot } from '../../types/index.ts';
import { openTelegramLink, hapticFeedback, isInsideTelegram } from '../../services/telegramWebApp.ts';
import {
  POPULAR_MEET_POINTS,
  calculateRoundTripDistanceKm,
  calculateFuelCost
} from '../../utils/routeCalculator.ts';
import { api } from '../../services/api.ts';
import { AddSpotModal } from '../spots/AddSpotModal.tsx';

interface PlannedTripsViewProps {
  trips: PlannedTrip[];
  spots: FishingSpot[];
  activeUser: UserProfile | null;
  onJoinTrip: (tripId: string) => Promise<void>;
  onLeaveTrip: (tripId: string, reason?: string) => Promise<void>;
  onCreateTrip: (trip: any) => Promise<void>;
  onEditTrip?: (tripId: string, trip: any) => Promise<void>;
  onDeleteTrip?: (tripId: string) => Promise<void>;
  onAddSpot?: (spot: any) => Promise<void>;
}

const DEFAULT_GEAR_INVENTORY = [
  'Зимняя удочка-кобылка',
  'Фосфорные мормышки (светонакопительные)',
  'Балансир Rapala 5 см',
  'Блесна зимняя на окуня',
  'Ледобур 130 мм',
  'Палатка Куб от ветра',
  'Санки-волокуши',
  'Эхолот Практик 6М',
  'Пешня поморская',
  'Термос 1.5 л с чаем',
  'Наживка: креветка и опарыш'
];

const PRESET_TIME_SLOTS = [
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '13:30',
  '16:00'
];

export const PlannedTripsView: React.FC<PlannedTripsViewProps> = ({
  trips,
  spots,
  activeUser,
  onJoinTrip,
  onLeaveTrip,
  onCreateTrip,
  onEditTrip,
  onDeleteTrip,
  onAddSpot
}) => {
  const [filter, setFilter] = useState<'all' | 'driver' | 'passenger' | 'my'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [tripType, setTripType] = useState<'driver' | 'passenger'>('driver');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetTime, setMeetTime] = useState('06:30');
  const [meetPlace, setMeetPlace] = useState(POPULAR_MEET_POINTS[0].name);

  // Spot selection & coordinates
  const [selectedSpotId, setSelectedSpotId] = useState<string>(spots[0]?.id || 'spot-1');
  const [customDestination, setCustomDestination] = useState(spots[0]?.name || 'Остров Мудьюг (Сухое Море)');
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number }>({
    lat: spots[0]?.lat || 64.882,
    lon: spots[0]?.lon || 40.291
  });

  // Interactive Map Picker & Add Spot Modal states
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isAddSpotModalOpen, setIsAddSpotModalOpen] = useState(false);

  // AI Assistant Forecast State
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecast, setForecast] = useState<any>(null);

  // Inventory & Transport
  const [userTransportList, setUserTransportList] = useState<string[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<string>('УАЗ Патриот 4x4');
  const [selectedGear, setSelectedGear] = useState<string[]>([
    'Зимняя удочка-кобылка',
    'Фосфорные мормышки (светонакопительные)',
    'Ледобур 130 мм',
    'Санки-волокуши'
  ]);

  // Route & Fuel State
  const [distanceKm, setDistanceKm] = useState<number>(65);
  const [fuelConsumption, setFuelConsumption] = useState<number>(activeUser?.fuelConsumptionPer100km || 11.5);
  const [fuelPrice, setFuelPrice] = useState<number>(activeUser?.fuelPricePerLiter || 56.5);
  const [maxCrew, setMaxCrew] = useState<number>(activeUser?.availableSeats ? activeUser.availableSeats + 1 : 4);
  const [targetFish, setTargetFish] = useState('Корюшка, Навага, Сиг');
  const [notes, setNotes] = useState('Выезд по утренней воде по приливу. Термос и санки обязательно.');
  const [submitting, setSubmitting] = useState(false);

  // Initialize transports and gear from user profile
  useEffect(() => {
    const list: string[] = [];
    if (activeUser?.transports && activeUser.transports.length > 0) {
      activeUser.transports.forEach(tr => {
        list.push(`${tr.name} (${tr.seats} мест)`);
      });
    } else if (activeUser?.transportName) {
      list.push(`${activeUser.transportName} (${activeUser.availableSeats || 3} мест)`);
    } else {
      list.push('УАЗ Патриот 4x4 (4 мест)', 'Нива Бронто 4x4 (3 мест)', 'Мотособака Бурлак (2 мест)');
    }
    list.push('Без машины (ищу экипаж / попутку)');
    setUserTransportList(list);
    setSelectedTransport(list[0]);

    // Pull personal gear from profile
    const profileGear: string[] = [];
    if (activeUser?.inventory?.length) profileGear.push(...activeUser.inventory);
    if (activeUser?.rods?.length) profileGear.push(...activeUser.rods);
    if (activeUser?.tackles?.length) profileGear.push(...activeUser.tackles);
    if (profileGear.length > 0) {
      setSelectedGear(prev => Array.from(new Set([...prev, ...profileGear.slice(0, 6)])));
    }
  }, [activeUser]);

  // Trigger Assistant forecast whenever spot coordinates or date change
  const fetchAssistantForecast = async (spotName: string, lat: number, lon: number, tripDate: string) => {
    setLoadingForecast(true);
    try {
      const data = await api.getAssistantForecast({
        spotName,
        lat,
        lon,
        date: tripDate,
        userTransport: selectedTransport
      });
      setForecast(data);

      // Auto-set recommended best time if not user-locked
      if (data.recommendedTime) {
        setMeetTime(data.recommendedTime);
      }

      // Auto-format title using the constructor logic if not manually typed
      if (data.suggestedTitle) {
        setTitle(data.suggestedTitle);
      } else {
        setTitle(`🎣 ${spotName} (${data.recommendedTime || meetTime})`);
      }

      if (data.targetFish && data.targetFish.length) {
        setTargetFish(data.targetFish.join(', '));
      }

      // Auto-recommend gear from assistant
      if (data.recommendedGear && data.recommendedGear.length) {
        setSelectedGear(prev => Array.from(new Set([...prev, ...data.recommendedGear])));
      }

      hapticFeedback('success');
    } catch (err) {
      console.error('Forecast assistant failed:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleSpotSelect = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setCustomDestination(spot.name);
    setDestCoords({ lat: spot.lat, lon: spot.lon });

    const meetPoint = POPULAR_MEET_POINTS.find(p => p.name === meetPlace) || POPULAR_MEET_POINTS[0];
    const calcDist = calculateRoundTripDistanceKm(meetPoint.lat, meetPoint.lon, spot.lat, spot.lon);
    setDistanceKm(calcDist);

    fetchAssistantForecast(spot.name, spot.lat, spot.lon, date);
    hapticFeedback('selection');
  };

  const handleMeetPlaceSelect = (placeName: string) => {
    setMeetPlace(placeName);
    const meetPoint = POPULAR_MEET_POINTS.find(p => p.name === placeName) || POPULAR_MEET_POINTS[0];
    const calcDist = calculateRoundTripDistanceKm(meetPoint.lat, meetPoint.lon, destCoords.lat, destCoords.lon);
    setDistanceKm(calcDist);
    hapticFeedback('selection');
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    fetchAssistantForecast(customDestination, destCoords.lat, destCoords.lon, newDate);
    hapticFeedback('selection');
  };

  // Geolocation from Telegram / Browser
  const handleGetCurrentLocation = () => {
    hapticFeedback('medium');
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим устройством');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const name = `Моя точка (${lat}, ${lon})`;
        setCustomDestination(name);
        setDestCoords({ lat, lon });
        fetchAssistantForecast(name, lat, lon, date);
      },
      err => {
        console.warn('Geolocation error:', err);
        alert('Не удалось получить координаты. Выберите точку на карте.');
      },
      { timeout: 8000 }
    );
  };

  // Toggle gear in checklist
  const toggleGear = (item: string) => {
    hapticFeedback('selection');
    if (selectedGear.includes(item)) {
      setSelectedGear(selectedGear.filter(g => g !== item));
    } else {
      setSelectedGear([...selectedGear, item]);
    }
  };

  // Open modal
  const handleOpenCreateModal = () => {
    setEditingTripId(null);
    setTripType('driver');
    const defaultSpot = spots[0] || {
      id: 'default',
      name: 'Остров Мудьюг (Сухое Море)',
      lat: 64.882,
      lon: 40.291
    };
    setSelectedSpotId(defaultSpot.id);
    setCustomDestination(defaultSpot.name);
    setDestCoords({ lat: defaultSpot.lat, lon: defaultSpot.lon });

    const meetPoint = POPULAR_MEET_POINTS[0];
    setMeetPlace(meetPoint.name);
    const calcDist = calculateRoundTripDistanceKm(meetPoint.lat, meetPoint.lon, defaultSpot.lat, defaultSpot.lon);
    setDistanceKm(calcDist);

    const d = new Date();
    d.setDate(d.getDate() + 1);
    const dStr = d.toISOString().split('T')[0];
    setDate(dStr);

    fetchAssistantForecast(defaultSpot.name, defaultSpot.lat, defaultSpot.lon, dStr);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleOpenEditModal = (trip: PlannedTrip) => {
    setEditingTripId(trip.id);
    setTitle(trip.title);
    setTripType(trip.tripType || (trip.hasCar ? 'driver' : 'passenger'));
    setDate(trip.date);
    setMeetTime(trip.meetTime);
    setMeetPlace(trip.meetPlace || POPULAR_MEET_POINTS[0].name);
    setCustomDestination(trip.destination);
    if (trip.coordinates) {
      setDestCoords(trip.coordinates);
    }
    setDistanceKm(trip.distanceKm || 60);
    setMaxCrew(trip.maxCrew || 4);
    setTargetFish(trip.targetFish?.join(', ') || 'Корюшка, Навага');
    setNotes(trip.notes || '');
    setSelectedGear(trip.checklist || []);

    fetchAssistantForecast(trip.destination, trip.coordinates?.lat || 64.882, trip.coordinates?.lon || 40.291, trip.date);
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !customDestination.trim()) return;

    setSubmitting(true);
    try {
      const isDriver = tripType === 'driver';
      const fuelCalc = calculateFuelCost(distanceKm, fuelConsumption, fuelPrice, maxCrew);

      const tripData = {
        title: title.trim() || `Выезд: ${customDestination}`,
        destination: customDestination.trim(),
        coordinates: destCoords,
        targetFish: targetFish.split(',').map(s => s.trim()).filter(Boolean),
        date,
        meetTime,
        meetPlace,
        transportType: selectedTransport,
        maxCrew: Number(maxCrew),
        organizerId: activeUser.id,
        organizerName: activeUser.name,
        checklist: selectedGear,
        status: 'Набор открыт' as const,
        notes: notes.trim(),
        tripType,
        hasCar: isDriver,
        distanceKm,
        fuelCostTotal: fuelCalc.totalCost,
        costPerPerson: fuelCalc.costPerPerson,
        fuelType: activeUser.fuelType || 'АИ-92',
        participants: [
          {
            userId: activeUser.id,
            userName: activeUser.name,
            telegramUsername: activeUser.telegramUsername,
            role: 'Организатор' as const,
            joinedAt: new Date().toISOString()
          }
        ]
      };

      if (editingTripId && onEditTrip) {
        await onEditTrip(editingTripId, tripData);
      } else {
        await onCreateTrip(tripData);
      }

      setIsModalOpen(false);
      setEditingTripId(null);
      hapticFeedback('success');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fuel calculations for preview
  const fuelCalc = calculateFuelCost(distanceKm, fuelConsumption, fuelPrice, maxCrew);

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    if (filter === 'driver') return t.tripType === 'driver' || t.hasCar;
    if (filter === 'passenger') return t.tripType === 'passenger' || !t.hasCar;
    if (filter === 'my' && activeUser) {
      return (
        t.organizerId === activeUser.id ||
        t.participants?.some(p => p.userId === activeUser.id)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Рыбалки и экипажи
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              AI-Ассистент
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Конструктор рыбалок с реальным прогнозом клёва, расчётом приливов и сбором экипажа
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-sky-500/25 active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Спланировать с ассистентом</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl liquid-glass border border-white/80 overflow-x-auto">
        <button
          onClick={() => {
            setFilter('all');
            hapticFeedback('selection');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Все выезды ({trips.length})
        </button>
        <button
          onClick={() => {
            setFilter('driver');
            hapticFeedback('selection');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'driver' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🚙 Водители с авто
        </button>
        <button
          onClick={() => {
            setFilter('passenger');
            hapticFeedback('selection');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            filter === 'passenger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🚶 Попутчики
        </button>
        {activeUser && (
          <button
            onClick={() => {
              setFilter('my');
              hapticFeedback('selection');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Мои рыбалки
          </button>
        )}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-10 text-center border border-white/80">
          <CalendarDays className="w-12 h-12 text-sky-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-700">Пока нет запланированных рыбалок</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Запустите конструктор — AI-ассистент подберёт идеальное место, время клёва и снасти.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-md shadow-sky-500/20 transition"
          >
            + Запустить конструктор
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map(trip => {
            const isOrganizer = activeUser && trip.organizerId === activeUser.id;
            const isJoined = activeUser && trip.participants?.some(p => p.userId === activeUser.id);
            const freeSeats = Math.max(0, (trip.maxCrew || 4) - (trip.participants?.length || 0));

            return (
              <div
                key={trip.id}
                className="liquid-glass-card rounded-3xl p-5 border border-white/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                        {trip.hasCar ? '🚙 Водитель' : '🚶 Ищет экипаж'}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 mt-1 leading-snug">
                        {trip.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isOrganizer && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(trip)}
                            title="Редактировать поездку"
                            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 border border-slate-200 shadow-sm transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteTrip && (
                            <button
                              onClick={() => {
                                if (window.confirm('Удалить эту рыбалку?')) {
                                  hapticFeedback('heavy');
                                  onDeleteTrip(trip.id);
                                }
                              }}
                              title="Удалить поездку"
                              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-sm transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Place & Time */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-800">{trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{trip.date} в {trip.meetTime} • Сбор: {trip.meetPlace}</span>
                    </div>

                    {trip.distanceKm && trip.costPerPerson && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-sky-50/60 p-2 rounded-xl border border-sky-100">
                        <Fuel className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>Маршрут: <b>~{trip.distanceKm} км</b> (~{trip.costPerPerson} ₽/чел на бензин)</span>
                      </div>
                    )}
                  </div>

                  {/* Fish & Gear Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {trip.targetFish?.map((fish, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white/80 text-sky-900 font-medium text-[11px] border border-sky-100"
                      >
                        🐟 {fish}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      {freeSeats > 0 ? `Свободно мест: ${freeSeats}` : 'Экипаж полон'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <button
                        onClick={() => {
                          hapticFeedback('medium');
                          onLeaveTrip(trip.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      >
                        Выйти
                      </button>
                    ) : freeSeats > 0 ? (
                      <button
                        onClick={() => {
                          hapticFeedback('success');
                          onJoinTrip(trip.id);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-xs shadow-sm hover:from-sky-600 hover:to-blue-700 transition"
                      >
                        Еду с вами
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI FISHING CONSTRUCTOR MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="liquid-glass-card rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-white/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {editingTripId ? 'Редактировать рыбалку' : 'AI-Конструктор рыбалки'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Автоматический расчёт клёва, подбор снастей и компоновка выезда
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveTrip} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* 1. ВЫБОР МЕСТА (ИЗ ИНВЕНТАРЯ / С КАРТЫ / ГЕОЛОКАЦИЯ) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>1. Место рыбалки (из списка или с карты)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddSpotModalOpen(true);
                        hapticFeedback('medium');
                      }}
                      className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Новая точка</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100 transition"
                    >
                      {showMapPicker ? 'Скрыть карту' : '📍 Выбрать на карте'}
                    </button>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 transition"
                    >
                      🧭 Моё местоположение
                    </button>
                  </div>
                </div>

                {/* Spot selector dropdown */}
                <select
                  value={selectedSpotId}
                  onChange={e => {
                    if (e.target.value === '__NEW_SPOT__') {
                      setIsAddSpotModalOpen(true);
                      hapticFeedback('medium');
                      return;
                    }
                    const found = spots.find(s => s.id === e.target.value);
                    if (found) handleSpotSelect(found);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <optgroup label="Сохраненные точки лова">
                    {spots.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.area || 'Белое море'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Новое место">
                    <option value="__NEW_SPOT__">➕ Отметить новую точку на карте Telegram...</option>
                  </optgroup>
                </select>

                {/* Interactive Map Picker iframe if requested */}
                {showMapPicker && (
                  <div className="rounded-2xl overflow-hidden h-64 border border-slate-200 shadow-inner relative animate-in fade-in">
                    <iframe
                      src={`https://yandex.ru/map-widget/v1/?ll=${destCoords.lon}%2C${destCoords.lat}&z=11&l=sat&pt=${destCoords.lon},${destCoords.lat},pm2rdm`}
                      className="w-full h-full border-0"
                      title="Выбор точки на карте"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Координаты: {destCoords.lat.toFixed(4)}, {destCoords.lon.toFixed(4)}</span>
                      <span className="text-sky-600 font-semibold">Спутниковый снимок льда</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. AI-АССИСТЕНТ ПРОГНОЗА КЛЁВА И УСЛОВИЙ */}
              <div className="liquid-glass-subtle p-4 rounded-3xl border border-sky-200/80 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">
                      AI-Анализ клёва и условий (Open-Meteo & Лунный цикл)
                    </span>
                  </div>
                  {loadingForecast && (
                    <div className="flex items-center gap-1 text-[11px] text-sky-600">
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Анализ погоды...</span>
                    </div>
                  )}
                </div>

                {forecast && (
                  <div className="space-y-3">
                    {/* Probability Card */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">Вероятность клёва на {date}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-2xl font-black text-emerald-600">
                            {forecast.biteProbability}%
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                            {forecast.biteRating}
                          </span>
                        </div>
                      </div>

                      {forecast.recommendedTime && (
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500 font-medium">Рекомендованное время</div>
                          <button
                            type="button"
                            onClick={() => {
                              setMeetTime(forecast.recommendedTime);
                              hapticFeedback('selection');
                            }}
                            className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 hover:bg-sky-100 mt-0.5 inline-flex items-center gap-1 transition"
                          >
                            <Clock className="w-3 h-3 text-sky-500" />
                            <span>{forecast.recommendedTime} (выбрать)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meteorological Factors */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-slate-500" />
                          <span>Давление</span>
                        </div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {forecast.weather?.pressureMmHg} мм рт.ст.
                        </div>
                      </div>

                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Wind className="w-3 h-3 text-slate-500" />
                          <span>Ветер</span>
                        </div>
                        <div className="font-bold text-slate-800 mt-0.5">
                          {forecast.weather?.windDirection} {forecast.weather?.windSpeed} м/с
                        </div>
                      </div>

                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Moon className="w-3 h-3 text-slate-500" />
                          <span>Луна</span>
                        </div>
                        <div className="font-bold text-slate-800 mt-0.5 truncate">
                          {forecast.solunar?.moonPhase}
                        </div>
                      </div>

                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Waves className="w-3 h-3 text-slate-500" />
                          <span>Прилив</span>
                        </div>
                        <div className="font-bold text-sky-700 mt-0.5 text-[11px] truncate">
                          {forecast.solunar?.tideState?.slice(0, 18)}...
                        </div>
                      </div>
                    </div>

                    {/* Summary text */}
                    {forecast.summary && (
                      <p className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-2xl border border-white leading-relaxed">
                        💡 {forecast.summary}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. ВЫБОР ДАТЫ И ВРЕМЕНИ (БЕЗ РУЧНОЙ ПИСАНИНЫ) */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-sky-600" />
                  <span>2. Дата и рекомендованное время</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Дата выезда</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => handleDateChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Время сбора / выезда</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_TIME_SLOTS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setMeetTime(t);
                            hapticFeedback('selection');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                            meetTime === t
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. ВЫБОР ТРАНСПОРТА ИЗ ИНВЕНТАРЯ */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-sky-600" />
                  <span>3. Транспорт из инвентаря</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userTransportList.map(t => {
                    const isSelected = selectedTransport === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSelectedTransport(t);
                          if (t.includes('Без машины')) {
                            setTripType('passenger');
                          } else {
                            setTripType('driver');
                          }
                          hapticFeedback('selection');
                        }}
                        className={`p-3 rounded-2xl text-left border text-xs font-semibold flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-500'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{t}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Meet place */}
                <div className="pt-1">
                  <label className="block text-slate-600 mb-1 text-xs font-medium">Точка сбора экипажа</label>
                  <select
                    value={meetPlace}
                    onChange={e => handleMeetPlaceSelect(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    {POPULAR_MEET_POINTS.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. УКОМПЛЕКТОВАНИЕ СНАСТЕЙ ИЗ ИНВЕНТАРЯ */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>4. Снасти из инвентаря (выбираются в один клик)</span>
                  </label>
                  <span className="text-[11px] text-sky-600 font-semibold">
                    Выбрано: {selectedGear.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_GEAR_INVENTORY.map(item => {
                    const isSelected = selectedGear.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleGear(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. АВТОМАТИЧЕСКИ СФОРМИРОВАННЫЙ ЗАГОЛОВОК */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    5. Заголовок рыбалки (автоматический конструктор)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      fetchAssistantForecast(customDestination, destCoords.lat, destCoords.lon, date);
                    }}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Перегенерировать</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Заголовок выезда"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Route & Fuel cost summary */}
              <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-semibold text-slate-800">Километраж туда-обратно: </span>
                    <span className="font-bold text-sky-700">~{distanceKm} км</span>
                  </div>
                </div>
                <div className="font-bold text-slate-800">
                  По ~{fuelCalc.costPerPerson} ₽ с человека
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Создание...' : editingTripId ? 'Сохранить изменения' : 'Опубликовать выезд'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SPOT MODAL (Integrated Telegram Map & Location) */}
      <AddSpotModal
        isOpen={isAddSpotModalOpen}
        onClose={() => setIsAddSpotModalOpen(false)}
        onSaveSpot={async (spotData) => {
          if (onAddSpot) {
            await onAddSpot(spotData);
          }
          setIsAddSpotModalOpen(false);
          const spotName = spotData.name || 'Точка лова';
          const spotLat = Number(spotData.lat) || 64.882;
          const spotLon = Number(spotData.lon) || 40.291;
          setCustomDestination(spotName);
          setDestCoords({ lat: spotLat, lon: spotLon });
          fetchAssistantForecast(spotName, spotLat, spotLon, date);
          hapticFeedback('success');
        }}
        activeUser={activeUser}
        initialLat={destCoords.lat}
        initialLon={destCoords.lon}
      />
    </div>
  );
};
