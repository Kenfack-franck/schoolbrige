# ElternGuide

Mentor IA multilingue pour aider les parents (notamment immigrés) à comprendre et naviguer le système scolaire allemand.

Développé dans le cadre de l'**IPAI Hackathon 2026** (13-15 mars, Heilbronn) — challenge "AI-Powered Parent Mentoring".

---

## Lancement rapide

```bash
# 1. Vérifier que la clé Gemini est dans .env.local
cat .env.local
# GEMINI_API_KEY=votre_cle_ici

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement
npm run dev

# 4. Ouvrir dans le navigateur
# http://localhost:3000
```

---

## Chemins d'utilisation

1. **Je suis déjà inscrit** → `/select` → choisir un parent → 💬 Chat ou 📊 Dashboard
2. **Je m'inscris** → `/register` → formulaire → chat personnalisé
3. **Je veux juste discuter** → `/chat` → chat anonyme sans profil

## Fonctionnalités V5

- **Dashboard parent** — enfants (moyenne, matières), agenda (timeline), contacts, profil
- **Agenda intelligent** — pré-rempli avec vacances BW + calendrier d'école, mis à jour par le chat IA
- **Contacts simulés** — mise en relation avec enseignants / médiateurs de la plateforme
- **Sessions persistantes** — `localStorage` par profil, bouton 🗑️ pour effacer
- **Voice input (STT)** — bouton 🎙️, langue automatique, résultats intermédiaires

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) + TypeScript |
| Styles | Tailwind CSS v4 |
| LLM | Google Gemini 2.5 Flash |
| Données | Fichiers JSON + Markdown (schoolbridge-data/) + store en mémoire |
| Déploiement | Vercel |

---

## Structure du projet

```
├── app/
│   ├── page.tsx                    # Écran d'accueil (3 chemins)
│   ├── select/page.tsx             # Sélection profil (avec dashboard)
│   ├── register/page.tsx           # Formulaire d'inscription
│   ├── chat/                       # Interface de chat
│   ├── dashboard/                  # Dashboard parent
│   └── api/                        # Routes API
│       ├── chat/                   # POST /api/chat (SSE)
│       ├── upload/                 # POST /api/upload (multipart SSE)
│       ├── parents/                # GET /api/parents[/id]
│       ├── register/               # POST /api/register
│       ├── agenda/[parentId]/      # GET|POST|PATCH /api/agenda/[id]
│       └── contacts/[parentId]/    # GET|POST /api/contacts/[id]
├── lib/
│   ├── store.ts                    # Store en mémoire (parents, enfants, agenda, contacts)
│   ├── data.ts                     # Chargement des données
│   ├── gemini.ts                   # Client Gemini (chat + chatWithImage)
│   └── prompts.ts                  # System prompts
├── components/
│   └── ChatInterface.tsx           # Composant de chat (SSE, TTS, STT, upload, sessions)
└── schoolbridge-data/              # Données simulées (ne pas modifier)
```

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Clé API Google Gemini (obligatoire) |

---

## Commandes

```bash
npm run dev      # Développement (http://localhost:3000)
npm run build    # Build de production
npm run start    # Lancer la version de production
npm run lint     # Linting ESLint
```
# schoolbrige
