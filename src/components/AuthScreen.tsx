import { FormEvent, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';

type AuthMode = 'login' | 'register';

function mapFirebaseAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con correo y contraseña aún no está habilitado en Firebase Console. Actívalo en Authentication > Sign-in method > Correo electrónico/contraseña, o ingresa rápido con Google.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta nueva.';
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta registrada. Inicia sesión para acceder a tus datos.';
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de completar el inicio de sesión.';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes e intenta de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Espera un momento antes de volver a intentarlo.';
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    default:
      return error instanceof Error
        ? error.message
        : 'No fue posible iniciar sesión. Intenta nuevamente.';
  }
}

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isSubmitting || isGoogleLoading) return;
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isGoogleLoading) return;

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register' && cleanName.length > 0 && cleanName.length < 2) {
      setErrorMsg('Escribe un nombre de al menos 2 caracteres.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const derivedName =
          cleanName || cleanEmail.split('@')[0] || 'Usuario';
        await updateProfile(cred.user, { displayName: derivedName.slice(0, 80) });
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6448FF] to-[#4326D9] border border-indigo-300/25 shadow-[0_12px_32px_rgba(91,61,245,0.35)] text-white flex items-center justify-center mx-auto">
            <Wallet className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Mi Presupuesto Mensual
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Tus gastos y tu presupuesto guardados de forma privada en tu cuenta.
          </p>
        </div>

        {/* Auth Card */}
        <section
          aria-label="Inicio de sesión"
          className="bg-[#111625] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-[0_16px_48px_rgba(0,0,0,0.45)] space-y-5"
        >
          {/* Quick Google Option */}
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting || isGoogleLoading}
            className="w-full h-12 px-4 rounded-xl bg-white text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.5 1.18-4.22 1.18-3.24 0-5.99-2.19-6.97-5.14H1.02v3.14C3.05 21.2 7.2 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.03 14.03A7.2 7.2 0 0 1 4.65 12c0-.7.13-1.39.38-2.03V6.83H1.02A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.02 5.17l4.01-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.83c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.19 15.3 0 12 0 7.2 0 3.05 2.8 1.02 6.83l4.01 3.14C6.01 7.02 8.76 4.83 12 4.83Z"
              />
            </svg>
            <span>
              {isGoogleLoading ? 'Conectando con Google...' : 'Entrar rápido con Google'}
            </span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-1 border-t border-white/[0.08]" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              o con correo y contraseña
            </span>
            <div className="flex-1 border-t border-white/[0.08]" />
          </div>

          {/* Tabs: Iniciar sesión / Crear cuenta */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#181E32] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#5B3DF5] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#5B3DF5] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear cuenta nueva
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-rose-950/60 border border-rose-500/35 px-3.5 py-3 text-xs text-rose-200 flex items-start gap-2.5 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Tu nombre
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    type="text"
                    maxLength={80}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Javier Albeiro Suarez"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="w-full h-12 rounded-xl bg-[#5B3DF5] text-white text-sm font-semibold hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
            >
              {isSubmitting
                ? mode === 'login'
                  ? 'Ingresando...'
                  : 'Creando cuenta...'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta y continuar'}
            </button>
          </form>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>Cada cuenta ve únicamente su propio presupuesto y movimientos.</span>
          </div>
        </section>
      </div>
    </div>
  );
}
