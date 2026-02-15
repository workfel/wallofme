# Payload Encryption (AES-256-GCM)

This project includes optional payload encryption that obfuscates JSON data in HTTP requests and responses. When enabled, the Chrome DevTools → Network tab shows encrypted payloads (`{ "_enc": "..." }`) instead of plaintext JSON.

> **⚠️ This is NOT real security.** The encryption key is embedded in the frontend JavaScript bundle. A determined attacker can extract it. This is a **deterrent for casual snooping**, not a cryptographic security measure. Always rely on HTTPS (TLS) for actual transport security.

## How it works

```
Frontend → encrypt(JSON body) → { "_enc": "base64(IV + ciphertext)" } → Backend
Backend → decrypt → process → encrypt(JSON response) → { "_enc": "base64(IV + ciphertext)" } → Frontend
```

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **IV**: 12 random bytes prepended to each ciphertext
- **Encoding**: base64
- **Header**: Encrypted responses include `X-Encrypted: 1`
- **Library**: Web Crypto API (zero dependencies — native in Bun and browsers)

## Configuration

### Backend (`.env`)

```bash
# Set to "true" to enable encryption
ENCRYPT_PAYLOADS=false

# 256-bit key as hex (64 characters). Must match the frontend key.
ENCRYPTION_KEY=
```

### Frontend (`environments/environment.ts` / `environment.prod.ts`)

```typescript
export const environment = {
  // ...
  encryptPayloads: false, // true in production
  encryptionKey: "", // same 64-char hex as backend
};
```

## Generating a key

```bash
cd apps/backend
bun -e "import { generateKey } from './src/lib/crypto'; console.log(generateKey())"
```

Copy the output (64-character hex string) into both:

1. Backend: `ENCRYPTION_KEY` in `.env`
2. Frontend: `encryptionKey` in `environment.prod.ts`

## Excluded routes

These paths are **never** encrypted, even when `ENCRYPT_PAYLOADS=true`:

| Path              | Reason                                                           |
| ----------------- | ---------------------------------------------------------------- |
| `/api/auth/*`     | BetterAuth manages its own request/response flow                 |
| `/api/webhooks/*` | Called by external services (RevenueCat) that don't have the key |

## File structure

```
apps/backend/src/
├── lib/crypto.ts              ← encrypt(), decrypt(), generateKey()
├── middleware/encryption.ts   ← Hono middleware (request decrypt + response encrypt)
└── index.ts                   ← Middleware registered after CORS, before auth

apps/frontend-ionic/src/
├── app/core/services/
│   ├── crypto.service.ts      ← Angular service wrapping Web Crypto API
│   └── api.service.ts         ← authFetch() encrypts/decrypts transparently
└── environments/
    ├── environment.ts         ← encryptPayloads: false (dev)
    └── environment.prod.ts    ← encryptPayloads: true (prod)
```

## Testing

1. **Dev mode** (`ENCRYPT_PAYLOADS=false`): Everything works as before — plaintext JSON
2. **Encrypted mode**: Set `ENCRYPT_PAYLOADS=true` + `ENCRYPTION_KEY` on both sides, restart. All API responses in Network tab should show `{ "_enc": "..." }`
3. **Webhooks**: Should always return plaintext regardless of encryption setting
