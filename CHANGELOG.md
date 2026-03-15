# Changelog

## [v8.0.0] — 2026-03-15

### Rebrand + Inline Post Composer

#### Modification 1 — Renommage ElternGuide
- Toutes les occurrences de "SchoolBridge" remplacées par "ElternGuide" dans tout le projet
  - `app/layout.tsx` — titre de page et meta description
  - `app/page.tsx` — landing page (logo, testimonials)
  - `components/NavBar.tsx` — logo dans la navbar
  - `components/ChatInterface.tsx` — message de bienvenue, barre de statut, disclaimer
  - `app/select/page.tsx`, `app/register/page.tsx`, `app/dashboard/DashboardContent.tsx`
  - `lib/prompts.ts` — system prompt IA + renommage de la constante `SCHOOLBRIDGE_SYSTEM_PROMPT` → `ELTERNGUIDE_SYSTEM_PROMPT`
  - `app/api/chat/route.ts`, `app/api/upload/route.ts` — imports mis à jour
  - `schoolbridge-data/community/posts.json` — "SchoolBridge Bot" → "ElternGuide Bot"
  - Docs : `README.md`, `ARCHITECTURE.md`, `FEATURES.md`, `CHANGELOG.md`
- Note : le dossier `schoolbridge-data/` n'est pas renommé (évite de casser les imports)

#### Modification 2 — Composeur de post inline
- Suppression du bouton flottant "Publier" et du modal de publication
- Nouveau composant `InlineComposer` dans `CommunityPageContent.tsx` :
  - Avatar du parent connecté (initiales + couleur rôle)
  - Textarea expandable au focus (1 ligne → 4 lignes, transition douce)
  - Badges de type (ℹ️ Info / ❓ Question / 🎉 Event) apparus au focus
  - Boutons action : Attach (📎), Event (📅 toggle champ date), Mention (👤 décoratif)
  - Bouton "Post" activé seulement quand du texte est présent
  - Ajout d'image avec prévisualisation locale + bouton ✕ de suppression
  - École cible (`ecole_cible`) auto-détectée : première école de l'enfant si onglet "School", sinon `null`
  - Utilisateur non authentifié : message "Log in to post" à la place du composeur
- `app/community/CommunityPageContent.tsx` — fetch `/api/parents/[id]` pour afficher le prénom dans le placeholder

## [v7.4.0] — 2026-03-15

### Correctif — Communauté + STT auto-envoi

- **`components/ChatInterface.tsx`** — STT auto-envoi corrigé
  - Problème : `useEffect([input])` ne se déclenchait pas si `input` n'avait pas changé (React déduplique les state égaux)
  - Solution : compteur `sttSubmitTrigger` (toujours incrémenté) + ref `pendingSTTTextRef` pour le texte capturé
  - `recognition.onend` → `pendingSTTTextRef.current = accumulated` + `setSttSubmitTrigger(n => n + 1)`
  - `useEffect([sttSubmitTrigger])` → lit `pendingSTTTextRef`, nettoie l'input, soumet le message

- **`lib/store.ts`** — filtre Général corrigé
  - `getCommunityPosts` général : `ecole_cible === null` uniquement (était `=== null || schoolIds.includes()`)
  - Interface `Comment` : champ `auteur_role?: string` ajouté
  - Interface `CommunityPost.auteur_role` : ajout de `"Médiatrice interculturelle"` et `"Institution"`

- **`schoolbridge-data/community/posts.json`** — 8 nouveaux posts généraux
  - POST-013 : Elterncafé International (Institution)
  - POST-014 : BuT — Bildung und Teilhabe (Institution)
  - POST-015 : Stadtbibliothek Heilbronn (Institution)
  - POST-016 : Elif Arslan — question deutschsprachige Schule
  - POST-017 : Fatma Kılıç — question Nachhilfe
  - POST-018 : VHS Integrationskurse (Institution)
  - POST-019 : Maria Ionescu — question Ferienprogramm
  - POST-020 : ElternGuide Bot — explication bulletin de notes

- **`app/community/CommunityPageContent.tsx`** — corrections UI
  - Onglet « Mon école » renommé → « 🏫 École »
  - Onglet Général : sections « Infos école & institutions » + « Entraide entre parents »

