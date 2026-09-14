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
  Share2
} from 'lucide-react';
import { PlannedTrip, UserProfile } from '../../types/index.ts';
import { openTelegramLink } from '../../services/telegramWebApp.ts';

interface PlannedTripsViewProps {
  trips: PlannedTrip[];
  activeUser: UserProfile | null;
  onJoinTrip: (tripId: string) => Promise<void>;
  onLeaveTrip: (tripId: string) => Promise<void>;
  onCreateTrip: (trip: any) => Promise<void>;
}

export const PlannedTripsView: React.FC<PlannedTripsViewProps> = ({
  trips,
  activeUser,
  onJoinTrip,
  onLeaveTrip,
  onCreateTrip
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'my'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Trip Form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('Остров Мудьюг / Сухое Море');
  const [date, setDate] = useState('2026-09-26');
  const [meetTime, setMeetTime] = useState('05:30');
  const [meetPlace, setMeetPlace] = useState('Причал в пос. Лапоминка');
  const [transportType, setTransportType] = useState('Снегоход Буран с санями (2 свободных места)');
  const [maxCrew, setMaxCrew] = useState(4);
  const [targetFishInput, setTargetFishInput] = useState('Корюшка, Навага, Сиг');
  const [notes, setNotes] = useState('Выезд по утренней воде, сбор строго без опозданий.');
  const [submitting, setSubmitting] = useState(false);

  const filteredTrips = trips.filter(t => {
    if (filter === 'open') return t.status === 'Набор открыт';
    if (filter === 'my' && activeUser) {
      return t.participants.some(p => p.userId === activeUser.id);
    }
    return true;
  });

  const handleShareTrip = (trip: PlannedTrip) => {
    const text = encodeURIComponent(`🎣 Погнали на рыбалку: "${trip.title}" (${trip.destination})\nДата: ${trip.date} в ${trip.meetTime}\nСвободно мест: ${Math.max(0, trip.maxCrew - trip.participants.length)} из ${trip.maxCrew}`);
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/fishing_pomor_bot')}&text=${text}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destination || !activeUser) return;

    setSubmitting(true);
    try {
      const targetFish = targetFishInput.split(',').map(s => s.trim()).filter(Boolean);
      await onCreateTrip({
        organizerId: activeUser.id,
        organizerName: activeUser.name,
        title,
        destination,
        targetFish,
        date,
        meetTime,
        meetPlace,
        transportType,
        maxCrew: Number(maxCrew),
        checklist: [
          'Удочки с мормышками и блеснами',
          'Наживка (креветка, опарыш)',
          'Ледобур / Пешня',
          'Термос с горячим чаем',
          'Спасалки на шею'
        ],
        status: 'Набор открыт',
        notes
      });
      setIsModalOpen(false);
      setTitle('');
    } catch (err) {
      console.error('Error creating trip:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Запланированные Рыбалки</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Поморье & Экипажи
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Координация совместных выездов на снегоходах, мотособаках и лодках по Белому Морю и Двине.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'all'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({trips.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'open'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Свободные места
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filter === 'my'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Мой экипаж
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-medium transition shadow-md shadow-sky-950 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Собрать выезд</span>
          </button>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
            Нет запланированных рыбалок по выбранному фильтру. Соберите первый экипаж!
          </div>
        ) : (
          filteredTrips.map(trip => {
            const isUserJoined = activeUser
              ? trip.participants.some(p => p.userId === activeUser.id)
              : false;
            const isOrganizer = activeUser && trip.organizerId === activeUser.id;
            const freeSlots = trip.maxCrew - trip.participants.length;

            return (
              <div
                key={trip.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
              >
                <div>
                  {/* Top Status & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        trip.status === 'Набор открыт'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          : trip.status === 'Экипаж набран'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {trip.status} {freeSlots > 0 && `(осталось ${freeSlots} мест)`}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{trip.date}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{trip.meetTime}</span>
                    </div>
                  </div>

                  {/* Title & Destination */}
                  <h3 className="text-base font-bold text-slate-100 leading-snug">{trip.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{trip.destination}</span>
                  </div>

                  {/* Target Fish Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {trip.targetFish.map((fish, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1"
                      >
                        <Fish className="w-3 h-3 text-sky-400" />
                        {fish}
                      </span>
                    ))}
                  </div>

                  {/* Transport & Meet place */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{trip.transportType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Сбор: {trip.meetPlace}</span>
                    </div>
                  </div>

                  {/* Crew Participants */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>Экипаж ({trip.participants.length} из {trip.maxCrew}):</span>
                      <span className="font-mono text-slate-500">
                        {Math.round((trip.participants.length / trip.maxCrew) * 100)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2.5">
                      <div
                        className={`h-full transition-all ${
                          trip.participants.length >= trip.maxCrew ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${(trip.participants.length / trip.maxCrew) * 100}%` }}
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
                          <span className="text-[10px] text-slate-500">@{p.telegramUsername}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Checklist preview */}
                  {trip.checklist && trip.checklist.length > 0 && (
                    <div className="mt-3 text-xs text-slate-400">
                      <div className="font-medium text-slate-300 mb-1 flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-sky-400" />
                        <span>Снаряжение:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400 pl-1">
                        {trip.checklist.slice(0, 3).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                        {trip.checklist.length > 3 && (
                          <li className="text-slate-500">...еще {trip.checklist.length - 3} позиций</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] text-slate-500">
                      Капитан: <strong className="text-slate-300">{trip.organizerName}</strong>
                    </div>
                    <button
                      onClick={() => handleShareTrip(trip)}
                      title="Поделиться в Telegram (группы / ЛС)"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-600/30 text-slate-400 hover:text-sky-300 border border-slate-700/60 transition flex items-center gap-1 text-[11px]"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Поделиться</span>
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
                          onClick={() => onLeaveTrip(trip.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-medium transition"
                        >
                          Выйти
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onJoinTrip(trip.id)}
                      disabled={freeSlots <= 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-md shadow-emerald-950"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>{freeSlots <= 0 ? 'Мест нет' : 'Вступить в экипаж'}</span>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                <span>Запланировать выезд на рыбалку</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Название выезда / Тема</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Выезд на Мудьюг за навагой по утренней воде"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Водоем / Локация</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Мудьюг / Сухое Море / Маймакса"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Целевая рыба (через запятую)</label>
                  <input
                    type="text"
                    value={targetFishInput}
                    onChange={e => setTargetFishInput(e.target.value)}
                    placeholder="Корюшка, Навага, Окунь, Сиг"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Дата выезда</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Время сбора</label>
                  <input
                    type="time"
                    value={meetTime}
                    onChange={e => setMeetTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Место встречи / Старт</label>
                <input
                  type="text"
                  value={meetPlace}
                  onChange={e => setMeetPlace(e.target.value)}
                  placeholder="Причал пос. Лапоминка / набережная 26 л/з"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Техника / Транспорт</label>
                  <input
                    type="text"
                    value={transportType}
                    onChange={e => setTransportType(e.target.value)}
                    placeholder="Снегоход / Буксировщик / Лодка / Авто"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Всего мест в экипаже</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={maxCrew}
                    onChange={e => setMaxCrew(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Примечания и рекомендации капитана</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Особенности ледовой обстановки, насадки..."
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
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition shadow-md shadow-sky-950"
                >
                  {submitting ? 'Создание...' : 'Опубликовать выезд'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
