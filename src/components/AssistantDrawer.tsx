import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileAudio,
  ImagePlus,
  Mic,
  Pencil,
  Send,
  Sparkles,
  Square,
  User,
  X,
} from 'lucide-react';
import {
  CURRENT_ISO_DATE,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  Movement,
  formatCOP,
  formatIsoDateShort,
} from '../data/budgetData';

export interface MediaAttachment {
  kind: 'image' | 'audio';
  mimeType: string;
  base64Data: string;
  fileName: string;
  previewUrl: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  media?: MediaAttachment;
  registeredExpense?: {
    amount: number;
    category: ExpenseCategory;
    description: string;
    dateLabel: string;
  };
  modelUsed?: string;
}

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onChangeUserName: (name: string) => void;
  messages: AssistantMessage[];
  onAddMessage: (msg: AssistantMessage) => void;
  budgetSummary: {
    monthlyBudget: number;
    totalIncome: number;
    totalSpent: number;
    availableBalance: number;
    spentPercentage: number;
    isPositiveBalance: boolean;
  };
  recentMovements: Movement[];
  onRegisterExpense: (data: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    description: string;
    isoDate: string;
  }) => void;
}

const SUGGESTION_PROMPTS = [
  'Gasté 25.000 en almuerzo hoy',
  '¿Me alcanza para comprar algo de 150.000?',
  '¿Cuánto saldo tengo disponible?',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function normalizeCategory(rawCategory: unknown): ExpenseCategory {
  const text = String(rawCategory ?? '').trim().toLowerCase();
  const exact = EXPENSE_CATEGORIES.find((cat) => cat.toLowerCase() === text);
  if (exact) return exact;

  if (
    text.includes('aliment') ||
    text.includes('comida') ||
    text.includes('restaur') ||
    text.includes('almuerz') ||
    text.includes('mercado') ||
    text.includes('café')
  ) {
    return 'Alimentación';
  }
  if (
    text.includes('transp') ||
    text.includes('bus') ||
    text.includes('taxi') ||
    text.includes('uber') ||
    text.includes('metro') ||
    text.includes('gasolina')
  ) {
    return 'Transporte';
  }
  if (
    text.includes('servicio') ||
    text.includes('luz') ||
    text.includes('agua') ||
    text.includes('internet') ||
    text.includes('energía') ||
    text.includes('teléf')
  ) {
    return 'Servicios públicos';
  }
  if (
    text.includes('ropa') ||
    text.includes('compra') ||
    text.includes('tenis') ||
    text.includes('personal')
  ) {
    return 'Ropa y compras personales';
  }
  if (
    text.includes('entreten') ||
    text.includes('ocio') ||
    text.includes('cine') ||
    text.includes('concierto') ||
    text.includes('juego')
  ) {
    return 'Entretenimiento y ocio';
  }

  return 'Alimentación';
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('No se pudo leer el archivo.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo adjunto.'));
    reader.readAsDataURL(blob);
  });
}

function formatRecordingTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function AssistantDrawer({
  isOpen,
  onClose,
  userName,
  onChangeUserName,
  messages,
  onAddMessage,
  budgetSummary,
  recentMovements,
  onRegisterExpense,
}: AssistantDrawerProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<MediaAttachment | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(userName);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopRecordingTracks = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const handleStartRecording = async () => {
    setMediaError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError(
        'Tu navegador no soporta grabación de audio directa. Puedes cargar un archivo de audio.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
      const supportedMime = preferredMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const rawMime = recorder.mimeType || 'audio/webm';
        const cleanMime = rawMime.split(';')[0] || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: cleanMime });
        stopRecordingTracks();
        setIsRecording(false);
        setRecordingSeconds(0);

        if (blob.size === 0) return;

        try {
          const base64Data = await readBlobAsBase64(blob);
          const previewUrl = URL.createObjectURL(blob);
          setPendingMedia({
            kind: 'audio',
            mimeType: cleanMime,
            base64Data,
            fileName: 'Nota de voz grabada',
            previewUrl,
          });
        } catch {
          setMediaError('No se pudo procesar la nota de voz grabada.');
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      stopRecordingTracks();
      setIsRecording(false);
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setMediaError(
          'Permiso de micrófono denegado. Habilita el micrófono en tu navegador o sube un archivo de audio.'
        );
      } else {
        setMediaError(
          'No se pudo acceder al micrófono. Verifica que esté conectado o sube un archivo de audio.'
        );
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        stopRecordingTracks();
        setIsRecording(false);
        setRecordingSeconds(0);
      };
      mediaRecorderRef.current.stop();
    } else {
      stopRecordingTracks();
      setIsRecording(false);
      setRecordingSeconds(0);
    }
  };

  const handleFileSelected = async (
    e: ChangeEvent<HTMLInputElement>,
    kind: 'image' | 'audio'
  ) => {
    setMediaError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMediaError('El archivo supera el límite de 10 MB.');
      return;
    }

    const fallbackMime = kind === 'image' ? 'image/jpeg' : 'audio/mpeg';
    const mimeType = file.type || fallbackMime;

    try {
      const base64Data = await readBlobAsBase64(file);
      const previewUrl = URL.createObjectURL(file);
      setPendingMedia({
        kind,
        mimeType,
        base64Data,
        fileName: file.name,
        previewUrl,
      });
    } catch {
      setMediaError('No se pudo leer el archivo seleccionado.');
    }
  };

  const handleSaveName = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = draftName.trim();
    if (cleaned.length >= 2) {
      onChangeUserName(cleaned);
    } else {
      setDraftName(userName);
    }
    setIsEditingName(false);
  };

  const sendMessage = async (
    textToSend: string,
    attachmentToSend: MediaAttachment | null = pendingMedia
  ) => {
    const trimmed = textToSend.trim();
    if ((!trimmed && !attachmentToSend) || isLoading) return;

    const displayContent =
      trimmed ||
      (attachmentToSend?.kind === 'image'
        ? 'Adjunté una imagen de gasto o recibo.'
        : 'Adjunté una nota de voz.');

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayContent,
      media: attachmentToSend ?? undefined,
    };

    onAddMessage(userMsg);
    setInput('');
    setPendingMedia(null);
    setMediaError(null);
    setIsLoading(true);

    try {
      const conversationForApi = [...messages, userMsg]
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
          media: m.media
            ? {
                kind: m.media.kind,
                mimeType: m.media.mimeType,
                base64Data: m.media.base64Data,
                fileName: m.media.fileName,
              }
            : undefined,
        }));

      const recentSummary = recentMovements
        .slice(0, 5)
        .map(
          (m) =>
            `  * ${m.dateLabel}: ${m.description} (${m.category}) - ${
              m.type === 'income' ? '+' : ''
            }${formatCOP(m.amount)}`
        )
        .join('\n');

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationForApi,
          budgetContext: {
            userName,
            monthlyBudget: budgetSummary.monthlyBudget,
            totalIncome: budgetSummary.totalIncome,
            totalSpent: budgetSummary.totalSpent,
            availableBalance: budgetSummary.availableBalance,
            spentPercentage: budgetSummary.spentPercentage,
            isPositiveBalance: budgetSummary.isPositiveBalance,
            currentDate: CURRENT_ISO_DATE,
            recentMovementsSummary: recentSummary,
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        reply?: string;
        functionCalls?: Array<{
          name: string;
          args: Record<string, unknown>;
        }>;
        modelUsed?: string;
        error?: string;
        code?: number;
        details?: string;
      };

      if (!response.ok) {
        const statusCode = payload.code ?? response.status;
        const rawDetails = payload.details ?? payload.error ?? response.statusText;

        let friendlyMessage: string;
        if (
          statusCode === 503 ||
          String(rawDetails).includes('503') ||
          String(rawDetails).toUpperCase().includes('UNAVAILABLE')
        ) {
          friendlyMessage =
            'El asistente está muy solicitado en este momento. Por favor, intenta de nuevo en un minuto.';
        } else if (
          statusCode === 429 ||
          String(rawDetails).includes('429') ||
          String(rawDetails).toUpperCase().includes('RESOURCE_EXHAUSTED')
        ) {
          friendlyMessage =
            'He alcanzado mi límite de mensajes por ahora. Intenta de nuevo más tarde.';
        } else {
          friendlyMessage = `No se pudo completar la solicitud (${statusCode}): ${rawDetails}`;
        }

        onAddMessage({
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: friendlyMessage,
          isError: true,
        });
        return;
      }

      let confirmedExpense: AssistantMessage['registeredExpense'] = undefined;

      if (Array.isArray(payload.functionCalls)) {
        for (const call of payload.functionCalls) {
          if (call.name === 'registerExpense' && call.args) {
            const rawAmount = Number(call.args.amount);
            if (Number.isFinite(rawAmount) && rawAmount > 0) {
              const amount = Math.round(rawAmount);
              const isoDate =
                typeof call.args.date === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(call.args.date)
                  ? call.args.date
                  : CURRENT_ISO_DATE;
              const { label, dayNumber } = formatIsoDateShort(isoDate);
              const category = normalizeCategory(call.args.category);
              const description =
                typeof call.args.description === 'string' &&
                call.args.description.trim().length > 0
                  ? call.args.description.trim()
                  : category;

              onRegisterExpense({
                amount,
                category,
                day: dayNumber,
                description,
                isoDate,
              });

              confirmedExpense = {
                amount,
                category,
                description,
                dateLabel: label,
              };
            }
          }
        }
      }

      onAddMessage({
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content:
          payload.reply ??
          `¡Listo, ${userName}! He procesado tu solicitud en tu presupuesto mensual.`,
        registeredExpense: confirmedExpense,
        modelUsed: payload.modelUsed,
      });
    } catch (networkErr) {
      const details =
        networkErr instanceof Error ? networkErr.message : String(networkErr);
      onAddMessage({
        id: `net-err-${Date.now()}`,
        role: 'assistant',
        content: `Error de conexión con el servidor del asistente: ${details}`,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input, pendingMedia);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Asistente financiero inteligente"
            className="relative z-10 w-full sm:w-[440px] h-full bg-[#0F1322] shadow-2xl border-l border-white/10 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.07] bg-[#111625] space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#5B3DF5] text-white flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(91,61,245,0.4)]">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-white truncate">
                      Asistente de Presupuesto
                    </h2>
                    <p className="text-xs text-slate-400 tabular-nums truncate">
                      Saldo disponible: {formatCOP(budgetSummary.availableBalance)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.1] flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
                  aria-label="Cerrar asistente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#181E32] border border-white/[0.06] text-xs">
                {isEditingName ? (
                  <form
                    onSubmit={handleSaveName}
                    className="flex items-center gap-2 w-full"
                  >
                    <User className="w-3.5 h-3.5 text-[#8673FF] shrink-0" aria-hidden="true" />
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      autoFocus
                      maxLength={32}
                      placeholder="Tu nombre"
                      aria-label="Tu nombre para el asistente"
                      className="flex-1 text-xs font-medium text-white bg-transparent focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 rounded-md bg-[#5B3DF5] text-white cursor-pointer"
                      aria-label="Guardar nombre"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-slate-300 min-w-0">
                      <User className="w-3.5 h-3.5 text-[#8673FF] shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        Hola, <strong className="text-white">{userName}</strong> · Hoy{' '}
                        {CURRENT_ISO_DATE}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftName(userName);
                        setIsEditingName(true);
                      }}
                      className="inline-flex items-center gap-1 text-[#8673FF] font-semibold hover:underline cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3 h-3" aria-hidden="true" />
                      <span>Cambiar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#0B0E18]">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#5B3DF5] text-white rounded-br-sm shadow-[0_6px_20px_rgba(91,61,245,0.28)]'
                          : msg.isError
                            ? 'bg-rose-950/60 border border-rose-500/30 text-rose-200 rounded-bl-sm'
                            : 'bg-[#141A2C] border border-white/[0.08] text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {msg.isError && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Aviso del asistente</span>
                        </div>
                      )}

                      {msg.media?.kind === 'image' && (
                        <div className="mb-2.5 overflow-hidden rounded-xl border border-white/15 bg-black/25">
                          <img
                            src={msg.media.previewUrl}
                            alt={msg.media.fileName || 'Imagen adjunta'}
                            className="max-h-48 w-full object-cover"
                          />
                        </div>
                      )}

                      {msg.media?.kind === 'audio' && (
                        <div className="mb-2.5 rounded-xl bg-black/25 p-2">
                          <p className="text-[11px] opacity-85 mb-1 truncate">
                            {msg.media.fileName}
                          </p>
                          <audio
                            controls
                            src={msg.media.previewUrl}
                            className="w-full h-8"
                          />
                        </div>
                      )}

                      <p className="whitespace-pre-line">{msg.content}</p>

                      {msg.registeredExpense && (
                        <div className="mt-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-200">
                          <div className="flex items-center gap-2 font-semibold text-emerald-300">
                            <CheckCircle2
                              className="w-4 h-4 text-emerald-400 shrink-0"
                              aria-hidden="true"
                            />
                            <span>Gasto registrado automáticamente</span>
                          </div>
                          <p className="mt-1.5 font-bold text-sm text-white tabular-nums">
                            {formatCOP(msg.registeredExpense.amount)}
                          </p>
                          <p className="mt-0.5 text-emerald-200/90">
                            {msg.registeredExpense.category} ·{' '}
                            {msg.registeredExpense.description} (
                            {msg.registeredExpense.dateLabel})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start">
                  <div
                    role="status"
                    aria-label="El asistente está escribiendo"
                    className="bg-[#141A2C] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-xs text-slate-400"
                  >
                    <span>escribiendo</span>
                    <span className="inline-flex items-center gap-1" aria-hidden="true">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8673FF] animate-bounce [animation-delay:-0.25s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8673FF] animate-bounce [animation-delay:-0.12s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8673FF] animate-bounce" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && !pendingMedia && !isRecording && (
              <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#111625] flex flex-wrap gap-1.5">
                {SUGGESTION_PROMPTS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void sendMessage(suggestion, null)}
                    className="px-3 py-1.5 rounded-full bg-[#5B3DF5]/15 border border-[#5B3DF5]/30 text-xs font-medium text-indigo-200 hover:bg-[#5B3DF5]/25 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Composer area */}
            <div className="p-4 border-t border-white/[0.07] bg-[#111625] space-y-2.5">
              {mediaError && (
                <div className="rounded-xl bg-rose-950/60 border border-rose-500/30 px-3 py-2 text-xs text-rose-200 flex items-center justify-between gap-2">
                  <span>{mediaError}</span>
                  <button
                    type="button"
                    onClick={() => setMediaError(null)}
                    className="p-0.5 rounded hover:bg-rose-500/20 cursor-pointer shrink-0"
                    aria-label="Cerrar error de adjunto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {pendingMedia && (
                <div className="rounded-xl bg-[#181E32] border border-[#5B3DF5]/35 p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pendingMedia.kind === 'image' ? (
                      <img
                        src={pendingMedia.previewUrl}
                        alt={pendingMedia.fileName}
                        className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#5B3DF5] text-white flex items-center justify-center shrink-0">
                        <FileAudio className="w-5 h-5" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {pendingMedia.fileName}
                      </p>
                      <p className="text-[11px] text-indigo-300">
                        {pendingMedia.kind === 'image'
                          ? 'Ticket / imagen listo para analizar'
                          : 'Nota de voz lista para transcribir'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingMedia(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    aria-label="Quitar archivo adjunto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {isRecording ? (
                <div className="rounded-xl bg-rose-950/60 border border-rose-500/30 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-rose-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"
                      aria-hidden="true"
                    />
                    <span>Grabando nota de voz</span>
                    <span className="tabular-nums">
                      {formatRecordingTimer(recordingSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-semibold text-slate-200 hover:bg-white/[0.1] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                      <span>Detener</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleFileSelected(e, 'image')}
                    className="hidden"
                  />
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => void handleFileSelected(e, 'audio')}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181E32] border border-white/[0.06] text-slate-200 hover:bg-white/[0.08] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Subir ticket, recibo o captura de compra"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#8673FF]" aria-hidden="true" />
                    <span>Ticket / Imagen</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => void handleStartRecording()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181E32] border border-white/[0.06] text-slate-200 hover:bg-white/[0.08] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Grabar nota de voz"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#8673FF]" aria-hidden="true" />
                    <span>Grabar voz</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => audioInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181E32] border border-white/[0.06] text-slate-200 hover:bg-white/[0.08] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Cargar archivo de audio"
                  >
                    <FileAudio className="w-3.5 h-3.5 text-[#8673FF]" aria-hidden="true" />
                    <span>Subir audio</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isRecording}
                  placeholder={
                    pendingMedia
                      ? 'Añade un comentario opcional o envía...'
                      : 'Escribe un gasto, sube un ticket o graba voz...'
                  }
                  aria-label="Escribe un gasto o pregunta sobre tu presupuesto"
                  className="flex-1 px-3.5 py-3 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    isRecording ||
                    (input.trim().length === 0 && !pendingMedia)
                  }
                  className="w-11 h-11 rounded-xl bg-[#5B3DF5] text-white flex items-center justify-center hover:bg-[#4B2FE0] transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
                  aria-label="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
