# Architecture SchoolBridge

## Vue d'ensemble

Application Next.js monolithique (App Router). La route `/api/chat` retourne un `ReadableStream` en Server-Sent Events. Le frontend parse le flux SSE manuellement.

```
Browser
  │
  ├── GET /             → Page d'accueil (3 chemins)
  ├── GET /select       → Sélection profil (expandable → Chat | Dashboard)
  ├── GET /register     → Formulaire d'inscription
  ├── GET /chat         → Interface de chat (SSE, TTS, STT, upload, sessions)
  └── GET /dashboard    → Dashboard parent (enfants, agenda, contacts, profil)
       │
       ├── POST /api/chat                      → ReadableStream (SSE)
       ├── POST /api/upload                    → ReadableStream (SSE, multipart)
       ├── GET  /api/parents                   → Liste parents
       ├── GET  /api/parents/[id]              → Profil parent + enfants
       ├── POST /api/register                  → Inscription
       ├── GET|POST|PATCH /api/agenda/[parentId]
       ├── GET|POST       /api/contacts/[parentId]
       ├── GET|POST       /api/community       → Posts communautaires
       ├── POST           /api/community/translate → Traduction Gemini
       └── GET            /api/community/urgent   → Posts urgents (épinglés + 7j)
            │
            ├── lib/store.ts       ─── parents + enfants + agenda + contacts + posts communauté (mémoire)
            ├── lib/data.ts        ─── accès données via store + fichiers JSON/Markdown
            ├── lib/prompts.ts     ─── prompts contextuels (11 règles)
            └── lib/gemini.ts      ─── Gemini 2.5 Flash (chat + chatWithImage)
```

## Flux SSE complet (chat)

```
Client                          Server (ReadableStream)
  │                                    │
  │── POST /api/chat ────────────────► │
  │                                    │── event: status {type:"thinking"}
  │◄── event: status {thinking} ───────│
  │                                    │── 1er appel Gemini (JSON complet)
  │                                    │   ↓ si need_files :
  │                                    │── event: status {type:"searching", message:"..."}
  │◄── event: status {searching} ──────│
  │                                    │── charge fichiers + 2ème appel Gemini
  │                                    │   ↓ réponse obtenue :
  │                                    │── event: token {content:"mot "} × N
  │◄── event: token (×N) ─────────────│   (délai 7–16ms entre chaque token)
  │                                    │── event: done {sources, full_response}
  │◄── event: done ────────────────────│
  │                                    │── [si agenda_items] event: agenda {items:[...]}
  │◄── event: agenda ──────────────────│
```

## Délai adaptatif des tokens

| Longueur de la réponse | Délai par token | Durée totale approx. |
|---|---|---|
| < 100 mots | 16ms | ~1.5s |
| 100–250 mots | 11ms | ~2s |
| > 250 mots | 7ms | ~2.5s |

## Parser SSE client (manuel)

```typescript
// Accumulation dans un buffer, split par "\n\n"
buffer += decoder.decode(value, { stream: true });
const parts = buffer.split("\n\n");
buffer = parts.pop() ?? "";

for (const part of parts) {
  // Extraction event: et data:
  // Dispatch selon eventType: status | token | done | agenda
}
```

## États du message assistant

| status | Visuel |
|---|---|
| `"thinking"` | 3 points animés (`animate-bounce`, décalés 0/150/300ms) |
| `"searching"` | Fond ambre, icône 🔍, texte italique |
| `"streaming"` | Texte partiel + curseur `▌` clignotant (`animate-pulse`) |
| `"error"` | Fond rouge pâle, icône ⚠️ |
| `undefined` | Réponse finale + badges sources 📚 |

## Persistance des données

| Donnée | Stockage | Durée de vie |
|---|---|---|
| Parents + enfants | `lib/store.ts` (mémoire) | Jusqu'au redémarrage |
| Agenda | `lib/store.ts` (mémoire) | Jusqu'au redémarrage |
| Contacts | `lib/store.ts` (mémoire) | Jusqu'au redémarrage |
| Messages du chat | `localStorage` (navigateur) | Permanent (par profil) |

## Système d'agenda

```
prefillAgenda(parentId)
  ├── Vacances BW 2025/2026 (hardcodées dans store.ts)
  └── Calendrier école FSG (JSON dans schoolbridge-data/schools/)
       └── Filtre sur les enfants du parent dans l'école FSG
```

L'agenda est auto-rempli au premier appel GET si vide pour ce `parentId`.

## Structure des fichiers

```
├── app/
│   ├── layout.tsx
│   ├── globals.css                 # Tailwind v4
│   ├── page.tsx                    # / — 3 cartes
│   ├── select/page.tsx             # /select — expandable cards
│   ├── register/page.tsx           # /register
│   ├── chat/
│   │   ├── page.tsx                # Suspense wrapper
│   │   └── ChatPageContent.tsx     # Lit query params + header
│   ├── dashboard/
│   │   ├── page.tsx                # Suspense wrapper
│   │   └── DashboardContent.tsx    # Dashboard complet
│   └── api/
│       ├── chat/route.ts           # SSE ReadableStream
│       ├── upload/route.ts         # SSE multipart (Gemini Vision)
│       ├── parents/route.ts
│       ├── parents/[id]/route.ts
│       ├── register/route.ts
│       ├── agenda/[parentId]/route.ts
│       └── contacts/[parentId]/route.ts
├── lib/
│   ├── store.ts                    # Store mémoire singleton (parents, enfants, agenda, contacts)
│   ├── data.ts                     # Types TS + loaders
│   ├── gemini.ts                   # Client Gemini (chat + chatWithImage)
│   └── prompts.ts                  # buildContextPrompt / buildAnonymousPrompt / SCHOOLBRIDGE_SYSTEM_PROMPT
└── components/
    └── ChatInterface.tsx           # "use client" — SSE reader + TTS + STT + upload + sessions
```

## Contraintes actuelles (MVP)

- Appels Gemini NON streamés nativement (JSON complet → parse → stream simulé mot par mot)
- Pas de librairie SSE externe — parser manuel ~20 lignes
- Store en mémoire — données perdues au redémarrage (sauf messages chat dans localStorage)
- STT : Chrome/Edge uniquement (API non standard, absente dans Firefox)
