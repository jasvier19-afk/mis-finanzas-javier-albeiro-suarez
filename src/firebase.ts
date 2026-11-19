import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Movement, MovementCategory, MovementType, PaymentMethod } from './data/budgetData';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  baseMonthlyBudget: number;
  hasConfiguredBudget: boolean;
}

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: Error) => void
) {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data();
      onData({
        uid: String(data.uid ?? uid),
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? 'Usuario'),
        baseMonthlyBudget:
          typeof data.baseMonthlyBudget === 'number' ? data.baseMonthlyBudget : 0,
        hasConfiguredBudget: Boolean(data.hasConfiguredBudget),
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveInitialUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  baseMonthlyBudget: number;
}): Promise<void> {
  const path = `users/${params.uid}`;
  const safeBudget = Math.max(0, Math.min(100_000_000, Math.round(params.baseMonthlyBudget)));
  const safeDisplayName = sanitizeString(params.displayName || 'Usuario', 80) || 'Usuario';
  const safeEmail = sanitizeString(params.email || '', 254);

  try {
    await setDoc(doc(db, 'users', params.uid), {
      uid: params.uid,
      email: safeEmail,
      displayName: safeDisplayName,
      baseMonthlyBudget: safeBudget,
      hasConfiguredBudget: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserMonthlyBudget(
  uid: string,
  baseMonthlyBudget: number
): Promise<void> {
  const path = `users/${uid}`;
  const safeBudget = Math.max(0, Math.min(100_000_000, Math.round(baseMonthlyBudget)));

  try {
    await updateDoc(doc(db, 'users', uid), {
      baseMonthlyBudget: safeBudget,
      hasConfiguredBudget: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserDisplayName(
  uid: string,
  displayName: string
): Promise<void> {
  const path = `users/${uid}`;
  const safeDisplayName = sanitizeString(displayName, 80);
  if (!safeDisplayName) return;

  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: safeDisplayName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserMovements(
  uid: string,
  onData: (movements: Movement[]) => void,
  onError: (err: Error) => void
) {
  const path = `users/${uid}/movements`;
  const movementsQuery = query(
    collection(db, 'users', uid, 'movements'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    movementsQuery,
    (snapshot) => {
      const items: Movement[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type: (data.type === 'income' ? 'income' : 'expense') as MovementType,
          day: typeof data.day === 'number' ? data.day : 1,
          dateLabel: String(data.dateLabel ?? ''),
          isoDate: typeof data.isoDate === 'string' ? data.isoDate : undefined,
          category: String(data.category ?? 'Alimentación') as MovementCategory,
          description: String(data.description ?? ''),
          amount: typeof data.amount === 'number' ? data.amount : 0,
          paymentMethod:
            typeof data.paymentMethod === 'string'
              ? (data.paymentMethod as PaymentMethod)
              : undefined,
          notes: typeof data.notes === 'string' ? data.notes : undefined,
          createdAtOrder:
            typeof data.createdAtOrder === 'number' ? data.createdAtOrder : 0,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createUserMovement(params: {
  uid: string;
  id: string;
  type: MovementType;
  day: number;
  dateLabel: string;
  isoDate: string;
  category: MovementCategory;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAtOrder: number;
}): Promise<void> {
  const safeId = params.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `users/${params.uid}/movements/${safeId}`;

  const safeAmount = Math.max(1, Math.min(100_000_000, Math.round(params.amount)));
  const safeDay = Math.max(1, Math.min(31, Math.round(params.day)));
  const safeIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(params.isoDate)
    ? params.isoDate
    : '2026-11-18';
  const safeDateLabel = sanitizeString(params.dateLabel || safeIsoDate, 32) || safeIsoDate;
  const safeCategory = sanitizeString(params.category, 60) || 'Alimentación';
  const safeDescription = sanitizeString(params.description || safeCategory, 120) || safeCategory;
  const safeOrder = Math.max(0, Math.round(params.createdAtOrder));

  const payload: Record<string, unknown> = {
    ownerId: params.uid,
    type: params.type,
    day: safeDay,
    dateLabel: safeDateLabel,
    isoDate: safeIsoDate,
    category: safeCategory,
    description: safeDescription,
    amount: safeAmount,
    createdAtOrder: safeOrder,
    createdAt: serverTimestamp(),
  };

  if (params.paymentMethod) {
    const safePayment = sanitizeString(params.paymentMethod, 40);
    if (safePayment) {
      payload.paymentMethod = safePayment;
    }
  }

  if (params.notes) {
    const safeNotes = sanitizeString(params.notes, 500);
    if (safeNotes) {
      payload.notes = safeNotes;
    }
  }

  try {
    await setDoc(doc(db, 'users', params.uid, 'movements', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