- **`components/CommunityPost.tsx`** — badge Institution
  - Couleur avatar Institution : `#0F5257` (teal foncé)

## [v7.3.0] — 2026-03-15

### Scale-up global des composants

- **`app/globals.css`** — `html { font-size: 17px; }` pour agrandir l'ensemble du site
- **`components/NavBar.tsx`** — header `h-16`, liens `text-base px-4 py-2`, bottom bar icônes `text-2xl`
- **`components/ChildCard.tsx`** — avatar `w-16 h-16 text-xl`, nom `text-lg`
- **`components/ContactCard.tsx`** — avatar `w-14 h-14`, textes `text-base/sm`
- **`components/CalendarView.tsx`** — cellules `68px/84px`, jours `text-sm w-6`
- **`components/AgendaListView.tsx`** — cartes `p-4`, titres `text-base`, meta `text-sm`
- **`components/ChatInterface.tsx`** — bulles `px-5 py-4 text-base`, avatars `w-10 h-10`, input `text-base minH-48px`
- **`app/dashboard/DashboardContent.tsx`** — titres sections `text-xl`, accent bar `4px 48px`

## [v7.2.0] — 2026-03-15

### Design 3 — Dashboard + Agenda Calendrier

- **`components/ChildCard.tsx`** (nouveau) — Carte enfant riche
  - Avatar 56px (initiales), couleurs alternées : bleu, vert, violet, ambre
  - Barre de moyenne horizontale : `(6-moyenne)/5*100`% rempli, vert/jaune/orange/rouge selon valeur
  - Badge label (Excellent/Bon/Moyen/En difficulté) à côté de la moyenne
  - Deux colonnes : ✅ Points forts / ⚠️ À améliorer avec badges de notes colorés (1-2=vert, 3=jaune, 4=orange, 5-6=rouge)
  - Badge compétence 🧠 en `accent-light`
  - Bandeau besoins particuliers ⚡ en bleu-50
  - Hover : shadow + translateY(-2px)

- **`components/CalendarView.tsx`** (nouveau) — Calendrier mensuel CSS Grid pur
  - En-tête : ◀ Mois Année ▶ (navigation sans rechargement)
  - Grille 7×6 cellules (Lun–Dim), responsive (56px desktop, plus compact si nécessaire)
  - Jour actuel : cercle `primary` autour du numéro
  - Jours passés : opacité réduite
  - Pastilles événements : cercles 6px colorés par type (reunion=bleu, examen=rouge, echeance/tache=ambre, vacances=vert, evenement=violet, bulletin=jaune)
  - Maximum 3 pastilles + "+N" si davantage
  - Jours de vacances : fond `bg-green-50` (plages parsées depuis description des items)
  - Clic sur un jour → panel de détails sous la grille (titre, type badge, heure, lieu, enfant)
  - Légende vacances en bas si applicable

- **`components/AgendaListView.tsx`** (nouveau) — Timeline verticale
  - Ligne verticale 2px `border-line` à gauche, nœuds colorés par type
  - Séparateurs temporels : Aujourd'hui / Demain / Dans N jours / Le DD mois
  - Cartes événements : bordure gauche 3px colorée par type, badge type, heure 🕐, lieu 📍, badge enfant
  - Tâches en retard : fond rouge, badge "En retard" rouge
  - Événements faits : opacité 0.5, titre barré
  - Bouton "✓ Fait" pour tâches/échéances : outline → vert plein au toggle
  - Tri : retards en premier, puis par date, faits en dernier

- **`components/ContactCard.tsx`** (nouveau) — Carte contact
  - Avatar 48px, couleur selon rôle (orange=parent-relais, bleu=secrétariat, violet=conseiller, vert=médiatrice)
  - Badge rôle coloré, langues 🗣️, école 📍, disponibilité 🕐
  - Contexte de recommandation en italique avec bordure gauche
  - Bouton "📨 Envoyer un message" `bg-primary` pour contacts plateforme
  - Coordonnées cliquables pour contacts externes

