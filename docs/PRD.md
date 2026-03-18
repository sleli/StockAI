# StockAI - Product Requirements Document

**Author:** AIRchetipo
**Date:** 2026-03-18
**Version:** 1.0

---

## Elevator Pitch

> StockAI aiuta gli investitori retail a monitorare rapidamente i prezzi di borsa con dati quanto piu realtime possibile su stack gratuito, senza rumore inutile.
>
> For **retail investors and finance learners**, who has the problem of **tracking stock prices across multiple symbols without opening complex trading platforms**, **StockAI** is a **web stock price monitoring app** that **shows live quotes, watchlists, price changes, and quick historical context in one simple dashboard**. Unlike **generic finance portals with ads and clutter**, our product **focuses on a clean personalized watchlist experience powered by free near-real-time market APIs and lightweight alerts**.

---

## Vision

Rendere il monitoraggio dei prezzi di borsa semplice, veloce e accessibile, permettendo a utenti retail e studenti di seguire i titoli che contano davvero con dati affidabili, freschi e presentati in modo chiaro.

### Product Differentiator

Il prodotto punta su tre leve: semplicita d'uso, dashboard personale essenziale e integrazione con API gratuite che offrano dati real-time o near-real-time senza obbligare l'utente a usare piattaforme di trading pesanti.

---

## User Personas

### Persona 1: Marco Bianchi

**Role:** Investitore retail part-time
**Age:** 34 | **Background:** Impiegato nel settore marketing, investe autonomamente in ETF e azioni USA dal telefono e dal laptop

**Goals:**
- Tenere sotto controllo 10-20 titoli senza aprire piu siti.
- Capire subito se un titolo si sta muovendo in modo rilevante.
- Ricevere segnali semplici prima di decidere se approfondire o operare.

**Pain Points:**
- I portali finanziari generalisti sono pieni di pubblicita e informazioni dispersive.
- Le piattaforme broker sono piu complesse del necessario per il solo monitoraggio.
- Non sempre e chiaro quanto siano aggiornati i dati mostrati.

**Behaviors & Tools:**
- Controlla i prezzi piu volte al giorno, soprattutto pre-market e dopo l'apertura USA.
- Usa smartphone durante la giornata e laptop la sera.
- Confronta rapidamente variazione giornaliera, ultimi prezzi e mini-chart.

**Motivations:** Vuole sentirsi in controllo del proprio watchlist senza perdere tempo.
**Tech Savviness:** Medio

#### Customer Journey — Marco Bianchi

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Scopre l'app cercando un modo piu semplice per seguire titoli come AAPL e NVDA | "Mi serve qualcosa di piu pulito del solito portale finanziario" | Frustrazione mista a curiosita | Comunicare subito semplicita, velocita e focus sul monitoraggio |
| Consideration | Valuta se puo creare una watchlist personale con prezzi aggiornati | "Se vedo dati freschi e affidabili la uso ogni giorno" | Cauta speranza | Mostrare ticker demo, timestamp aggiornamento e UX chiara |
| First Use | Cerca i primi simboli e crea la sua watchlist | "In due minuti devo avere la mia schermata pronta" | Soddisfazione se il setup e rapido | Onboarding corto con esempi e ricerca ticker immediata |
| Regular Use | Rientra piu volte al giorno per controllare prezzi, variazioni e alert | "Devo capire al volo cosa sta succedendo" | Fiducia | Evidenziare variazioni, stato mercato e alert rilevanti |
| Advocacy | Condivide l'app con amici che investono in autonomia | "Finalmente un tracker semplice che non distrae" | Entusiasmo | Rendere condivisibili watchlist e snapshot |

---

### Persona 2: Giulia Rossi

**Role:** Studentessa di economia e finanza
**Age:** 24 | **Background:** Universitaria, segue mercati e notizie per studio e interesse personale

**Goals:**
- Osservare l'andamento di titoli noti in tempo quasi reale.
- Collegare il movimento del prezzo a eventi e notizie di mercato.
- Costruire abitudine quotidiana di osservazione dei mercati.

