# Changelog

## [v5.1.0] — 2026-03-14

### Correctif — Sources naturelles + Boutons de contact dans le chat

- **`lib/prompts.ts`** — renforcement des règles
  - Règle 5 SOURCES : ajout d'un "RAPPEL CRITIQUE" interdisant explicitement les codes internes (NAT-01, BW-02, PR-005) dans le champ `response`
  - Règle 9 CONTACTS (nouvelle) : l'agent donne toujours les infos pratiques d'un contact recommandé (rôle, horaires, plateforme ou coordonnées externes) et ajoute un champ `recommended_contacts: ["PR-XXX"]` dans le JSON
  - Règle 10 ENFANTS MULTIPLES (renumérotée depuis 9)
  - Format JSON mis à jour : `{"status":"complete","response":"...","sources":[...],"agenda_items":[...],"recommended_contacts":["PR-XXX"]}`

- **`lib/data.ts`** — type `PersonneRessource` étendu
  - `contact_externe?: { adresse?, telephone?, email? } | null`
  - `ecole_rattachee?: string | null`

- **`app/api/chat/route.ts`** — événement SSE `contacts`
  - `recommended_contacts?: string[]` ajouté à `GeminiComplete`
  - Après `event: done` (et `event: agenda`) → `event: contacts { contacts: PersonneRessource[] }` si contacts recommandés

- **`components/ContactModal.tsx`** (nouveau) — modal réutilisable
  - Props : `personneId`, `nom`, `role`, `disponibilite?`, `description?`, `parentId`, `onClose`, `onSuccess`
  - POST `/api/contacts/[parentId]` pour créer le contact puis envoyer le message
  - Confirmation visuelle → fermeture après 1,8s

- **`components/ChatInterface.tsx`** — cartes de contact dans le chat
  - État `pendingContacts` + `contactModalOpen`
  - Réception de `event: contacts` → affichage de cartes sous la réponse
  - Contact sur plateforme : bouton "Envoyer un message" → `ContactModal`
  - Contact externe : téléphone (`tel:`), email (`mailto:`), adresse en texte
  - Reset `pendingContacts` dans `handleClear`, `runStream`, `runUploadStream`

- **`app/dashboard/DashboardContent.tsx`** — migration vers `ContactModal` partagé
  - Modal inline remplacé par `<ContactModal>` importé depuis `@/components/ContactModal`

## [v5.0.0] — 2026-03-14

### Ajouté — Dashboard + Agenda + Contacts + Sessions + Voice (STT)

- **`lib/store.ts`** — nouvelles structures et méthodes
  - Interfaces `AgendaItem` et `ContactItem`
  - `_agendas: Map<string, AgendaItem[]>` et `_contacts: Map<string, ContactItem[]>`
  - Méthodes : `getAgenda`, `setAgenda`, `addAgendaItems`, `markAgendaItemDone`, `getContacts`, `addContact`, `addContactMessage`
  - `prefillAgenda(parentId)` : pré-remplit avec les vacances BW (hardcodées) et le calendrier JSON de l'école FSG

- **`lib/prompts.ts`** — règle 8 AGENDA (nouvelle)
  - Quand Gemini mentionne une date/échéance → champ `agenda_items` dans le JSON de réponse
  - Format : `[{titre, date:YYYY-MM-DD, heure|null, type, enfant_concerne|null, description}]`

- **`app/api/chat/route.ts`** — support agenda SSE
  - Parse `agenda_items` dans la réponse Gemini
  - Appelle `addAgendaItems()` si `parentId` présent
  - Envoie `event: agenda {items: [...]}` après `event: done`

- **`app/api/agenda/[parentId]/route.ts`** (nouveau)
  - `GET` : retourne `{evenements, prochains (14j), en_retard}`, auto-prefill si vide
  - `POST` : ajoute des items `{items: AgendaItem[]}`
  - `PATCH` : bascule le champ `fait` `{itemId, fait}`

- **`app/api/contacts/[parentId]/route.ts`** (nouveau)
  - `GET` : retourne la liste des contacts
  - `POST` option 1 : ajoute un contact `{personneRessourceId, nom, role, contexte}`
  - `POST` option 2 : ajoute un message `{contactId, message}`

