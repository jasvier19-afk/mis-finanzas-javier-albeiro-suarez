import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, updateProfile, User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  LogOut,
  Plus,
  Sparkles,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { AssistantDrawer, AssistantMessage } from './components/AssistantDrawer';
import { AuthScreen } from './components/AuthScreen';
import { BudgetOnboardingScreen } from './components/BudgetOnboardingScreen';
import { ChartMode, DailyExpensesChart } from './components/DailyExpensesChart';
import { MonthProgressCard } from './components/MonthProgressCard';
import { MonthlySummary } from './components/MonthlySummary';
import { MovementDetailScreen } from './components/MovementDetailScreen';
import { MovementsListScreen } from './components/MovementsListScreen';
import { RecentTransactions } from './components/RecentTransactions';
import { RegisterExpenseScreen } from './components/RegisterExpenseScreen';
import { RegisterIncomeScreen } from './components/RegisterIncomeScreen';
import {
  CURRENT_DAY_OF_MONTH,
  CURRENT_MONTH_LABEL,
  ExpenseCategory,
  IncomeCategory,
  Movement,
  PaymentMethod,
  formatCOP,
  formatIsoDateShort,
  getBudgetSummary,
  getChronologicalExpenses,
  getDailySpendingSeries,
  getRecentExpenses,
} from './data/budgetData';
import {
  UserProfile,
  auth,
  createUserMovement,
  saveInitialUserProfile,
  subscribeUserMovements,
  subscribeUserProfile,
  updateUserDisplayName,
  updateUserMonthlyBudget,
} from './firebase';

type AppScreen =
  | 'dashboard'
  | 'movements'
  | 'detail'
  | 'register'
  | 'register-income';