**Pain Points:**
- Le interfacce professionali sono troppo dense per un uso di apprendimento.
- I dati gratuiti spesso hanno limiti o copertura poco chiara.
- Fa fatica a ricordare quali simboli stava seguendo nei giorni precedenti.

**Behaviors & Tools:**
- Usa soprattutto laptop.
- Salva simboli interessanti e confronta performance giornaliera e settimanale.
- Apprezza spiegazioni semplici, timestamp e visualizzazioni compatte.

**Motivations:** Vuole imparare a leggere il mercato in modo pratico e costante.
**Tech Savviness:** Medio-alto

#### Customer Journey — Giulia Rossi

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Scopre l'app tramite community e contenuti educational | | | |
| Consideration | Prova a capire se puo seguire una lista di titoli per studio quotidiano | | | |
| First Use | Cerca ticker, apre il dettaglio di un titolo e salva i preferiti | | | |
| Regular Use | Torna ogni giorno per osservare prezzi, cambi percentuali e storico breve | | | |
| Advocacy | Consiglia l'app ad altri studenti o amici interessati ai mercati | | | |

---

## Brainstorming Insights

> Key discoveries and alternative directions explored during the inception session.

### Assumptions Challenged

- Assunzione 1: "Realtime gratis" significhi realtime completo per tutti i mercati. In realta la copertura gratuita varia molto per mercato; per l'MVP conviene focalizzarsi sui titoli USA e su API con free tier chiaro.
- Assunzione 2: Gli utenti vogliano una piattaforma di trading. Il bisogno espresso e monitorare, non eseguire ordini; l'app deve restare leggera e focalizzata.
- Assunzione 3: Servano tante funzionalita fin dal primo rilascio. Per validare il prodotto bastano watchlist, quote fresche, dettaglio titolo e alert base.

### New Directions Discovered

- What if il competitor lanciasse domani una copia? Il vantaggio difendibile diventa UX essenziale, velocita e chiarezza sulla freschezza del dato.
- What if l'app dovesse funzionare quasi senza UI complessa? Emerge il valore di alert e riepiloghi compatti come esperienza primaria.
- Audience flip: per studenti e creator finance, la parte educativa e la trasparenza del dato diventano piu importanti dell'iper-personalizzazione.
- Anti-problem: il prodotto fallirebbe se mostrasse prezzi poco affidabili, simboli difficili da trovare o refresh percepito come lento.

---

## Product Scope

### MVP - Minimum Viable Product

- Registrazione e accesso riutilizzano il boilerplate esistente.
- Dashboard protetta con watchlist personale.
- Ricerca ticker per simbolo o nome azienda.
- Visualizzazione prezzo corrente, variazione assoluta e percentuale, ultimo aggiornamento.
- Refresh near-real-time per i simboli salvati con strategia rispettosa dei limiti gratuiti.
- Pagina dettaglio titolo con mini storico intraday o giornaliero.
- Alert base su soglia prezzo sopra/sotto un valore scelto.
- Stati chiari per mercato chiuso, limite API raggiunto ed errori di refresh.

### Growth Features (Post-MVP)

- Multi-watchlist tematiche.
- Confronto tra piu titoli in una vista unica.
- Notifiche email o push per alert.
- Supporto a ETF, forex e crypto.
- Note personali per singolo titolo.
- Integrazione notizie di mercato contestuali.

### Vision (Future)

- Copertura globale multi-mercato con priorita dinamica dei refresh.
- Alert intelligenti basati su volatilita e pattern semplici.
- Dashboard condivisibili e pubbliche.
- Modalita educational con spiegazioni dei movimenti di prezzo.
- Portfolio simulation senza trading reale.

---

## Technical Architecture

> **Proposed by:** Leonardo (Architect)

### System Architecture

L'app sara costruita come web app full-stack su Next.js, con UI server-rendered dove utile, API interne per orchestrare chiamate ai provider di mercato e database PostgreSQL via Prisma per persistere watchlist, preferiti, alert e cache applicativa dei dati. Questa scelta segue il boilerplate esistente: questo progetto usa gia auth, database e UI configurati; ricostruire da zero farebbe perdere tempo e introdurrebbe inconsistenze.

