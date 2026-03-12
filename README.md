# Workshop Boilerplate — Next.js + Supabase + Prisma + Tailwind + shadcn/ui

A ready-to-go starter for building full-stack apps with authentication, database, and a polished UI.

## Stack

- **Next.js 15** (App Router, Turbopack)
- **Supabase** (Auth + Storage)
- **Prisma** (ORM, connected to Supabase PostgreSQL)
- **Tailwind CSS v4** + **shadcn/ui**
- **TypeScript**

---

## Guida Setup (per partecipanti al workshop)

### Prerequisiti

- **Node.js** v18+ installato ([nodejs.org](https://nodejs.org))
- **Git** installato
- Un account **GitHub** (per fare la fork e per il login OAuth)
- Un account **Supabase** gratuito ([supabase.com](https://supabase.com))

---

### Step 1 — Fork e clone del repository

1. Vai sulla pagina GitHub del repository e clicca **Fork** in alto a destra
2. Clona la tua fork sulla tua macchina:

```bash
git clone https://github.com/TUO-USERNAME/next-auth-neon-boilerplate.git
cd next-auth-neon-boilerplate
```

---

### Step 2 — Crea un progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e fai login
2. Clicca **New Project**
3. Scegli un nome, una password per il database e la region (scegli la più vicina a te)
4. Aspetta che il progetto sia pronto (circa 1 minuto)

---

### Step 3 — Abilita i provider di autenticazione

Nel Supabase Dashboard vai su **Authentication → Providers**:

- **GitHub**: Attiva il toggle — funziona subito come managed provider (non serve creare un'OAuth App)
- **Google**: Attiva il toggle — funziona subito come managed provider (non serve la Google Cloud Console)

> Entrambi sono "managed providers" di Supabase: basta attivare il toggle e funzionano immediatamente per lo sviluppo. Per la produzione, puoi configurare le tue credenziali OAuth.

---

### Step 4 — Configura le variabili d'ambiente

1. Copia il file di esempio:

```bash
cp .env.local.example .env.local
```

2. Apri `.env.local` e inserisci i valori dal tuo progetto Supabase:

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Settings → API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API** → anon/public key |
| `DATABASE_URL` | Supabase Dashboard → **Settings → Database** → Connection string → **URI** (seleziona "Transaction" mode) |

> **Attenzione**: nella connection string, sostituisci `[YOUR-PASSWORD]` con la password che hai scelto quando hai creato il progetto.

---

### Step 5 — Installa le dipendenze

```bash
npm install
```

---

### Step 6 — Crea le tabelle nel database

```bash
npx prisma db push
```

Questo comando crea la tabella `User` nel tuo database Supabase basandosi sullo schema in `prisma/schema.prisma`.

---

### Step 7 — Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

### Step 8 — Testa il login

1. Vai su [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
2. Clicca su **GitHub** o **Google**
3. Autorizza l'accesso
4. Verrai reindirizzato alla dashboard

---

## Comandi utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo (Turbopack) |
| `npm run build` | Build di produzione |
| `npm run start` | Avvia il server di produzione |
| `npm run db:push` | Applica lo schema Prisma al database |
| `npm run db:studio` | Apri Prisma Studio (GUI per il database) |
| `npm run db:generate` | Rigenera il Prisma Client |

## API Routes

Il boilerplate include una API route di esempio su `/api/hello`:

```bash
# GET
curl http://localhost:3000/api/hello

# POST
curl -X POST http://localhost:3000/api/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

## Troubleshooting

### "Invalid API key" o errori di autenticazione
- Verifica che `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` siano corretti in `.env.local`
- Assicurati di non avere spazi extra nei valori

### "Can't reach database server"
- Verifica che `DATABASE_URL` sia corretto in `.env.local`
- Assicurati di aver sostituito `[YOUR-PASSWORD]` con la password reale del database
- Controlla che la tua rete non blocchi connessioni in uscita sulla porta 6543

### Il login OAuth non funziona
- Verifica che i provider GitHub e/o Google siano attivati nel Supabase Dashboard → Authentication → Providers
- Assicurati che il Redirect URL nel Supabase Dashboard includa `http://localhost:3000`

### Dopo `npm install` da errore su Prisma
- Prova a eseguire manualmente: `npx prisma generate`

## Deploy su Vercel

1. Pusha il tuo repo su GitHub
2. Importa il repo su [vercel.com](https://vercel.com)
3. Aggiungi le 3 variabili d'ambiente nelle impostazioni del progetto Vercel
4. Deploy
