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
  ShieldCheck,
  Package,
  Fish,
  Anchor,
  Heart,
  Plus,
  Trash2,
  Tag,
  Star,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { UserProfile, UserTransport } from '../../types/index.ts';
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

// Quick suggestion chips for Pomor fishing
const SUGGESTED_INVENTORY = [
  'Палатка зимняя Куб 3-слойная (2.2х2.2м)',
  'Ледобур 130мм + шуруповерт 120Nm',
  'Санки-волокуши 120см с отбойником',
  'Эхолот Практик 6М / 8',
  'Пешня поморская кованая',
  'Газовая плитка турист + баллоны',
  'Термос Арктика 1.8л',
  'Спасалки на шею (безопасность на льду)',
  'Налобный фонарь 1000lm',
  'Ящик зимний пенополиуретан'
];

const SUGGESTED_RODS = [
  'Кобылка поморская (наважья, леска 0.25)',
  'Балалайка Salmo (корюшковая, леска 0.12)',
  'Зимний удильник с катушкой 60см (на сига)',
  'Блеснильник судачий углепластик 65см',
  'Поставушка с поплавком и флажком',
  'Удочка-сиговка с чувствительным кивком',
  'Самодур корюшковый 4 крючка'
];

const SUGGESTED_TACKLES = [
  'Мормышка фосфорная капля (светонакопитель)',
  'Балансир Rapala 5см окуневый (жаба)',
  'Блесна продольная серебряная (навага)',
  'Гирлянда на корюшку с 4 мормышками',
  'Флюорокарбон 0.14мм Daiwa',
  'Крючки длинное цевье №10 (под червя/креветку)',
  'Грузило конусное 20г для течения Двины',
  'Мормышка вольфрам уралка'
];

const SUGGESTED_WISHES = [
  'Выезды преимущественно в выходные дни по утренней воде',
  'Без курения и алкоголя в салоне',
  'Приоритет: Сухое Море и Мудьюг',
  'Готов делить расходы на бензин 50/50',
  'Ищу напарника с мотособакой или снегоходом',
  'Предпочитаю комфортный лов в палатке с обогревом',
  'Готов быть вторым водителем на дальние выезды',
  'Ловлю строго корюшку и навагу'
];

