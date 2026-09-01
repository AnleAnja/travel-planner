# Weggefährten

Eine mobile-first PWA für gemeinsame Reiseplanung: Tagesplan mit eingebetteten
Google-Maps-Orten, Buchungsübersicht, private und geteilte Packlisten, Wetter,
Notizen, Reisegruppe und centgenaue Ausgabenabrechnung.

## Lokal starten

```bash
npm install
npm run dev
```

Ohne Umgebungsvariablen startet die App bewusst im lokalen Demo-Modus. Daten
werden im Browser gespeichert und zwischen Tabs synchronisiert.

## Supabase verbinden

1. Kostenloses Supabase-Projekt in einer EU-Region erstellen.
2. Anonyme Anmeldung unter **Authentication → Providers → Anonymous** aktivieren.
3. Migrationen aus `supabase/migrations` anwenden.
4. Edge Functions `join-trip` und `weather` deployen.
5. `.env.example` nach `.env.local` kopieren und die öffentlichen Projektwerte
   eintragen.

Der Service-Role-Key darf ausschließlich als automatisch vorhandenes Secret in
Supabase Edge Functions verwendet werden. Die Sicherheit des Browsers basiert
auf den RLS-Richtlinien, nicht auf dem öffentlichen Publishable-Key.

## GitHub Pages

Der Workflow `.github/workflows/deploy-pages.yml` testet und veröffentlicht
Pushes auf `main`. Im Repository:

1. Unter **Settings → Pages** als Quelle **GitHub Actions** wählen.
2. Unter **Settings → Secrets and variables → Actions → Variables** die Werte
   `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` anlegen.
3. Das öffentliche Repository muss `travel-planner` heißen. Bei einem anderen
   Namen den `base`-Pfad in `vite.config.ts` anpassen.

## Qualität

```bash
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Open-Meteo wird ausschließlich nichtkommerziell und mit sichtbarer
Quellenangabe verwendet. Für einen späteren kommerziellen Betrieb muss die
Lizenz neu bewertet werden.