- **`app/dashboard/page.tsx`** (nouveau) — wrapper Suspense

- **`app/dashboard/DashboardContent.tsx`** (nouveau, `"use client"`)
  - Sections : Mes Enfants (avec indicateur couleur de moyenne), Agenda (timeline verticale, toggle Fait), Contacts (recommandés filtrés par langue), Mon Profil
  - Modal de contact avec textarea → POST contacts API
  - Header avec liens "💬 Chat" et "← Accueil"

- **`app/select/page.tsx`** — refonte des cartes
  - Clic sur une carte → expansion avec 2 boutons : "💬 Discuter" et "📊 Dashboard"
  - Affichage des prénoms des enfants dans le sous-titre

- **`app/chat/ChatPageContent.tsx`** — bouton Dashboard
  - Bouton "📊 Dashboard" dans le header (visible uniquement si identifié)

- **`components/ChatInterface.tsx`** — sessions + STT + agenda
  - Persistance `localStorage` par clé `schoolbridge_chat_${parentId ?? "anonymous"}`
  - Restauration au montage (messages sans `isWelcome`)
  - Bouton 🗑️ pour effacer la session
  - STT via `SpeechRecognition` / `webkitSpeechRecognition` natif (bouton 🎙️)
    - Résultats intermédiaires (`interimResults: true`) affichés dans l'input
    - Langue déduite de `parentLangRef` (via `LANG_MAP`)
    - `hasSTT` initialisé après montage (évite le mismatch SSR)
  - Réception de `event: agenda` → state `pendingAgendaItems` → bandeau de confirmation
  - Layout formulaire : `[🔊/🔇] [🎙️] [📎] [input] [🗑️] [Envoyer]`

## [v4.1.0] — 2026-03-14

### Correctif — Searching vocal + Réponses concises + Sources naturelles

- **`lib/prompts.ts`** — 3 modifications du SYSTEM_PROMPT :
  - Règle 3 : `CONCISION` remplace `ACTIONS` — réponse adaptée à la question, actions uniquement si pertinentes
  - Règle 5 : `SOURCES` — intégration naturelle dans le texte, codes internes (NAT-01, BW-02) interdits dans `response`
  - Règle 7 : `LONGUEUR` (nouvelle) — 3-8 phrases max pour question simple, 15-20 max pour procédure complexe
  - Règle 8 : `ENFANTS MULTIPLES` (renumérotée depuis 7)

- **`components/ChatInterface.tsx`** — TTS du message "searching"
  - Quand `event: status {type:"searching"}` arrive et `autoSpeak = true` → `speakText(message, parentLang)` déclenché
  - Quand le premier token arrive → `stopSpeech()` appelé avant d'accumuler le contenu (la réponse finale sera lue au `done`)

## [v4.0.0] — 2026-03-14

### Ajouté — Markdown + Upload documents + Lecture vocale

- **`npm install react-markdown`** — rendu Markdown dans les bulles assistant

- **`components/ChatInterface.tsx`** — refonte majeure
  - `ReactMarkdown` + composants custom (`MD_COMPONENTS`) : h1-h3, p, ul, ol, li, strong, em, hr, table, th, td — styles Tailwind cohérents avec la bulle de chat
  - Rendu progressif pendant le streaming (ReactMarkdown reçoit le texte au fur et à mesure)
  - Message de bienvenue anonyme aussi rendu en Markdown
  - Bouton 📎 (upload) : ouvre le sélecteur de fichiers, formats acceptés `.jpg .jpeg .png .pdf .webp`, max 10 MB
  - Prévisualisation du fichier au-dessus du formulaire (miniature image ou icône 📄 pour PDF)
  - Bulle utilisateur : affiche miniature image (max 200px) ou icône PDF + nom du fichier + texte optionnel
  - `runUploadStream()` : poste en `multipart/form-data` à `/api/upload`, lit le SSE identique à `runStream()`
  - TTS via **Web Speech API** native (pas de lib externe) :
    - `speakText(text, lang)` : nettoie le Markdown (`stripMarkdown`), découpe en chunks ≤2000 chars (`splitForTTS`), lit séquentiellement via `onend`
    - `stopSpeech()` : `speechSynthesis.cancel()`
    - Lecture automatique au `done` event si `autoSpeak = true`
    - Boutons 🔊 / ⏹ sur chaque bulle complète (visible uniquement si `hasTTS`)
    - Bouton global 🔊/🔇 dans la zone de formulaire pour activer/désactiver la lecture automatique
    - `LANG_MAP` : mapping langue maternelle → code BCP-47 (16 langues)
    - `parentLang` chargé depuis `/api/parents/[id]` au montage (même requête que le welcome)
    - `hasTTS` initialisé dans `useEffect` (évite le mismatch SSR)
    - Refs `autoSpeakRef` / `parentLangRef` pour accès dans les closures stables
    - Le message de bienvenue N'est PAS lu automatiquement (`isWelcome: true` exclu)
    - Envoi d'un nouveau message → `stopSpeech()` appelé avant toute chose