const TRANSPORT_PRESETS: {
  name: string;
  type: UserTransport['type'];
  seats: number;
  fuelType: UserTransport['fuelType'];
  fuelConsumption: number;
}[] = [
  { name: 'УАЗ Патриот 4х4', type: 'Автомобиль 4х4', seats: 4, fuelType: 'АИ-92', fuelConsumption: 12.5 },
  { name: 'Нива 2121 / 2131 4x4', type: 'Автомобиль 4х4', seats: 3, fuelType: 'АИ-92', fuelConsumption: 11.0 },
  { name: 'Снегоход Буран / Тайга', type: 'Снегоход', seats: 2, fuelType: 'Смесь 2Т (бензин+масло)', fuelConsumption: 18.0 },
  { name: 'Мотобуксировщик (собака) 15 л.с.', type: 'Мотособака', seats: 2, fuelType: 'АИ-92', fuelConsumption: 4.5 },
  { name: 'Лодка ПВХ 360 + мотор 9.9', type: 'Лодка / Катер', seats: 3, fuelType: 'Смесь 2Т (бензин+масло)', fuelConsumption: 6.0 },
  { name: 'Renault Duster 4WD', type: 'Автомобиль 4х4', seats: 4, fuelType: 'Дизель', fuelConsumption: 7.5 }
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onSaveProfile,
  onRefresh
}) => {
  const inTelegram = isInsideTelegram();

  // Active section tab filter
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'transport' | 'inventory' | 'rods' | 'tackles' | 'wishes'>('all');

  // Personal Fields
  const [name, setName] = useState(user.name);
  const [telegramUsername, setTelegramUsername] = useState(user.telegramUsername || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [homeDistrict, setHomeDistrict] = useState(user.homeDistrict || DISTRICT_PRESETS[0]);
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || 'Любитель');
  const [boatType, setBoatType] = useState(user.boatType || 'Без техники');
  const [bio, setBio] = useState(user.bio || '');

  // Requested Profile Sections:
  // 1. Транспорт
  const [transports, setTransports] = useState<UserTransport[]>(
    user.transports && user.transports.length > 0
      ? user.transports
      : [
          {
            id: 'tr-default',
            name: user.transportName || 'УАЗ Патриот 4x4',
            type: 'Автомобиль 4х4',
            seats: user.availableSeats ?? 4,
            fuelType: user.fuelType || 'АИ-92',
            fuelConsumptionPer100km: user.fuelConsumptionPer100km ?? 12.0,
            fuelPricePerLiter: user.fuelPricePerLiter ?? 56.5,
            isDefault: true
          }
        ]
  );
  const [showAddTransport, setShowAddTransport] = useState(false);
  const [newTransName, setNewTransName] = useState('');
  const [newTransType, setNewTransType] = useState<UserTransport['type']>('Автомобиль 4х4');
  const [newTransSeats, setNewTransSeats] = useState(4);
  const [newTransFuelType, setNewTransFuelType] = useState<UserTransport['fuelType']>('АИ-92');
  const [newTransConsumption, setNewTransConsumption] = useState(12.0);

  // 2. Инвентарь
  const [inventory, setInventory] = useState<string[]>(
    user.inventory && user.inventory.length > 0
      ? user.inventory
      : [
          'Палатка зимняя Куб 2.2x2.2м (3-слойная)',
          'Ледобур ТОРНАДО 130мм + шуруповерт',
          'Санки-волокуши 120см с отбойником',
          'Эхолот Практик 6М',
          'Пешня поморская кованая',
          'Газовая плитка турист + баллоны',
          'Термос Арктика 1.8л'
        ]
  );
  const [newInventoryItem, setNewInventoryItem] = useState('');

  // 3. Удочки
  const [rods, setRods] = useState<string[]>(
    user.rods && user.rods.length > 0
      ? user.rods
      : [
          'Кобылка поморская (наважья, леска 0.25)',
          'Балалайка Salmo (корюшковая, леска 0.12)',
          'Зимний удильник с катушкой 60см (на сига)',
          'Блеснильник судачий углепластик 65см'
        ]
  );
  const [newRodItem, setNewRodItem] = useState('');

  // 4. Снасти
  const [tackles, setTackles] = useState<string[]>(
    user.tackles && user.tackles.length > 0
      ? user.tackles
      : [
          'Мормышки фосфорные капельки (светонакопитель)',
          'Балансир Rapala 5см окуневый (жаба)',
          'Блесна продольная серебряная на навагу',
          'Гирлянда на корюшку с 4 мормышками',
          'Флюорокарбон 0.14мм Daiwa'
        ]
  );
  const [newTackleItem, setNewTackleItem] = useState('');

  // 5. Пожелания
  const [wishes, setWishes] = useState<string[]>(
    user.wishes && user.wishes.length > 0
      ? user.wishes
      : [
          'Выезды преимущественно в выходные дни по утренней воде',
          'Без курения в салоне автомобиля',
          'Ищу компанию на Сухое море и Мудьюг',
          'Готов делить расходы на бензин 50/50'
        ]
  );
  const [newWishItem, setNewWishItem] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Transport actions
  const handleAddTransport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransName.trim()) return;

    const newTr: UserTransport = {
      id: 'tr-' + Date.now(),
      name: newTransName.trim(),
      type: newTransType,
      seats: Number(newTransSeats),
      fuelType: newTransFuelType,
      fuelConsumptionPer100km: Number(newTransConsumption),
      fuelPricePerLiter: 56.5,
      isDefault: transports.length === 0
    };

    setTransports([...transports, newTr]);
    setNewTransName('');
    setShowAddTransport(false);
    hapticFeedback('success');
  };

  const handleDeleteTransport = (id: string) => {
    hapticFeedback('medium');
    const filtered = transports.filter(t => t.id !== id);
    if (filtered.length > 0 && !filtered.some(t => t.isDefault)) {
      filtered[0].isDefault = true;
    }
    setTransports(filtered);
  };

  const handleSetDefaultTransport = (id: string) => {
    hapticFeedback('selection');
    setTransports(
      transports.map(t => ({
        ...t,
        isDefault: t.id === id
      }))
    );
  };

  const handleApplyTransportPreset = (p: typeof TRANSPORT_PRESETS[0]) => {
    setNewTransName(p.name);
    setNewTransType(p.type);
    setNewTransSeats(p.seats);
    setNewTransFuelType(p.fuelType);
    setNewTransConsumption(p.fuelConsumption);
    hapticFeedback('selection');
  };

  // Generic List helpers
  const handleAddItem = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
      hapticFeedback('success');
    }
    clearInput();
  };

  const handleRemoveItem = (
    itemToRemove: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    hapticFeedback('light');
    setList(list.filter(item => item !== itemToRemove));
  };

  // Save profile with all requested fields
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const defaultTrans = transports.find(t => t.isDefault) || transports[0];

      await onSaveProfile({
        name: name.trim(),
        telegramUsername: telegramUsername.replace('@', '').trim(),
        phone: phone.trim(),
        homeDistrict,
        experienceLevel,
        boatType,
        bio: bio.trim(),
        // Active transport shortcuts
        transportName: defaultTrans ? defaultTrans.name : '',
        availableSeats: defaultTrans ? defaultTrans.seats : 2,
        fuelType: defaultTrans ? defaultTrans.fuelType : 'АИ-92',
        fuelConsumptionPer100km: defaultTrans ? defaultTrans.fuelConsumptionPer100km : 12.0,
        fuelPricePerLiter: defaultTrans?.fuelPricePerLiter || 56.5,
        // Arrays for profile
        transports,
        inventory,
        rods,
        tackles,
        wishes
      });

      setSavedSuccess(true);
      hapticFeedback('success');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      hapticFeedback('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
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
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-sky-600" />
              Транспорт: {transports.length}
            </span>
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

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition ${
            activeTab === 'all'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          Все разделы
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('personal');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'personal'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Личные данные</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('transport');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'transport'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Транспорт ({transports.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('inventory');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Инвентарь ({inventory.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('rods');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'rods'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Удочки ({rods.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('tackles');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'tackles'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Anchor className="w-3.5 h-3.5" />
          <span>Снасти ({tackles.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('wishes');
            hapticFeedback('selection');
          }}
          className={`px-3.5 py-2 rounded-2xl whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'wishes'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Пожелания ({wishes.length})</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* Section 1: Личные данные */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'personal') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Личные данные рыбака
                </h2>
                <p className="text-xs text-slate-400">
                  Имя и контакты для связи участников совместного выезда
                </p>
              </div>
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
                  Telegram @username
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
                  Телефон (связь на льду)
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
                  Специальная техника
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Section 2: Транспорт рыбака (Requested feature) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'transport') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Мой транспорт ({transports.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Автомобили 4х4, снегоходы, мотобуксировщики и лодки для выездов
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddTransport(!showAddTransport);
                  hapticFeedback('medium');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition border border-sky-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddTransport ? 'Скрыть форму' : 'Добавить транспорт'}</span>
              </button>
            </div>

            {/* List of existing transports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {transports.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition relative ${
                    t.isDefault
                      ? 'bg-gradient-to-br from-sky-50 to-blue-50/50 border-sky-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                        {t.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white">
                            Основной
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {t.type} • {t.seats} {t.seats === 1 ? 'место' : t.seats < 5 ? 'места' : 'мест'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTransport(t.id)}
                      title="Удалить транспорт"
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="text-slate-600 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.fuelType} (~{t.fuelConsumptionPer100km} л/100км)</span>
                    </div>

                    {!t.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultTransport(t.id)}
                        className="text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        Сделать основным
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Transport Panel */}
            {showAddTransport && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 animate-in fade-in duration-150">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>Новый транспорт</span>
                  <span className="text-[11px] text-slate-500 font-normal">или выберите пресет ниже:</span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {TRANSPORT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyTransportPreset(p)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 text-[11px] text-slate-700 font-medium transition"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Название</label>
                    <input
                      type="text"
                      value={newTransName}
                      onChange={e => setNewTransName(e.target.value)}
                      placeholder="УАЗ Патриот, Снегоход..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Категория</label>
                    <select
                      value={newTransType}
                      onChange={e => setNewTransType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    >
                      <option value="Автомобиль 4х4">Автомобиль 4х4</option>
                      <option value="Легковое авто">Легковое авто</option>
                      <option value="Снегоход">Снегоход</option>
                      <option value="Мотособака">Мотособака</option>
                      <option value="Лодка / Катер">Лодка / Катер</option>
                      <option value="Другое">Другое</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Мест для экипажа</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={newTransSeats}
                      onChange={e => setNewTransSeats(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Топливо</label>
                    <select
                      value={newTransFuelType}
                      onChange={e => setNewTransFuelType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    >
                      <option value="АИ-92">АИ-92</option>
                      <option value="АИ-95">АИ-95</option>
                      <option value="Дизель">Дизель</option>
                      <option value="Смесь 2Т (бензин+масло)">Смесь 2Т (бензин+масло)</option>
                      <option value="Газ">Газ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Расход (л/100км)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newTransConsumption}
                      onChange={e => setNewTransConsumption(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddTransport}
                      disabled={!newTransName.trim()}
                      className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition disabled:opacity-50"
                    >
                      Добавить в список
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* Section 3: Свой Инвентарь (Requested feature) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'inventory') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Package className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Мой инвентарь ({inventory.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Палатки, ледобуры, эхолоты, обогреватели и лагерное снаряжение
                </p>
              </div>
            </div>

            {/* Existing Items Chips */}
            <div className="flex flex-wrap gap-2">
              {inventory.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-800 text-xs font-medium border border-slate-200/80 group hover:border-slate-300 transition"
                >
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item, inventory, setInventory)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={newInventoryItem}
                onChange={e => setNewInventoryItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem(newInventoryItem, inventory, setInventory, () => setNewInventoryItem(''));
                  }
                }}
                placeholder="Добавить свой предмет (напр. Пешня кованая, Налобный фонарь...)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem(newInventoryItem, inventory, setInventory, () => setNewInventoryItem(''))}
                disabled={!newInventoryItem.trim()}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Популярный инвентарь для рыбалки в Архангельске (добавить в 1 клик):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_INVENTORY.filter(s => !inventory.includes(s)).map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAddItem(item, inventory, setInventory, () => {})}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] transition flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Section 4: Удочки (Requested feature) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'rods') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Мои удочки ({rods.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Зимние удильники, поморские кобылки, балалайки, сиговки и блеснильники
                </p>
              </div>
            </div>

            {/* Existing Rods */}
            <div className="flex flex-wrap gap-2">
              {rods.map((rod) => (
                <span
                  key={rod}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900 text-xs font-medium border border-sky-100 group transition"
                >
                  <Fish className="w-3.5 h-3.5 text-sky-600" />
                  <span>{rod}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(rod, rods, setRods)}
                    className="text-sky-400 hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Custom Rod Input */}
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={newRodItem}
                onChange={e => setNewRodItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem(newRodItem, rods, setRods, () => setNewRodItem(''));
                  }
                }}
                placeholder="Добавить удильник (напр. Кобылка под навагу леска 0.22...)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem(newRodItem, rods, setRods, () => setNewRodItem(''))}
                disabled={!newRodItem.trim()}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            {/* Quick Rod Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Популярные удильники Поморья (в 1 клик):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_RODS.filter(s => !rods.includes(s)).map(rod => (
                  <button
                    key={rod}
                    type="button"
                    onClick={() => handleAddItem(rod, rods, setRods, () => {})}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 text-[11px] transition flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{rod}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Section 5: Снасти и приманки (Requested feature) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'tackles') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Anchor className="w-5 h-5 text-sky-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Мои снасти ({tackles.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Мормышки, блесны, балансиры, гирлянды, поводки и оснастка
                </p>
              </div>
            </div>

            {/* Existing Tackles */}
            <div className="flex flex-wrap gap-2">
              {tackles.map((tackle) => (
                <span
                  key={tackle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-100 group transition"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{tackle}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(tackle, tackles, setTackles)}
                    className="text-emerald-400 hover:text-rose-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Custom Tackle Input */}
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={newTackleItem}
                onChange={e => setNewTackleItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem(newTackleItem, tackles, setTackles, () => setNewTackleItem(''));
                  }
                }}
                placeholder="Добавить снасть (напр. Фосфорная капелька светонакопитель...)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem(newTackleItem, tackles, setTackles, () => setNewTackleItem(''))}
                disabled={!newTackleItem.trim()}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            {/* Quick Tackle Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Уловистые снасти и мормышки для Белого моря и Двины:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TACKLES.filter(s => !tackles.includes(s)).map(tackle => (
                  <button
                    key={tackle}
                    type="button"
                    onClick={() => handleAddItem(tackle, tackles, setTackles, () => {})}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 text-[11px] transition flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{tackle}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Section 6: Пожелания рыбака (Requested feature) */}
        {/* ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'wishes') && (
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/90 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Heart className="w-5 h-5 text-rose-500" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Мои пожелания ({wishes.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Предпочтения по времени выезда, попутчикам, комфорту и местам ловли
                </p>
              </div>
            </div>

            {/* Existing Wishes */}
            <div className="space-y-2">
              {wishes.map((wish) => (
                <div
                  key={wish}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-medium group transition"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{wish}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(wish, wishes, setWishes)}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Wish Input */}
            <div className="flex gap-2 text-xs">
              <input
                type="text"
                value={newWishItem}
                onChange={e => setNewWishItem(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem(newWishItem, wishes, setWishes, () => setNewWishItem(''));
                  }
                }}
                placeholder="Добавить пожелание (напр. Без ночевки, возврат до 17:00...)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleAddItem(newWishItem, wishes, setWishes, () => setNewWishItem(''))}
                disabled={!newWishItem.trim()}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>

            {/* Quick Wish Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Частые пожелания для экипажа:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_WISHES.filter(s => !wishes.includes(s)).map(wish => (
                  <button
                    key={wish}
                    type="button"
                    onClick={() => handleAddItem(wish, wishes, setWishes, () => {})}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[11px] transition flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{wish}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Bar */}
        <div className="liquid-glass-card rounded-3xl p-4 border border-white/95 shadow-xl flex items-center justify-between gap-4 sticky bottom-4 z-40 bg-white/90 backdrop-blur-md">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            Все изменения профиля, техники и снастей сохраняются на сервере
          </div>

          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            {savedSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-200 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Сохранено!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/25 active:scale-95 transition disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Сохранение...' : 'Сохранить весь профиль'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
