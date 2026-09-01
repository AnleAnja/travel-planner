# Reiseplaner – MVP

## Ziel

Eine mobile, installierbare Web-App, mit der ein Freundeskreis eine Reise ohne Registrierung gemeinsam organisiert. Eine Person erstellt die Reise und teilt einen widerrufbaren Einladungslink oder Code. Gäste erhalten im Hintergrund eine anonyme Sitzung.

## Rollen

- **Owner:** Reise bearbeiten oder archivieren, Einladungen erstellen und widerrufen, Mitglieder entfernen.
- **Member:** Reiseinhalte, Buchungen, gemeinsame Packliste, Aktivitäten, Notizen und Ausgaben bearbeiten.
- Private Packeinträge sind ausschließlich für ihre Urheberin oder ihren Urheber sichtbar.

## Kernabläufe

1. Reise mit Titel, Ziel, Zeitraum, Zeitzone und Währung erstellen.
2. Link oder Code teilen; Gast gibt einen Anzeigenamen ein und tritt der Reise bei.
3. Tagesaktivitäten mit Uhrzeit, Notiz und eingebettetem Google-Maps-Link planen.
4. Flüge, Unterkünfte, Tickets und andere Buchungsbestätigungen verwalten.
5. Gemeinsame oder private Packeinträge anlegen und abhaken.
6. Ausgaben mit zahlender Person und Beteiligten erfassen.
7. Wetter für das Reiseziel ansehen und zum Reiseende eine Ausgleichsbilanz abrufen.

## Produktgrenzen

- Eine Währung je Reise.
- Online-first: zuletzt gelesene App-Inhalte können gecacht werden, Änderungen benötigen Internet.
- Google Maps wird über vom Nutzer eingefügte Links eingebettet und zusätzlich extern geöffnet; es wird kein API-Key verwendet.
- Wetterdaten stammen nicht-kommerziell von Open-Meteo und werden entsprechend gekennzeichnet.
- Keine Zahlungen, Chats, Push-Nachrichten, Belegscans oder vollständige Offline-Synchronisierung.

## Datenschutz und Sicherheit

- Reiseinhalte liegen ausschließlich in Supabase, nicht im öffentlichen GitHub-Repository.
- Row-Level Security erzwingt Mitgliedschaft und Privatsphäre serverseitig.
- Einladungen werden gehasht gespeichert, laufen ab und können widerrufen werden.
- Kurzcodes werden ausschließlich über eine rate-limit-fähige Edge Function eingelöst.
- Es werden keine Service-Role-Schlüssel im Browser oder Repository hinterlegt.
- Für den kostenlosen Betrieb sind regelmäßige manuelle Datenexporte vorgesehen.

## Akzeptanzkriterien

- Ein Gast kann ohne sichtbare Registrierung einer freigegebenen Reise beitreten.
- Fremde anonyme Sitzungen können weder Reisen erraten noch private Einträge abrufen.
- Änderungen zweier Geräte erscheinen zeitnah.
- Die Ausgabenbilanz gleicht alle Salden centgenau aus.
- Die App ist installierbar, responsiv, per Tastatur nutzbar und erklärt ihren Offline-Zustand.
