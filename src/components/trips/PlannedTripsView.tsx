import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { PlannedTrip, UserProfile, FishingSpot } from '../../types/index.ts';
import { openTelegramLink, hapticFeedback, isInsideTelegram } from '../../services/telegramWebApp.ts';
import {
  POPULAR_MEET_POINTS,
  calculateRoundTripDistanceKm,
  calculateFuelCost
} from '../../utils/routeCalculator.ts';

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

  // Modal Form State
  const [title, setTitle] = useState('');
  const [tripType, setTripType] = useState<'driver' | 'passenger'>('driver');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [meetTime, setMeetTime] = useState('06:30');
  const [meetPlace, setMeetPlace] = useState(POPULAR_MEET_POINTS[0].name);
  const [selectedSpotId, setSelectedSpotId] = useState<string>(spots[0]?.id || '');
  const [customDestination, setCustomDestination] = useState(spots[0]?.name || 'Сухое море / о. Мудьюг');
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(
    spots[0] ? { lat: spots[0].lat, lon: spots[0].lon } : { lat: 64.882, lon: 40.291 }
  );

  // Route & Fuel State
  const [distanceKm, setDistanceKm] = useState<number>(65);
  const [fuelConsumption, setFuelConsumption] = useState<number>(activeUser?.fuelConsumptionPer100km || 11.5);
  const [fuelPrice, setFuelPrice] = useState<number>(activeUser?.fuelPricePerLiter || 56.5);
  const [maxCrew, setMaxCrew] = useState<number>(activeUser?.availableSeats ? activeUser.availableSeats + 1 : 4);
  const [targetFish, setTargetFish] = useState('Корюшка, Навага, Сиг');
  const [notes, setNotes] = useState('Выезд по утренней воде по приливу. Термос и санки обязательно.');
  const [submitting, setSubmitting] = useState(false);

  // New Spot Drill-down inside modal
  const [showAddSpotInline, setShowAddSpotInline] = useState(false);
  const [newSpotName, setNewSpotName] = useState('');
  const [newSpotLat, setNewSpotLat] = useState(64.882);
  const [newSpotLon, setNewSpotLon] = useState(40.291);
  const [newSpotArea, setNewSpotArea] = useState('Белое море');
  const [newSpotFish, setNewSpotFish] = useState('Навага, Корюшка');

  // Quick Date Helpers
  const setQuickDate = (daysAhead: number) => {
    hapticFeedback('selection');
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDate(d.toISOString().split('T')[0]);
  };

  const setNextWeekend = (dayOfWeek: number) => {
    hapticFeedback('selection');
    const d = new Date();
    const currentDay = d.getDay();
    let distance = (dayOfWeek + 7 - currentDay) % 7;
    if (distance === 0) distance = 7;
    d.setDate(d.getDate() + distance);
    setDate(d.toISOString().split('T')[0]);
  };

  // Auto-calculate distance when destination or meet place changes
  const handleSpotSelect = (spot: FishingSpot) => {
    setSelectedSpotId(spot.id);
    setCustomDestination(spot.name);
    setDestCoords({ lat: spot.lat, lon: spot.lon });

    const meetPoint = POPULAR_MEET_POINTS.find(p => p.name === meetPlace) || POPULAR_MEET_POINTS[0];
    const calcDist = calculateRoundTripDistanceKm(meetPoint.lat, meetPoint.lon, spot.lat, spot.lon);
    setDistanceKm(calcDist);
    hapticFeedback('selection');
  };

  const handleMeetPlaceSelect = (placeName: string) => {
    setMeetPlace(placeName);
    const meetPoint = POPULAR_MEET_POINTS.find(p => p.name === placeName) || POPULAR_MEET_POINTS[0];
    if (destCoords) {
      const calcDist = calculateRoundTripDistanceKm(meetPoint.lat, meetPoint.lon, destCoords.lat, destCoords.lon);
      setDistanceKm(calcDist);
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTripId(null);
    setTitle('Рыбалка на ' + (spots[0]?.name || 'Сухом море'));
    setTripType('driver');
    if (spots.length > 0) {
      handleSpotSelect(spots[0]);
    }
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  // Open modal for Edit
  const handleOpenEdit = (trip: PlannedTrip) => {
    setEditingTripId(trip.id);
    setTitle(trip.title);
    setTripType(trip.tripType || 'driver');
    setDate(trip.date);
    setMeetTime(trip.meetTime);
    setMeetPlace(trip.meetPlace);
    setCustomDestination(trip.destination);
    setDestCoords(trip.coordinates || null);
    setMaxCrew(trip.maxCrew || 4);
    setDistanceKm(trip.distanceKm || 60);
    setNotes(trip.notes || '');
    setTargetFish(trip.targetFish?.join(', ') || 'Навага, Корюшка');
    setIsModalOpen(true);
    hapticFeedback('medium');
  };

  // Save Inline Spot
  const handleSaveInlineSpot = async () => {
    if (!newSpotName.trim()) return;
    try {
      const createdSpot = {
        name: newSpotName.trim(),
        lat: Number(newSpotLat),
        lon: Number(newSpotLon),
        area: newSpotArea,
        recommendedFish: newSpotFish.split(',').map(s => s.trim()).filter(Boolean),
        season: 'Круглый год',
        description: 'Точка добавлена при создании рыбалки'
      };
      if (onAddSpot) {
        await onAddSpot(createdSpot);
      }
      setCustomDestination(createdSpot.name);
      setDestCoords({ lat: createdSpot.lat, lon: createdSpot.lon });
      setShowAddSpotInline(false);
      hapticFeedback('success');
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Trip Form
  const handleSubmitTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeUser) return;

    setSubmitting(true);
    try {
      const fuelCalc = calculateFuelCost(distanceKm, fuelConsumption, fuelPrice, maxCrew);

      const tripPayload = {
        title: title.trim(),
        destination: customDestination,
        coordinates: destCoords || undefined,
        targetFish: targetFish.split(',').map(f => f.trim()).filter(Boolean),
        date,
        meetTime,
        meetPlace,
        transportType: tripType === 'driver' ? (activeUser.transportName || 'Автомобиль 4x4') : 'Ищу попутку / экипаж',
        maxCrew: Number(maxCrew),
        tripType,
        distanceKm: Number(distanceKm),
        fuelCostTotal: fuelCalc.totalCost,
        costPerPerson: fuelCalc.costPerPerson,
        notes: notes.trim(),
        checklist: ['Удочки и мормышки', 'Наживка (креветка/опарыш)', 'Термос с чаем', 'Сменные рукавицы', 'Санки']
      };

      if (editingTripId && onEditTrip) {
        await onEditTrip(editingTripId, tripPayload);
      } else {
        await onCreateTrip({
          ...tripPayload,
          organizerId: activeUser.id,
          organizerName: activeUser.name,
          participants: [
            {
              userId: activeUser.id,
              userName: activeUser.name,
              telegramUsername: activeUser.telegramUsername || '',
              role: 'Организатор',
              joinedAt: new Date().toISOString()
            }
          ],
          status: 'Набор открыт'
        });
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

  // Filter trips
  const filteredTrips = trips.filter(t => {
    if (filter === 'driver') return t.tripType === 'driver';
    if (filter === 'passenger') return t.tripType === 'passenger';
    if (filter === 'my' && activeUser) {
      return (
        t.organizerId === activeUser.id ||
        t.participants.some(p => p.userId === activeUser.id)
      );
    }
    return true;
  });

  const fuelPreview = calculateFuelCost(distanceKm, fuelConsumption, fuelPrice, maxCrew);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              Рыбалки
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
              {trips.length} выездов
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Сбор экипажей, совместные поездки и делёжка бензина по Поморью
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-sm shadow-md shadow-sky-500/25 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Создать рыбалку</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Все рыбалки' },
          { id: 'driver', label: 'Есть места (водители)' },
          { id: 'passenger', label: 'Ищут экипаж (пассажиры)' },
          { id: 'my', label: 'Мои выезды' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              hapticFeedback('selection');
              setFilter(tab.id as any);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === tab.id
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/20'
                : 'bg-white/70 hover:bg-white text-slate-600 border-white/90 shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 text-center border border-white/80">
          <Compass className="w-12 h-12 text-sky-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-700">Нет запланированных рыбалок</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Создайте первый выезд на Белое море или дельту Двины, чтобы набрать экипаж и разделить бензин.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-2xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-md shadow-sky-500/20 transition"
          >
            + Запланировать выезд
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrips.map(trip => {
            const isOrganizer = activeUser && trip.organizerId === activeUser.id;
            const isJoined = activeUser && trip.participants.some(p => p.userId === activeUser.id);
            const freeSeats = Math.max(0, trip.maxCrew - trip.participants.length);

            return (
              <div
                key={trip.id}
                className="liquid-glass-card rounded-3xl p-5 border border-white/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Status & Date */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                        trip.status === 'Набор открыт'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : trip.status === 'Экипаж набран'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {trip.status}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-xl border border-white">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-500" />
                      <span>{trip.date}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span>{trip.meetTime}</span>
                    </div>
                  </div>

                  {/* Title & Spot */}
                  <h3 className="text-base font-bold text-slate-800 leading-snug">
                    {trip.title}
                  </h3>

                  <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Navigation className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">Сбор: {trip.meetPlace}</span>
                    </div>
                  </div>

                  {/* Route & Fuel Specs */}
                  <div className="mt-4 grid grid-cols-3 gap-2 bg-sky-50/60 rounded-2xl p-2.5 border border-sky-100 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Маршрут</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {trip.distanceKm ? `~${trip.distanceKm} км` : 'По месту'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Бензин на чел.</div>
                      <div className="text-xs font-bold text-sky-700 mt-0.5">
                        {trip.costPerPerson ? `~${trip.costPerPerson} ₽` : 'Бесплатно'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium">Свободно</div>
                      <div className={`text-xs font-bold mt-0.5 ${freeSeats > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {freeSeats > 0 ? `${freeSeats} из ${trip.maxCrew}` : 'Мест нет'}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Target Fish */}
                  {trip.notes && (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 italic">
                      «{trip.notes}»
                    </p>
                  )}
                </div>

                {/* Bottom Actions: Crew + Edit/Delete/Join */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Организатор: <span className="font-semibold text-slate-700">{trip.organizerName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(trip)}
                      title="Редактировать рыбалку"
                      className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 hover:text-sky-600 border border-slate-200/60 shadow-sm transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (available if organizer or edit mode) */}
                    {onDeleteTrip && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить рыбалку "${trip.title}"?`)) {
                            hapticFeedback('heavy');
                            onDeleteTrip(trip.id);
                          }
                        }}
                        title="Удалить рыбалку"
                        className="p-2 rounded-xl bg-white/80 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/60 shadow-sm transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Join / Leave button */}
                    {isJoined ? (
                      <button
                        onClick={() => {
                          hapticFeedback('medium');
                          onLeaveTrip(trip.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition"
                      >
                        Выйти
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          hapticFeedback('success');
                          onJoinTrip(trip.id);
                        }}
                        disabled={freeSeats <= 0}
                        className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
                      >
                        В экипаж
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT FISHING TRIP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="liquid-glass-card rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col border border-white/95 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {editingTripId ? 'Редактировать рыбалку' : 'Создать рыбалку'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Выбор точки, планирование маршрута и расчет топлива
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTrip} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Trip Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Название выезда
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Выезд за навагой на Сухое Море"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                  required
                />
              </div>

              {/* Trip Type (Driver vs Passenger) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTripType('driver');
                    hapticFeedback('selection');
                  }}
                  className={`py-2 px-3 rounded-2xl text-xs font-semibold border text-center transition ${
                    tripType === 'driver'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white/80 text-slate-600 border-slate-200'
                  }`}
                >
                  🚗 Я водитель (есть авто)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTripType('passenger');
                    hapticFeedback('selection');
                  }}
                  className={`py-2 px-3 rounded-2xl text-xs font-semibold border text-center transition ${
                    tripType === 'passenger'
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white/80 text-slate-600 border-slate-200'
                  }`}
                >
                  🎒 Я пассажир (ищу попутку)
                </button>
              </div>

              {/* Section 1: Spot Selection & Inline New Spot */}
              <div className="bg-sky-50/50 p-4 rounded-3xl border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>Точка лова (куда едем)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSpotInline(!showAddSpotInline);
                      hapticFeedback('selection');
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Новая точка на карте</span>
                  </button>
                </div>

                {/* Spot selector */}
                {!showAddSpotInline ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {spots.map(s => {
                      const isSelected = customDestination === s.name;
                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSpotSelect(s)}
                          className={`p-2.5 rounded-2xl border text-left cursor-pointer transition ${
                            isSelected
                              ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                              : 'bg-white/90 text-slate-700 border-slate-200 hover:border-sky-300'
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{s.name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                            {s.area} • {s.recommendedFish?.join(', ') || 'Рыбалка'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Inline Drill-down: Map / Add spot directly */
                  <div className="bg-white p-3 rounded-2xl border border-sky-200 space-y-3">
                    <div className="text-xs font-semibold text-sky-900 flex items-center justify-between">
                      <span>Добавление точки с геолокацией</span>
                      <button
                        type="button"
                        onClick={() => setShowAddSpotInline(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Название точки (например: Мудьюг, восточная коса)"
                      value={newSpotName}
                      onChange={e => setNewSpotName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400">Широта (Lat)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSpotLat}
                          onChange={e => setNewSpotLat(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Долгота (Lon)</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newSpotLon}
                          onChange={e => setNewSpotLon(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick map preview */}
                    <div className="rounded-xl overflow-hidden h-28 border border-slate-200 relative">
                      <iframe
                        src={`https://yandex.ru/map-widget/v1/?ll=${newSpotLon}%2C${newSpotLat}&z=10&l=sat&pt=${newSpotLon},${newSpotLat},pm2rdm`}
                        className="w-full h-full border-0 pointer-events-none"
                        title="Map preview"
                      />
                      <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded-full">
                        Клик для фиксации координат
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveInlineSpot}
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition"
                    >
                      Сохранить и выбрать эту точку
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Route Planning & Fuel Auto-Calculation */}
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-sky-600" />
                  <span>Планирование маршрута и расчёт топлива</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Точка сбора (откуда)</label>
                    <select
                      value={meetPlace}
                      onChange={e => handleMeetPlaceSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    >
                      {POPULAR_MEET_POINTS.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">
                      Дистанция туда-обратно (км)
                    </label>
                    <input
                      type="number"
                      value={distanceKm}
                      onChange={e => setDistanceKm(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-sky-800"
                    />
                  </div>
                </div>

                {/* Fuel Live Summary Card */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        Итого топливо: ~{fuelPreview.totalCost} ₽
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fuelPreview.liters} л при расходе {fuelConsumption} л/100км
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sky-600 text-sm">
                      ~{fuelPreview.costPerPerson} ₽
                    </div>
                    <div className="text-[10px] text-slate-500">с человека в экипаже</div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Дата выезда</label>
                    <div className="flex gap-1 text-[10px] text-sky-600 font-semibold">
                      <button type="button" onClick={() => setQuickDate(1)} className="hover:underline">
                        Завтра
                      </button>
                      <span>•</span>
                      <button type="button" onClick={() => setNextWeekend(6)} className="hover:underline">
                        Сб
                      </button>
                      <span>•</span>
                      <button type="button" onClick={() => setNextWeekend(0)} className="hover:underline">
                        Вс
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Время сбора</label>
                  <input
                    type="time"
                    value={meetTime}
                    onChange={e => setMeetTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              {/* Max Crew */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Всего мест в экипаже (включая водителя): {maxCrew}
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={maxCrew}
                  onChange={e => setMaxCrew(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Примечания и пожелания
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  placeholder="Например: выезжаем затемно, берем ледобур 130мм..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
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
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition"
                >
                  {submitting ? 'Сохранение...' : editingTripId ? 'Сохранить изменения' : 'Опубликовать рыбалку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