**Architectural Pattern:** Modular Monolith on Next.js App Router

**Main Components:**
- UI layer in `src/app` per home, dashboard, watchlist e dettaglio titolo.
- Server-side application layer con Route Handlers per ricerca simboli, quote aggregate, storico e gestione alert.
- Domain modules per `watchlists`, `quotes`, `symbols`, `alerts` e `market-data`.
- Prisma data access layer verso PostgreSQL Supabase.
- Integrazione esterna con Twelve Data Basic come provider iniziale, perche offre piano gratuito con dati real-time su US equities/ETF e trial WebSocket; fallback futuro previsto verso un secondo provider se necessario.
- Cache applicativa per ridurre consumo API e normalizzare i payload.

### Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Language | TypeScript | 5.8.x | Tipizzazione forte end-to-end su stack gia presente |
| Backend Framework | Next.js Route Handlers + Server Components | 15.3.x | Backend e frontend nello stesso progetto, meno complessita operativa |
| Frontend Framework | Next.js + React | 15.3.x / 19.1.x | Il boilerplate esistente e gia pronto con App Router e rendering moderno |
| Database | PostgreSQL (Supabase managed) | Managed | Database relazionale affidabile per watchlist, alert e caching metadati |
| ORM | Prisma | 6.5.x | Gia configurato nel boilerplate e adatto a modellare dati applicativi |
| Auth | Supabase Auth | Existing boilerplate | OAuth e session management gia presenti |
| Testing | Vitest + React Testing Library + Playwright | Proposed | Copertura unitaria, integrazione UI e smoke e2e |

### Project Structure

**Organizational pattern:** Feature-oriented modules layered inside the existing App Router structure

```
src/
  app/
    page.tsx
    dashboard/
      page.tsx
    stocks/
      [symbol]/page.tsx
    api/
      quotes/route.ts
      search/route.ts
      alerts/route.ts
      watchlists/route.ts
  components/
    stocks/
    watchlists/
    alerts/
    ui/
  lib/
    market-data/
      provider.ts
      twelve-data.ts
      quote-normalizer.ts
    services/
      watchlists.ts
      alerts.ts
      quotes.ts
    prisma.ts
    supabase/
prisma/
  schema.prisma
```

### Development Environment

Sviluppo locale con Node.js 22+, npm, Next.js in modalita Turbopack, database PostgreSQL Supabase gia collegato via `DATABASE_URL`, chiave publishable Supabase e server secret per il provider dati di mercato. Per l'MVP e consigliato sviluppare contro un solo provider dati e un set limitato di ticker demo per controllare consumo API e qualita UX.

**Required tools:** Node.js 22+, npm, Prisma CLI, Supabase project, Twelve Data API key, browser devtools

### CI/CD & Deployment

**Build tool:** `next build`

**Pipeline:** lint -> typecheck -> unit/integration tests -> Prisma generate -> build -> deploy preview -> smoke test su dashboard e API quote

**Deployment:** Deploy continuo su Vercel per frontend e backend Next.js, con variabili ambiente gestite per Supabase e provider market data

**Target infrastructure:** Vercel for app hosting, Supabase for auth/storage/database, Twelve Data external API

### Architecture Decision Records (ADR)

- ADR-1: Mantenere il boilerplate Next.js + Supabase + Prisma + Tailwind + shadcn/ui per ridurre tempo di consegna e rischio tecnico.
- ADR-2: Usare pattern modular monolith invece di microservizi, perche l'MVP ha dominio limitato e un solo team puo iterare piu velocemente.
- ADR-3: Chiamare il provider dati dal server e mai dal client per proteggere le API key e centralizzare caching, rate limiting e fallback.
- ADR-4: Focalizzare l'MVP su titoli USA e ETF se il free tier del provider limita copertura o frequenza, comunicando sempre freshness e source del dato.
- ADR-5: Prevedere un adapter layer `market-data` per sostituire o affiancare il provider senza riscrivere il resto dell'app.

