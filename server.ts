import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import type { Content, FunctionDeclaration, Part } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;

// Lista priorizada de modelos activos para lógica en cascada (fallback)
const MODEL_CASCADE = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Servicios públicos',
  'Ropa y compras personales',
  'Entretenimiento y ocio',
];

interface ClientMediaAttachment {
  kind: 'image' | 'audio';
  mimeType: string;
  base64Data: string;
  fileName?: string;
}

interface ClientChatMessage {
  role: 'user' | 'assistant';
  content: string;
  media?: ClientMediaAttachment;
}

interface BudgetContextPayload {
  userName?: string;
  monthlyBudget: number;
  totalIncome: number;
  totalSpent: number;
  availableBalance: number;
  spentPercentage: number;
  isPositiveBalance: boolean;
  currentDate: string;
  recentMovementsSummary?: string;
}

interface ExtractedFunctionCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

const registerExpenseDeclaration: FunctionDeclaration = {
  name: 'registerExpense',
  description:
    'Registra un gasto personal en pesos colombianos (COP) dentro del presupuesto del mes actual cuando el usuario indica que realizó o pagó un gasto y los datos han sido confirmados.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      amount: {
        type: Type.NUMBER,
        description:
          'Monto numérico positivo del gasto en pesos colombianos (COP), sin puntos ni símbolos. Ejemplo: 500, 25000, 120000.',
      },
      date: {
        type: Type.STRING,
        description:
          'Fecha del gasto en formato estricto YYYY-MM-DD. Si el usuario dice "hoy", usa la fecha actual del contexto.',
      },
      description: {
        type: Type.STRING,
        description:
          'Descripción breve y clara del gasto realizado. Ejemplo: "Comida", "Almuerzo", "Pasaje de bus".',
      },
      category: {
        type: Type.STRING,
        description: `Categoría del gasto. Debe ser exactamente una de: ${EXPENSE_CATEGORIES.join(', ')}.`,
      },
    },
    required: ['amount', 'date', 'description', 'category'],
  },
};

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractStatusCode(error: unknown): number {
  if (!error || typeof error !== 'object') return 500;

  const errObj = error as Record<string, unknown>;
  const directStatus =
    typeof errObj.status === 'number'
      ? errObj.status
      : typeof errObj.statusCode === 'number'
        ? errObj.statusCode
        : typeof errObj.code === 'number'
          ? errObj.code
          : null;

  if (directStatus && directStatus >= 400 && directStatus < 600) {
    return directStatus;
  }

  const message =
    typeof errObj.message === 'string' ? errObj.message : String(error);

  if (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota')
  ) {
    return 429;
  }
  if (
    message.includes('503') ||
    message.includes('UNAVAILABLE') ||
    message.toLowerCase().includes('overloaded') ||
    message.toLowerCase().includes('high demand')
  ) {
    return 503;
  }
  if (
    message.includes('404') ||
    message.includes('NOT_FOUND') ||
    message.toLowerCase().includes('not found')
  ) {
    return 404;
  }
  if (
    message.includes('403') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('API_KEY_INVALID')
  ) {
    return 403;
  }
  if (message.includes('400') || message.includes('INVALID_ARGUMENT')) {
    return 400;
  }

  return 500;
}

function extractErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido en el servidor.';
  if (error instanceof Error) return error.message;
  return String(error);
}

function isCascadeRetryableStatus(status: number): boolean {
  return status === 429 || status === 503 || status === 404;
}