const INITIAL_ASSISTANT_MESSAGES: AssistantMessage[] = [
  {
    id: 'welcome-assistant',
    role: 'assistant',
    content:
      'Hola, soy tu asistente de presupuesto. Cuéntame qué gastaste en lenguaje natural (por ejemplo: "Gasté 25.000 en almuerzo hoy"), sube la foto de un ticket o envíame una nota de voz.',
  },
];

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState<boolean>(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [activeScreen, setActiveScreen] = useState<AppScreen>('dashboard');
  const [previousScreen, setPreviousScreen] = useState<'dashboard' | 'movements'>(
    'dashboard'
  );
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(CURRENT_DAY_OF_MONTH);
  const [chartMode, setChartMode] = useState<ChartMode>('daily');
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(
    INITIAL_ASSISTANT_MESSAGES
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      setIsAuthReady(true);

      // Reset account-scoped UI state immediately on sign-out or account switch
      setUserProfile(null);
      setIsProfileLoaded(false);
      setMovements([]);
      setSelectedMovementId(null);
      setActiveScreen('dashboard');
      setPreviousScreen('dashboard');
      setLastSavedNotice(null);
      setIsAssistantOpen(false);
      setAssistantMessages(INITIAL_ASSISTANT_MESSAGES);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !authUser) return;

    const unsubProfile = subscribeUserProfile(
      authUser.uid,
      (profile) => {
        setUserProfile(profile);
        setIsProfileLoaded(true);
      },
      (err) => {
        setFatalError(err);
      }
    );

    const unsubMovements = subscribeUserMovements(
      authUser.uid,
      (items) => {
        setMovements(items);
      },
      (err) => {
        setFatalError(err);
      }
    );

    return () => {
      unsubProfile();
      unsubMovements();
    };
  }, [isAuthReady, authUser]);

  if (fatalError) {
    throw fatalError;
  }

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!isAuthReady || (authUser && !isProfileLoaded)) {
    return (
      <div className="min-h-screen bg-[#090C15] text-slate-200 flex flex-col items-center justify-center gap-3 px-4">
        <div className="w-10 h-10 rounded-xl bg-[#5B3DF5]/20 border border-[#5B3DF5]/40 text-[#8673FF] flex items-center justify-center animate-pulse">
          <Wallet className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-sm text-slate-400">Cargando tu cuenta privada...</p>
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  if (!userProfile || !userProfile.hasConfiguredBudget) {
    const suggestedName =
      authUser.displayName?.trim() ||
      authUser.email?.split('@')[0] ||
      'Javier Albeiro Suarez';

    return (
      <BudgetOnboardingScreen
        email={authUser.email ?? 'tu cuenta'}
        initialDisplayName={suggestedName}
        onComplete={async ({ displayName, baseMonthlyBudget }) => {
          if (authUser.displayName !== displayName) {
            await updateProfile(authUser, { displayName }).catch(() => undefined);
          }
          await saveInitialUserProfile({
            uid: authUser.uid,
            email: authUser.email ?? '',
            displayName,
            baseMonthlyBudget,
          });
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  const baseMonthlyBudget = userProfile.baseMonthlyBudget;
  const userName = userProfile.displayName || authUser.displayName || 'Usuario';

  const hasExpenses = movements.some((m) => m.type === 'expense');
  const summary = getBudgetSummary(movements, baseMonthlyBudget);
  const dailySeries = getDailySpendingSeries(movements);
  const chronologicalMovements = getChronologicalExpenses(movements);
  const recentMovements = getRecentExpenses(movements, 5);

  const selectedMovement =
    selectedMovementId !== null
      ? movements.find((item) => item.id === selectedMovementId) ?? null
      : null;

  const handleOpenDetail = (
    movement: Movement,
    from: 'dashboard' | 'movements'
  ) => {
    setSelectedMovementId(movement.id);
    if (movement.type === 'expense') {
      setSelectedDay(movement.day);
    }
    setPreviousScreen(from);
    setActiveScreen('detail');
  };

  const handleOpenRegisterExpense = (from: 'dashboard' | 'movements') => {
    setPreviousScreen(from);
    setActiveScreen('register');
  };

  const handleOpenRegisterIncome = (from: 'dashboard' | 'movements') => {
    setPreviousScreen(from);
    setActiveScreen('register-income');
  };

  const insertExpense = (data: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    description: string;
    isoDate?: string;
    stayOnCurrentScreen?: boolean;
  }) => {
    const isoDate =
      data.isoDate ?? `2026-11-${String(data.day).padStart(2, '0')}`;
    const { label } = formatIsoDateShort(isoDate);
    const dateLabel = isoDate ? label : `${data.day} nov`;

    const nextOrder =
      movements.reduce((max, item) => Math.max(max, item.createdAtOrder ?? 0), 0) + 1;
    const movementId = `exp-${Date.now()}-${nextOrder}`;

    void createUserMovement({
      uid: authUser.uid,
      id: movementId,
      type: 'expense',
      day: data.day,
      dateLabel,
      isoDate,
      category: data.category,
      description: data.description,
      amount: data.amount,
      createdAtOrder: nextOrder,
    }).catch((err) => {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    });

    setLastSavedNotice(
      `Gasto registrado: ${formatCOP(data.amount)} en ${data.category} (${dateLabel}).`
    );
    setSelectedDay(data.day);
    if (!data.stayOnCurrentScreen) {
      setActiveScreen('dashboard');
    }
  };

  const handleSaveExpense = (data: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    description: string;
  }) => {
    insertExpense({
      amount: data.amount,
      category: data.category,
      day: data.day,
      description: data.description,
    });
  };

  const handleAssistantRegisterExpense = (data: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    description: string;
    isoDate: string;
  }) => {
    insertExpense({
      amount: data.amount,
      category: data.category,
      day: data.day,
      description: data.description,
      isoDate: data.isoDate,
      stayOnCurrentScreen: true,
    });
  };

  const handleSaveIncome = (data: {
    amount: number;
    description: string;
    category: IncomeCategory;
    isoDate: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => {
    const nextOrder =
      movements.reduce((max, item) => Math.max(max, item.createdAtOrder ?? 0), 0) + 1;
    const { label, dayNumber } = formatIsoDateShort(data.isoDate);
    const movementId = `inc-${Date.now()}-${nextOrder}`;

    void createUserMovement({
      uid: authUser.uid,
      id: movementId,
      type: 'income',
      day: dayNumber,
      dateLabel: label,
      isoDate: data.isoDate,
      category: data.category,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes || undefined,
      createdAtOrder: nextOrder,
    }).catch((err) => {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    });

    setLastSavedNotice(
      `Ingreso registrado correctamente (+${formatCOP(data.amount)} · ${data.description}).`
    );
    setActiveScreen('dashboard');
  };

  const handleUpdateBudget = (newBaseBudget: number) => {
    void updateUserMonthlyBudget(authUser.uid, newBaseBudget).catch((err) => {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    });
  };

  const handleChangeUserName = (newName: string) => {
    void updateUserDisplayName(authUser.uid, newName).catch((err) => {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    });
  };

  const handleAddAssistantMessage = (msg: AssistantMessage) => {
    setAssistantMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        {/* Top Header with cleaner Stripe/Linear-inspired hierarchy */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setActiveScreen('dashboard')}
              className="text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] rounded-lg"
            >
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Mi Presupuesto Mensual
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Resumen de {CURRENT_MONTH_LABEL.toLowerCase()}
              </p>
            </button>

            {/* Mobile status badge */}
            <div className="md:hidden">
              {summary.isPositiveBalance ? (
                <div
                  role="status"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111625] border border-white/[0.08] text-[11px] font-semibold tracking-wider text-slate-200 uppercase"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Balance positivo</span>
                </div>
              ) : (
                <div
                  role="status"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-[11px] font-semibold tracking-wider text-rose-300 uppercase"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
                  <span>Balance negativo</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
            {/* Navigation links */}
            <nav
              aria-label="Navegación principal"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#111625] border border-white/[0.07]"
            >
              <button
                type="button"
                onClick={() => setActiveScreen('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeScreen === 'dashboard'
                    ? 'bg-[#5B3DF5] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('movements')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeScreen === 'movements'
                    ? 'bg-[#5B3DF5] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Movimientos
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('detail')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeScreen === 'detail'
                    ? 'bg-[#5B3DF5] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Detalle
              </button>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAssistantOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111625] border border-white/[0.08] text-slate-200 text-xs font-semibold hover:bg-[#181E32] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8673FF]" aria-hidden="true" />
                <span>Asistente</span>
              </button>

              {/* Desktop status badge */}
              <div className="hidden md:block">
                {summary.isPositiveBalance ? (
                  <div
                    role="status"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#111625] border border-white/[0.08] text-[11px] font-semibold tracking-wider text-slate-200 uppercase whitespace-nowrap"
                  >
                    <span
                      className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Balance positivo</span>
                  </div>
                ) : (
                  <div
                    role="status"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-950/60 border border-rose-500/30 text-[11px] font-semibold tracking-wider text-rose-300 uppercase whitespace-nowrap"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
                    <span>Balance negativo</span>
                  </div>
                )}
              </div>

              <div className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl bg-[#111625] border border-white/[0.08]">
                <UserIcon className="w-3.5 h-3.5 text-[#8673FF] shrink-0" aria-hidden="true" />
                <span
                  className="text-xs font-medium text-slate-200 max-w-[130px] truncate"
                  title={authUser.email ?? userName}
                >
                  {userName}
                </span>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.05] text-[11px] font-semibold text-slate-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Confirmation feedback banner */}
        <AnimatePresence>
          {activeScreen === 'dashboard' && lastSavedNotice && (
            <motion.div
              key={lastSavedNotice}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              role="status"
              className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-200"
            >
              <div className="flex items-center gap-2.5 font-medium">
                <CheckCircle2
                  className="w-4 h-4 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>{lastSavedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setLastSavedNotice(null)}
                className="p-1 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main>
          <AnimatePresence mode="wait">
            {activeScreen === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <MonthlySummary
                  baseMonthlyBudget={summary.baseMonthlyBudget}
                  totalIncome={summary.totalIncome}
                  monthlyBudget={summary.monthlyBudget}
                  totalSpent={summary.totalSpent}
                  availableBalance={summary.availableBalance}
                  isPositiveBalance={summary.isPositiveBalance}
                  onUpdateBudget={handleUpdateBudget}
                  onFocusChartMode={setChartMode}
                />

                {/* Acciones rápidas: centrado bajo las 3 tarjetas con espaciado de 28px */}
                <section
                  aria-labelledby="acciones-rapidas-titulo"
                  className="mt-7 mb-6 flex justify-center"
                >
                  <div className="w-full max-w-xl bg-[#111625] border border-white/[0.07] rounded-2xl px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                    <div className="flex items-center justify-center mb-3">
                      <h2
                        id="acciones-rapidas-titulo"
                        className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
                      >
                        Acciones rápidas
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenRegisterIncome('dashboard')}
                        className="w-full h-12 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-400/45 shadow-[0_4px_16px_rgba(16,185,129,0.1)] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                      >
                        <Banknote className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Registrar ingreso</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRegisterExpense('dashboard')}
                        className="w-full h-12 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] border border-[#7259FF]/30 text-white text-sm font-semibold hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
                      >
                        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Registrar nuevo gasto</span>
                      </button>
                    </div>
                  </div>
                </section>

                {!hasExpenses ? (
                  /* Dashboard vacío integrado dentro del dashboard principal */
                  <section
                    aria-labelledby="dashboard-vacio-titulo"
                    className="bg-[#111625] border border-white/[0.07] rounded-2xl px-6 py-14 sm:py-16 text-center"
                  >
                    <div className="max-w-md mx-auto">
                      <div
                        className="w-14 h-14 rounded-2xl bg-[#5B3DF5]/15 border border-[#5B3DF5]/30 text-[#8673FF] flex items-center justify-center mx-auto"
                        aria-hidden="true"
                      >
                        <Wallet className="w-7 h-7" />
                      </div>

                      <h2
                        id="dashboard-vacio-titulo"
                        className="mt-5 text-xl font-bold tracking-tight text-white"
                      >
                        Aún no hay gastos este mes
                      </h2>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                        Registra el primero y empieza a ver en qué se va la plata
                      </p>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenRegisterExpense('dashboard')}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5B3DF5] text-white text-sm font-semibold hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                          <span>Registrar tu primer gasto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsAssistantOpen(true)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#181E32] border border-white/[0.08] text-slate-200 text-sm font-semibold hover:bg-white/[0.08] transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-[#8673FF]" aria-hidden="true" />
                          <span>Registrar con Asistente</span>
                        </button>
                      </div>
                    </div>
                  </section>
                ) : (
                  /* Mockup 2-column grid: Chart on left (7 cols), Progreso del Mes + Últimos Movimientos stacked on right (5 cols) */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div className="lg:col-span-7 flex flex-col">
                      <DailyExpensesChart
                        series={dailySeries}
                        monthlyBudget={summary.monthlyBudget}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        mode={chartMode}
                        onModeChange={setChartMode}
                      />
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-5">
                      <MonthProgressCard
                        monthlyBudget={summary.monthlyBudget}
                        totalSpent={summary.totalSpent}
                        availableBalance={summary.availableBalance}
                        spentPercentage={summary.spentPercentage}
                        spentBarWidth={summary.spentBarWidth}
                        availablePercentage={summary.availablePercentage}
                        isPositiveBalance={summary.isPositiveBalance}
                      />

                      <RecentTransactions
                        expenses={recentMovements}
                        totalCount={movements.length}
                        selectedDay={selectedDay}
                        onSelectExpense={(movement) =>
                          handleOpenDetail(movement, 'dashboard')
                        }
                        onViewAll={() => setActiveScreen('movements')}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeScreen === 'movements' && (
              <motion.div
                key="movements"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <MovementsListScreen
                  expenses={chronologicalMovements}
                  hasExpenses={hasExpenses}
                  onSelectExpense={(movement) =>
                    handleOpenDetail(movement, 'movements')
                  }
                  onBackToDashboard={() => setActiveScreen('dashboard')}
                  onOpenRegister={() => handleOpenRegisterExpense('movements')}
                  onOpenRegisterIncome={() => handleOpenRegisterIncome('movements')}
                />
              </motion.div>
            )}

            {activeScreen === 'detail' && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <MovementDetailScreen
                  expense={hasExpenses ? selectedMovement : null}
                  monthlyBudget={summary.monthlyBudget}
                  totalSpent={summary.totalSpent}
                  onBack={() => setActiveScreen(previousScreen)}
                />
              </motion.div>
            )}

            {activeScreen === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <RegisterExpenseScreen
                  currentAvailableBalance={summary.availableBalance}
                  onSaveExpense={handleSaveExpense}
                  onCancel={() => setActiveScreen(previousScreen)}
                />
              </motion.div>
            )}

            {activeScreen === 'register-income' && (
              <motion.div
                key="register-income"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <RegisterIncomeScreen
                  currentAvailableBalance={summary.availableBalance}
                  onSaveIncome={handleSaveIncome}
                  onCancel={() => setActiveScreen(previousScreen)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        userName={userName}
        onChangeUserName={handleChangeUserName}
        messages={assistantMessages}
        onAddMessage={handleAddAssistantMessage}
        budgetSummary={{
          monthlyBudget: summary.monthlyBudget,
          totalIncome: summary.totalIncome,
          totalSpent: summary.totalSpent,
          availableBalance: summary.availableBalance,
          spentPercentage: summary.spentPercentage,
          isPositiveBalance: summary.isPositiveBalance,
        }}
        recentMovements={recentMovements}
        onRegisterExpense={handleAssistantRegisterExpense}
      />
    </div>
  );
}