---

## Functional Requirements

### Watchlist & Personalization

- **FR1.** L'utente autenticato deve poter creare una watchlist personale all'interno della dashboard protetta. **Extends existing boilerplate: dashboard page + route protection**.
- **FR2.** L'utente deve poter aggiungere un simbolo azionario alla watchlist cercandolo per ticker o nome azienda.
- **FR3.** L'utente deve poter rimuovere un simbolo dalla watchlist in qualsiasi momento.
- **FR4.** L'utente deve poter riordinare o ordinare la watchlist per nome, prezzo, variazione percentuale o ultima attivita.

### Market Data Experience

- **FR5.** Il sistema deve mostrare per ogni simbolo salvato il prezzo corrente, la variazione assoluta, la variazione percentuale e il timestamp dell'ultimo aggiornamento.
- **FR6.** Il sistema deve aggiornare automaticamente le quotazioni dei titoli in watchlist con una strategia near-real-time compatibile con i limiti del provider gratuito.
- **FR7.** Il sistema deve mostrare uno stato esplicito del dato, distinguendo almeno tra `fresh`, `stale`, `market closed` ed `error`.
- **FR8.** Il sistema deve offrire una pagina di dettaglio per singolo titolo con storico breve, high/low e variazione sul periodo selezionato.

### Search, Alerts & Reliability

- **FR9.** Il sistema deve fornire un endpoint di ricerca simboli che normalizzi i risultati del provider e mostri ticker, nome e mercato.
- **FR10.** L'utente deve poter creare un alert di prezzo sopra o sotto una soglia numerica per un simbolo presente in watchlist.
- **FR11.** Il sistema deve evidenziare nella dashboard gli alert attivati e lo stato attivo/disattivo di ciascun alert.
- **FR12.** Il sistema deve gestire i limiti del provider mostrando messaggi chiari quando non e possibile aggiornare immediatamente il dato.
- **FR13.** Il sistema deve memorizzare una cache applicativa minima delle ultime quote recuperate per migliorare resilienza e continuita visiva.

### Usability & Session Context

- **FR14.** L'utente deve poter vedere una dashboard iniziale con una watchlist vuota guidata da empty state e ticker suggeriti. **Extends existing boilerplate: protected dashboard**.
- **FR15.** Il sistema deve ricordare gli ultimi simboli visualizzati dall'utente per facilitare il ritorno rapido ai titoli monitorati.

---

## Non-Functional Requirements

### Security

- Le API key del provider dati devono essere conservate solo lato server e mai esposte al browser.
- Le route applicative per watchlist e alert devono richiedere sessione valida tramite il sistema auth gia presente nel boilerplate.
- Le query Prisma devono applicare sempre scoping per utente autenticato, evitando accesso a watchlist e alert di altri utenti.
- Il sistema deve registrare errori di integrazione senza salvare segreti in log.
- Deve essere previsto rate limiting leggero sugli endpoint di ricerca e refresh per prevenire abuso del free tier.

### Integrations

- Integrazione primaria con Twelve Data Basic per ricerca simboli, quote e storico breve su piano gratuito, privilegiando i mercati disponibili in real-time gratuito.
- Adapter applicativo interno per consentire futuro supporto a provider alternativi come Finnhub o Alpha Vantage senza impattare UI e modelli dati.
- Integrazione con Supabase per autenticazione e persistenza dati utente.
- Integrazione con Prisma come livello di accesso al database PostgreSQL gestito da Supabase.

---

## Next Steps

1. **UX Design** - Define detailed interaction flows and wireframes for MVP features
2. **Detailed Architecture** - Deepen technical decisions on critical areas
3. **Backlog** - Decompose functional requirements into epics and user stories
4. **Validation** - Review with stakeholders and test the riskiest business assumptions

---

_PRD generated via AIRchetipo Product Inception - 2026-03-18_
_Session conducted by: utente with the AIRchetipo team_