function buildSystemInstruction(context: BudgetContextPayload): string {
  const userName = context.userName?.trim() || 'Usuario';

  return [
    'Eres un asistente amable, breve y experto en finanzas personales integrado en la aplicación "Mi Presupuesto Mensual" (Colombia, pesos colombianos COP).',
    'Contexto financiero actual del usuario:',
    `- Nombre del usuario: ${userName}`,
    `- Fecha actual: ${context.currentDate}`,
    `- Presupuesto disponible total del mes: $${Math.round(context.monthlyBudget).toLocaleString('es-CO')} COP`,
    `- Total de ingresos adicionales registrados: $${Math.round(context.totalIncome).toLocaleString('es-CO')} COP`,
    `- Total gastado hasta ahora: $${Math.round(context.totalSpent).toLocaleString('es-CO')} COP`,
    `- Saldo disponible actual: $${Math.round(context.availableBalance).toLocaleString('es-CO')} COP (${context.isPositiveBalance ? 'Balance positivo' : 'Balance negativo'})`,
    `- Porcentaje ejecutado del presupuesto: ${context.spentPercentage.toFixed(1)}%`,
    context.recentMovementsSummary
      ? `- Últimos movimientos registrados:\n${context.recentMovementsSummary}`
      : '- Aún no hay gastos registrados este mes.',
    '',
    'Reglas de comportamiento:',
    '1. Sé breve, amable, directo y claro (máximo 2-3 oraciones).',
    '2. Cuando el usuario mencione un gasto en lenguaje natural (ej. "Gasté 500 en comida hoy", "Pagué 35.000 de taxi", "Compré camiseta por 80 mil"), extrae los datos y ejecuta la herramienta registerExpense.',
    `3. Para el parámetro category de registerExpense, elige SIEMPRE una de estas 5 categorías exactas: ${EXPENSE_CATEGORIES.join(', ')}.`,
    `4. Para el parámetro date, usa el formato YYYY-MM-DD; si dice "hoy", usa ${context.currentDate}.`,
    `5. Cuando llames a registerExpense para finalizar un registro, dirígete siempre al usuario por su nombre (${userName}) confirmando los datos guardados (por ejemplo: "¡Listo, ${userName}! He guardado tu gasto de..."), incluyendo el monto, la categoría, la descripción y la fecha.`,
    '6. Si falta información esencial (por ejemplo, el usuario no indicó el monto del gasto), pide amablemente el dato faltante antes de llamar a registerExpense.',
    '7. Si el usuario pregunta por su presupuesto, saldo o hace consultas sobre si puede realizar una compra, compara el gasto solicitado con el saldo disponible actual en el contexto y respóndele con exactitud.',
    '',
    'Reglas para Imágenes (tickets, recibos, capturas de compra o apuntes de gasto):',
    '- Al recibir una imagen relacionada con un gasto, extrae únicamente lo que sea claramente visible: monto, fecha y descripción (y asigna una de las 5 categorías válidas).',
    '- Si la imagen está borrosa, incompleta o alguno de estos datos (monto, fecha o descripción) no se ve o está dudoso, PREGUNTA al usuario antes de guardar y NO llames a registerExpense ni inventes información.',
    '- Si la imagen NO tiene nada que ver con gastos, recibos, compras o finanzas personales de Mi Presupuesto, indica amablemente que no puedes procesarla ni registrarla.',
    '',
    'Reglas para Audio (notas de voz):',
    '- Al recibir una nota de voz, transcríbela internamente y extrae monto, fecha y descripción del gasto (y asigna una de las 5 categorías válidas).',
    '- Si en la nota de voz falta algún dato obligatorio o no se entiende con claridad, solicita aclaración al usuario antes de guardar y NO inventes datos.',
    '- Si el audio NO tiene nada que ver con gastos o finanzas personales de Mi Presupuesto, indica amablemente que no puedes registrarlo.',
  ].join('\n');
}