- **`app/dashboard/DashboardContent.tsx`** — Refonte complète
  - Header : "Bonjour, {prenom} 👋" + ville/langue + mois à droite
  - Titres de sections : Plus Jakarta Sans 600, ligne accent 40px×3px dessous
  - **Mes enfants** : carousel horizontal mobile (scroll-snap), grille 2 colonnes desktop
  - **Agenda** : toggle 📅 Calendrier / 📋 Liste
    - Vue calendrier : CalendarView (3/5) + sidebar Prochainement (2/5) desktop, empilé mobile
    - Vue liste : AgendaListView pleine largeur
  - **Mes contacts** : séparation "Mes contacts" (déjà contactés) + "Personnes disponibles", grille 3 cols desktop
  - **Mon profil** : fond `canvas-muted`, grille d'infos avec icônes
  - Loading spinner animé
  - pb-20 mobile pour la bottom nav

## [v7.1.0] — 2026-03-14

### Design 2 — Chat Polish + Notification System

- **`app/globals.css`** — Nouvelles keyframes : `blink-cursor`, `dot-bounce`, `border-pulse`, `slide-in-right`, `slide-in-bottom`

- **`components/NavBar.tsx`** — Nouvelle prop `hideMobileBar?: boolean`
  - Permet de masquer la bottom bar mobile sur la page chat (le chat a son propre contexte)

- **`app/chat/ChatPageContent.tsx`** — Simplifié
  - Passe `hideMobileBar={true}` à NavBar
  - Suppression de la bande subtitle (déplacée dans ChatInterface)

