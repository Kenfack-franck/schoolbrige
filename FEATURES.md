# Features SchoolBridge

## Version 5 — Dashboard + Agenda + Contacts + Sessions + STT

| Feature | Statut | Notes |
|---|---|---|
| Dashboard parent | ✅ Fait | `/dashboard?parentId=` — 4 sections |
| Enfants avec indicateur de moyenne | ✅ Fait | Couleur selon seuil (vert/orange/rouge) |
| Agenda timeline verticale | ✅ Fait | Icônes par type, toggle "Fait", style retard |
| Pré-remplissage agenda BW | ✅ Fait | Vacances hardcodées + calendrier FSG JSON |
| Mise à jour agenda depuis le chat | ✅ Fait | Gemini → `agenda_items` → `event: agenda` SSE |
| Contacts recommandés (filtrés par langue) | ✅ Fait | Filtrage sur `langues[]` du contact vs langue parent |
| Modal envoi de message contact | ✅ Fait | Textarea → POST contacts API → confirmation |
| Section profil parent | ✅ Fait | Langue, pays, niveau allemand, compréhension système |
| Sélection profil avec bouton Dashboard | ✅ Fait | Carte expandable → 2 boutons action |
| Bouton Dashboard dans le chat | ✅ Fait | Header du chat → `/dashboard?parentId=` |
| Persistance session localStorage | ✅ Fait | Clé `schoolbridge_chat_{parentId\|anonymous}` |
| Restauration session au montage | ✅ Fait | Filtrage des messages `isWelcome` |
| Bouton 🗑️ effacer session | ✅ Fait | Efface localStorage + reset messages + stop TTS |
| STT (Speech-to-Text) | ✅ Fait | Web Speech API native, bouton 🎙️ |
| STT résultats intermédiaires | ✅ Fait | `interimResults: true` → texte dans l'input en temps réel |
| STT langue automatique | ✅ Fait | Langue parent → BCP-47 via `LANG_MAP` |
| STT non disponible → bouton masqué | ✅ Fait | `hasSTT` post-hydration |
| API agenda CRUD | ✅ Fait | GET / POST / PATCH |
| API contacts CRUD | ✅ Fait | GET / POST (add contact + add message) |

## Version 4 — Markdown + Upload + TTS

| Feature | Statut | Notes |
|---|---|---|
| Rendu Markdown dans les bulles assistant | ✅ Fait | `react-markdown` + composants Tailwind |
| Rendu progressif pendant le streaming | ✅ Fait | ReactMarkdown reçoit le texte token par token |
| Titres, listes, gras, italique, tableaux, HR | ✅ Fait | Styles cohérents avec la bulle de chat |
| Upload image (JPG, PNG, WEBP) | ✅ Fait | Bouton 📎, max 10 MB |
| Upload PDF | ✅ Fait | Icône 📄, envoi direct à Gemini 2.5 Flash |
| Prévisualisation avant envoi | ✅ Fait | Miniature image ou icône PDF + nom |
| Bulle utilisateur avec image | ✅ Fait | Miniature max 200px dans la bulle bleue |
| Analyse document par Gemini (multimodal) | ✅ Fait | `/api/upload` SSE — identifie, traduit, extrait actions |
| Upload avec message texte optionnel | ✅ Fait | Le message accompagne l'image dans le prompt |
| Lecture vocale automatique (TTS) | ✅ Fait | Web Speech API native, `rate: 0.9` |
| Langue vocale adaptée au parent | ✅ Fait | `LANG_MAP` 16 langues → BCP-47 |
| Nettoyage Markdown pour TTS | ✅ Fait | `stripMarkdown()` retire **, *, #, emojis, sources |
| Texte long découpé en chunks TTS | ✅ Fait | Chunks ≤2000 chars, lecture séquentielle via `onend` |
| Bouton 🔊 / ⏹ sur chaque bulle | ✅ Fait | Relecture manuelle + stop |
| Bouton global 🔊/🔇 (auto/muet) | ✅ Fait | Dans la barre d'input |
| Bienvenue non lue automatiquement | ✅ Fait | `isWelcome: true` exclu du TTS auto |
| Stop lecture au nouvel envoi | ✅ Fait | `speechSynthesis.cancel()` dans `handleSubmit` |
| Pas de TTS si navigateur non compatible | ✅ Fait | `hasTTS` vérifié, boutons masqués silencieusement |

## Version 3 — Streaming

| Feature | Statut | Notes |
|---|---|---|
| Streaming SSE (Server-Sent Events) | ✅ Fait | Route retourne ReadableStream |
| Indicateur "thinking" (3 points animés) | ✅ Fait | Tailwind animate-bounce, délais décalés |
| Message "searching" (fond ambre, 🔍) | ✅ Fait | Message de Gemini dans la langue du parent |
| Texte streamé mot par mot | ✅ Fait | Délai adaptatif 7–16ms selon longueur |
| Curseur clignotant pendant le stream | ✅ Fait | `animate-pulse` sur un span inline |
| Sources en badges 📚 sous la réponse | ✅ Fait | `rounded-full`, style discret |
| Message d'erreur en rouge | ✅ Fait | ⚠️ + fond rouge pâle |
| Re-focus input après done/error | ✅ Fait | `inputRef.current?.focus()` |
| Welcome message streamé | ✅ Fait | Même code path que messages normaux |
| Parser SSE manuel côté client | ✅ Fait | Pas de lib externe |

## Version 2 — Onboarding

| Feature | Statut | Notes |
|---|---|---|
| Écran d'accueil 3 chemins | ✅ Fait | |
| Sélection parent/enfant | ✅ Fait | |
| Formulaire d'inscription | ✅ Fait | Jusqu'à 4 enfants, validation front |
| Store en mémoire | ✅ Fait | Perdu au redémarrage (MVP) |
| Message de bienvenue contextualisé | ✅ Fait | Calendrier pré-chargé |
| Mode anonyme | ✅ Fait | Suggestion d'inscription |
| API parents / register | ✅ Fait | |

## Version 1 — Minimum viable

| Feature | Statut | Notes |
|---|---|---|
| Chat Gemini 2.5 Flash | ✅ Fait | |
| Détection automatique de la langue | ✅ Fait | |
| Réponses personnalisées profil | ✅ Fait | |
| Flux en deux temps (need_files) | ✅ Fait | |
| Sources citées | ✅ Fait | |

## Backlog

| Feature | Statut | Notes |
|---|---|---|
| Section communauté / buddies | 📋 Planifié | Mise en relation parent-à-parent |
| Design mobile-first élaboré | 📋 Planifié | |
| Déploiement Vercel | 📋 Planifié | |
| Notifications push agenda | 📋 Planifié | |