function extractPartsFromCandidate(parts: Part[] | undefined): {
  text: string;
  functionCalls: ExtractedFunctionCall[];
} {
  const textSegments: string[] = [];
  const functionCalls: ExtractedFunctionCall[] = [];

  if (!Array.isArray(parts)) {
    return { text: '', functionCalls };
  }

  for (const part of parts) {
    if (typeof part.text === 'string' && !part.thought && part.text.trim()) {
      textSegments.push(part.text.trim());
    }
    if (part.functionCall && typeof part.functionCall.name === 'string') {
      functionCalls.push({
        id: part.functionCall.id,
        name: part.functionCall.name,
        args: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return {
    text: textSegments.join('\n').trim(),
    functionCalls,
  };
}

function buildGeminiContents(incomingMessages: ClientChatMessage[]): Content[] {
  return incomingMessages.map((msg) => {
    const parts: Part[] = [];

    if (msg.media && msg.media.base64Data && msg.media.mimeType) {
      parts.push({
        inlineData: {
          mimeType: msg.media.mimeType,
          data: msg.media.base64Data,
        },
      });
    }

    const trimmedText = msg.content?.trim();
    if (trimmedText) {
      parts.push({ text: trimmedText });
    } else if (msg.media?.kind === 'image') {
      parts.push({
        text: 'Analiza esta imagen de gasto o recibo. Extrae monto, fecha y descripción. Si falta algún dato o está borroso, pregúntame antes de registrar.',
      });
    } else if (msg.media?.kind === 'audio') {
      parts.push({
        text: 'Transcribe esta nota de voz y extrae monto, fecha y descripción del gasto. Si falta algún dato, pídeme aclaración antes de registrar.',
      });
    }

    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/assistant', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Falta configurar GEMINI_API_KEY en el servidor.',
          code: 500,
          details: 'GEMINI_API_KEY environment variable is missing.',
        });
      }

      const body = req.body as {
        messages?: ClientChatMessage[];
        budgetContext?: BudgetContextPayload;
      };

      const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
      if (incomingMessages.length === 0) {
        return res.status(400).json({
          error: 'La solicitud no incluye mensajes.',
          code: 400,
          details: 'messages array is required and cannot be empty.',
        });
      }

      const budgetContext: BudgetContextPayload = body.budgetContext ?? {
        userName: 'Usuario',
        monthlyBudget: 2_500_000,
        totalIncome: 0,
        totalSpent: 0,
        availableBalance: 2_500_000,
        spentPercentage: 0,
        isPositiveBalance: true,
        currentDate: '2026-11-18',
      };

      const contents = buildGeminiContents(incomingMessages);
      const ai = getGeminiClient();
      const systemInstruction = buildSystemInstruction(budgetContext);
      const attemptedModels: string[] = [];
      let lastStatus = 500;
      let lastErrorDetails = 'No se pudo obtener respuesta de los modelos.';

      for (const modelName of MODEL_CASCADE) {
        attemptedModels.push(modelName);
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: [registerExpenseDeclaration] }],
            },
          });

          const candidateParts = response.candidates?.[0]?.content?.parts;
          const extracted = extractPartsFromCandidate(candidateParts);

          if (
            extracted.functionCalls.length === 0 &&
            Array.isArray(response.functionCalls) &&
            response.functionCalls.length > 0
          ) {
            for (const fc of response.functionCalls) {
              if (fc.name) {
                extracted.functionCalls.push({
                  id: fc.id,
                  name: fc.name,
                  args: (fc.args ?? {}) as Record<string, unknown>,
                });
              }
            }
          }

          let replyText = extracted.text;
          if (!replyText && extracted.functionCalls.length > 0) {
            const firstCall = extracted.functionCalls[0];
            const amt = Number(firstCall.args.amount) || 0;
            const desc = String(firstCall.args.description ?? 'Gasto');
            const cat = String(firstCall.args.category ?? 'Alimentación');
            const userName = budgetContext.userName?.trim() || 'Usuario';
            replyText = `¡Listo, ${userName}! He guardado tu gasto de $${amt.toLocaleString('es-CO')} COP en ${cat} (${desc}).`;
          }

          return res.json({
            reply:
              replyText ||
              'Recibí tu mensaje, ¿podrías darme un poco más de detalle para ayudarte?',
            functionCalls: extracted.functionCalls,
            modelUsed: modelName,
            attemptedModels,
          });
        } catch (err) {
          const status = extractStatusCode(err);
          const details = extractErrorMessage(err);
          lastStatus = status;
          lastErrorDetails = details;

          console.warn(
            `[Assistant] Modelo ${modelName} falló con código ${status}: ${details}`
          );

          if (isCascadeRetryableStatus(status)) {
            continue;
          }

          return res.status(status).json({
            error: `Error al consultar el asistente (${status}).`,
            code: status,
            details,
            attemptedModels,
          });
        }
      }

      return res.status(lastStatus).json({
        error: `Todos los modelos en cascada fallaron (último estado ${lastStatus}).`,
        code: lastStatus,
        details: lastErrorDetails,
        attemptedModels,
      });
    } catch (unexpectedErr) {
      const status = extractStatusCode(unexpectedErr);
      const details = extractErrorMessage(unexpectedErr);
      return res.status(status).json({
        error: 'Error interno en el servidor del asistente.',
        code: status,
        details,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mi Presupuesto Mensual ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