- **`lib/gemini.ts`** — ajout de `chatWithImage()`
  - Utilise `model.generateContent({ contents })` pour envoyer histoire texte + image courante en `inlineData`
  - Compatible JPEG, PNG, WEBP, PDF (Gemini 2.5 Flash supporte tous ces formats)

- **`app/api/upload/route.ts`** (nouveau)
  - Reçoit `multipart/form-data` : `file`, `message`, `parentId`, `history`
  - Convertit le fichier en base64, appelle `chatWithImage()` en premier appel
  - Même flux SSE que `/api/chat` : `status{thinking}` → optionnel `status{searching}` → `token` × N → `done`
  - Prompt d'analyse document : identifie le type, traduit, extrait dates/actions, explique les termes allemands
  - Si `need_files` → second appel `chat()` standard avec contenu des fichiers

## [v3.0.0] — 2026-03-14

### Ajouté — Streaming SSE

- **`app/api/chat/route.ts`** — passage en `ReadableStream` / Server-Sent Events
  - `event: status {"type":"thinking"}` → dès réception du message
  - `event: status {"type":"searching","message":"..."}` → si Gemini demande des fichiers (need_files)
  - `event: token {"content":"..."}` → mot par mot, délai adaptatif (7–16ms selon longueur du texte)
  - `event: done {"sources":[...],"full_response":"..."}` → fin du stream
  - `event: status {"type":"error","message":"..."}` → erreur catchée à n'importe quelle étape
  - Helper `streamWords()` : tokenisation par `\S+\s*` pour préserver newlines + délai adaptatif
  - Suppression de `NextResponse.json()` → remplacé par `new Response(stream, {headers SSE})`

- **`components/ChatInterface.tsx`** — lecture du stream SSE côté client
  - `runStream()` : parser SSE manuel (split `\n\n`, lecture ligne par ligne `event:` / `data:`)
  - État `MessageStatus` : `"thinking" | "searching" | "streaming" | "error" | undefined`
  - `ThinkingDots` : trois points animés (`animate-bounce`, délais décalés 0/150/300ms)
  - Bulle "thinking" : fond gris, 3 points qui rebondissent
  - Bulle "searching" : fond ambre, icône 🔍, texte italique dans la langue du parent
  - Bulle "streaming" : texte partiel + curseur clignotant (`animate-pulse`)
  - Bulle "error" : fond rouge pâle, icône ⚠️
  - Sources finales : badges `📚` arrondis sous la réponse terminée
  - Focus automatique sur l'input après `done` ou `error`
  - `buildHistory()` filtre uniquement les messages avec `status === undefined` (terminés)
  - Bienvenue et messages normaux passent tous les deux par `runStream()`

## [v2.0.0] — 2026-03-14

### Ajouté
- Tailwind CSS v4, store en mémoire, 3 chemins d'entrée (accueil / sélection / inscription)
- API GET /api/parents, GET /api/parents/[id], POST /api/register
- Message de bienvenue contextualisé au chargement du chat
- Mode anonyme (chat sans profil)

## [v1.0.0] — 2026-03-14

### Ajouté
- Initialisation Next.js 15 + Gemini 2.5 Flash
- Flux en deux temps : inventaire → demande fichiers → réponse sourcée
- Interface de chat minimaliste