- **`components/ChatInterface.tsx`** — Refonte visuelle complète
  - **Context bar** (utilisateurs identifiés) : avatar initiales (cercle primary), prenom + enfants (prenom · classe), 🗑️ effacer, 🔊/🔇 audio, 🔔 badge urgent
  - **Bulles utilisateur** : `bg-primary` (#1B4B6B) texte blanc, `rounded-2xl rounded-br-md`
  - **Bulles agent** : blanc, `border border-line`, ombre douce, `rounded-2xl rounded-bl-md`, avatar 🎓 (32px, cercle accent) sur première de chaque série
  - **Welcome card** : carte gradient (primary-lighter → blanc), mini-cards enfants à l'intérieur, pas une bulle ordinaire
  - **Thinking** : 3 points `primary-light` avec `dot-bounce` en cascade (delay 0/200/400ms)
  - **Searching** : bulle amber (`accent-light`), bordure pulsante (`border-pulse` animation)
  - **Streaming** : curseur `▌` clignotant (`blink-cursor` 0.9s step-end)
  - **Sources** : badges SOUS la bulle, `rounded-full bg-canvas-muted` 11px, icône 📚
  - **Input area** : `textarea` auto-grow (max 120px, 4 lignes), Enter=envoyer/Shift+Enter=newline
    - Gauche : 🎙️ mic (cercle `bg-canvas-muted`)
    - Centre : textarea arrondi
    - Droite : 📎 upload + ▶ send (amber `bg-accent` si contenu, gris sinon)
    - TTS toggle déplacé vers context bar
  - **Panneau notifications** (slide-in) :
    - Desktop : drawer fixe 320px depuis la droite
    - Mobile : bottom sheet 60% hauteur
    - Liste des posts urgents avec bouton "🌐 Traduire" par post
    - Posts épinglés avec bordure gauche amber et 📌
    - "Marquer comme lu" → dismiss + sessionStorage
  - **État `parentMeta`** : prenom, initiales, langNom, enfants — alimenté depuis `/api/parents/[id]`
  - **État `translatedPosts`** : traductions à la demande via `/api/community/translate`

## [v7.0.0] — 2026-03-14

### Design — Identité visuelle + Landing page

- **`app/globals.css`** — Tailwind v4 `@theme` avec palette complète
  - Couleurs : `primary` (#1B4B6B), `accent` (#E8913A), `success`, `warning`, `danger`, `muted`, `foreground`, `canvas`, `line`
  - Polices : `--font-display` (Plus Jakarta Sans), `--font-sans` (DM Sans)
  - CSS custom properties `:root` pour usage direct via `var()`

- **`app/layout.tsx`** — Google Fonts (next/font/google)
  - Plus Jakarta Sans : weight 600, 700 → `--font-jakarta`
  - DM Sans : weight 400, 500 → `--font-dm-sans`
  - Métadonnées complètes (title, description)

- **`app/page.tsx`** — Landing page complète (remplace les 3 boutons)
  - Barre de navigation fixe sticky (logo + S'inscrire)
  - Section héro : dégradé subtil, grand titre, bouton accent "▶ Essayer la démo" → `/chat?parentId=PAR-001`
  - Lien secondaire "Discuter sans inscription" → `/chat`
  - Trust badges (16 langues, Gemini 2.5 Flash)
  - 4 cartes de fonctionnalités (Multilingue, Documents, Communauté, Agenda) en grid responsive
  - Section "Prêt en 30 secondes"
  - Footer avec branding IPAI Hackathon

- **`components/NavBar.tsx`** (nouveau) — Navigation réutilisable
  - Desktop : header 56px, liens actifs mis en surbrillance (`bg-primary-lighter text-primary`)
  - Mobile : bottom bar fixe avec icônes et labels
  - Dashboard masqué si `parentId` null
  - "Changer de profil" en desktop si identifié

- **`app/chat/ChatPageContent.tsx`** — Utilise NavBar, strip de profil discret
- **`components/ChatInterface.tsx`** — `flex-1 min-h-0 pb-14 md:pb-0` (supprime height fixe, gère bottom bar mobile)
- **`app/dashboard/DashboardContent.tsx`** — Utilise NavBar, `pb-20 md:pb-8`, `bg-canvas-soft`
- **`app/community/CommunityPageContent.tsx`** — Utilise NavBar, `pb-20 md:pb-8`
- **`app/select/page.tsx`** — Header redessiné, couleurs `primary`, `foreground`, `line`

## [v6.2.0] — 2026-03-14

### Correctif — Persistance agenda + Prompt AGENDA renforcé

- **`lib/store.ts`** — agenda persisté sur disque (plus en mémoire)
  - `schoolbridge-data/agendas/{parentId}.json` — un fichier par parent
  - `readAgendaFile()` / `writeAgendaFile()` — lecture/écriture synchrones
  - `getAgenda`, `setAgenda`, `addAgendaItems`, `markAgendaItemDone` — lecture/écriture fichier
  - Survit aux hot-module reloads de Next.js en développement
  - La Map `_agendas` (en mémoire) est supprimée

- **`lib/prompts.ts`** — règle 8 AGENDA rendue obligatoire
  - "RÈGLE CRITIQUE" — si une date est mentionnée dans `response`, elle DOIT être dans `agenda_items`
  - Ajout de "RAPPEL" en bas de la règle pour réitérer l'obligation
  - Supprime le cas où Gemini dit "j'ajoute à votre agenda" sans inclure le champ JSON

## [v6.1.0] — 2026-03-14

### Ajouté — Communauté Partie 2 : Frontend + Bannière urgente

- **`components/CommunityPost.tsx`** (nouveau) — carte de post réutilisable
  - Avatar avec initiales, badge rôle coloré (rouge=Direction, orange=Secrétariat, bleu=Enseignant, violet=Conseiller, teal=Médiateur, vert=Parent)
  - Indicateur 📌 Épinglé + bordure gauche ambre sur les posts épinglés
  - Expand/collapse pour les contenus > 220 chars (épinglés dépliés d'office)
  - Bouton 🌐 Traduire : appelle `/api/community/translate` (Gemini, noms propres préservés)
  - Bouton 📅 Ajouter à l'agenda : POST `/api/agenda/[parentId]`, confirmation visuelle
  - Bouton 📨 Contacter : lien vers dashboard (auteurs `PR-xxx` uniquement)

- **`app/community/page.tsx`** (nouveau) — wrapper Suspense

- **`app/community/CommunityPageContent.tsx`** (nouveau, `"use client"`)
  - Onglets « 🏫 Mon école » (filtre `ecole`) et « 🌐 Général » (filtre `general`)
  - Sans parentId : onglet Général uniquement, bouton « Se connecter »
  - Modal « ✏️ Publier » : sélection du type, titre, contenu — POST `/api/community`
  - Nouveau post inséré en tête de liste sans rechargement

- **`app/api/community/route.ts`** — autorisation du filtre `general` sans `parentId`
  - parentId optionnel quand `filter=general` (posts `ecole_cible=null`)

- **`components/ChatInterface.tsx`** — bannière urgente
  - Fetch `GET /api/community/urgent?parentId=` au montage (utilisateurs identifiés)
  - Bannière ambre, max 3 posts, indicateur 📌, lien vers `/community`
  - Dismiss → `sessionStorage.setItem('urgent_dismissed_{parentId}', '1')` (une fois par session)

- **Navigation globale**
  - `app/chat/ChatPageContent.tsx` : bouton « 👥 Communauté » dans le header (identifié)
  - `app/dashboard/DashboardContent.tsx` : bouton « 👥 Communauté » dans le header
  - `app/select/page.tsx` : 3e bouton « 👥 Communauté » dans les cartes expandables
  - `app/page.tsx` : lien discret « 👥 Voir la communauté des parents » en bas de page

## [v6.0.0] — 2026-03-14

### Ajouté — Communauté Partie 1 : Données + API Routes

- **`schoolbridge-data/community/posts.json`** (nouveau) — 12 posts pré-remplis
  - Types : `annonce_officielle`, `information`, `question`, `evenement`
  - Auteurs : direction, secrétariat, enseignants, conseillers, parents-relais, bot
  - Langues : allemand, turc, arabe, ukrainien, français
  - 2 posts épinglés (POST-001, POST-004)

- **`lib/store.ts`** — système communauté
  - Interface `CommunityPost` exportée
  - Chargement depuis `posts.json` au démarrage dans `_communityPosts[]` mutable
  - `getCommunityPosts(parentId, "ecole"|"general")` — filtre par écoles du parent ou posts généraux, triés épinglés → date décroissante
  - `getUrgentPosts(parentId)` — épinglés + annonces officielles des 7 derniers jours
  - `addCommunityPost(post)` — ajoute un post avec ID `POST-NEW-{timestamp}`
  - `getRecentPostsForContext(parentId, limit)` — top N posts pour le contexte Gemini
  - `getCommunityPostById(postId)` — lecture d'un post par ID

- **`app/api/community/route.ts`** (nouveau)
  - `GET ?parentId&filter` — liste filtrée des posts
  - `POST` — crée un post pour un parent identifié (nom, langue depuis profil)

- **`app/api/community/translate/route.ts`** (nouveau)
  - `POST {postId, targetLang}` — traduction Gemini sans traduire noms propres/adresses/URLs

- **`app/api/community/urgent/route.ts`** (nouveau)
  - `GET ?parentId` — posts urgents avec `contenu_court` (100 caractères)

- **`app/api/chat/route.ts`** — intégration communauté
  - `community_question` ajouté à `GeminiComplete`
  - Section `=== POSTS RÉCENTS DE LA COMMUNAUTÉ ===` injectée dans le contexte Gemini (10 posts max)
  - Si Gemini retourne `community_question` → post créé dans le store → `event: community {action, titre}`

- **`lib/prompts.ts`** — règle 10 COMMUNAUTÉ
  - L'agent cite les posts naturellement ("D'après une annonce de Frau Weber...")
  - L'agent peut proposer de poster une question et retourne `community_question` si accepté
  - Règle 11 ENFANTS MULTIPLES (renumérotée depuis 10)

- **`components/ChatInterface.tsx`** — notification communauté
  - État `communityNotification`
  - Réception de `event: community` → bannière violet pâle 📢 avec titre de la question postée
  - Reset dans `handleClear`, `runStream`, `runUploadStream`

## [v5.2.0] — 2026-03-14

### Correctif — Transition vocale naturelle (searching → réponse)

- **`components/ChatInterface.tsx`** — file d'attente TTS
  - Nouveaux refs : `isSearchingSpeechActiveRef` et `pendingResponseTextRef`
  - Quand `event: searching` arrive et `autoSpeak = true` : lecture via `SpeechSynthesisUtterance` directement (pas via `speakText`) avec `onend` qui vérifie si une réponse est en attente
  - Suppression du `stopSpeech()` au premier token — le searching n'est plus coupé
  - Quand `event: done` arrive :
    - Si le searching est encore en lecture → texte de la réponse stocké dans `pendingResponseTextRef` (pas lu immédiatement)
    - Si le searching est terminé → lecture immédiate via `speakText`
  - Quand le searching finit (`onend`) → pause 400ms → lecture du texte en attente
  - Envoi d'un nouveau message → `stopSpeech()` + reset des deux refs (annulation propre)
  - Le comportement sans phase searching reste identique (pas de régression)

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
