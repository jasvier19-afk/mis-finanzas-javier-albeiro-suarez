# Especificación de Seguridad Firestore

## 1. Invariantes de Datos
- Cada documento `/users/{userId}` pertenece exclusivamente al usuario autenticado con `request.auth.uid == userId` y almacena `uid == request.auth.uid`, correo, nombre, `baseMonthlyBudget` (`0 <= n <= 100000000`) y `hasConfiguredBudget`.
- Ningún usuario puede listar la colección `/users` ni leer el perfil (PII) de otro usuario.
- Cada documento `/users/{userId}/movements/{movementId}` requiere que exista el documento padre `/users/{userId}` con `uid == request.auth.uid` (Master Gate), debe tener `ownerId == request.auth.uid`, `amount > 0` y `<= 100000000`, `type in ['expense', 'income']`, y respetar los límites de longitud definidos en `firebase-blueprint.json`.
- Los campos `uid`, `ownerId` y `createdAt` son inmutables tras la creación, y `createdAt` / `updatedAt` deben coincidir estrictamente con `request.time`.

## 2. Payloads de Prueba ("Dirty Dozen")
1. **Identity Spoofing en Perfil**: `{ "uid": "otro-uid", ... }` -> `PERMISSION_DENIED`.
2. **Ghost Field en Perfil**: `{ ..., "isAdmin": true }` -> `PERMISSION_DENIED` (`hasOnly`).
3. **Lectura PII de Tercero**: `get(/users/otro-uid)` autenticado como `userA` -> `PERMISSION_DENIED`.
4. **List Scraping en `/users`**: `list(/users)` -> `PERMISSION_DENIED`.
5. **Presupuesto Negativo**: `{ ..., "baseMonthlyBudget": -5000 }` -> `PERMISSION_DENIED`.
6. **Timestamp Falsificado en Perfil**: `{ ..., "createdAt": "2020-01-01T00:00:00Z" }` -> `PERMISSION_DENIED`.
7. **Movimiento Huérfano (sin perfil padre)**: `create(/users/userA/movements/m1)` sin `/users/userA` -> `PERMISSION_DENIED`.
8. **Identity Spoofing en Movimiento**: `{ "ownerId": "otro-uid", ... }` -> `PERMISSION_DENIED`.
9. **ID Poisoning en Path**: `create(/users/userA/movements/id_invalido$$$)` -> `PERMISSION_DENIED` (`isValidId`).
10. **Tipo Inválido / Monto Negativo**: `{ ..., "type": "hack", "amount": -100 }` -> `PERMISSION_DENIED`.
11. **String Sobredimensionado (DoW)**: `{ ..., "description": "a" * 500 }` -> `PERMISSION_DENIED`.
12. **List no filtrado de movimientos ajenos**: `list(/users/otro-uid/movements)` -> `PERMISSION_DENIED`.
