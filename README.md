# limits-band

Ein Claude-Code-Mod, der über dem Eingabefeld kompakt auf einer Zeile anzeigt, wie viel von deinen Limits verbraucht ist:

```
5h 42% ↻ 2h 15m  7d 85% ↻ 3d 4h  Kontext 35%  Kosten $1.23
```

- **5h / 7d**: Auslastung der Abo-Limits mit Zeit bis zum Reset (grün < 50 %, gelb ab 50 %, rot ab 80 %)
- **Kontext**: Füllstand des Kontextfensters der Session
- **Kosten**: bisherige Kosten der Session in US-Dollar
- `/limits` blendet die Zeile aus und wieder ein

## Installation

In einer Claude-Code-Session am Prompt:

```
/plugin install limits-band --marketplace fherberg/claudemod-limitsband
```

Oder aus einer Shell:

```bash
claude plugin marketplace add fherberg/claudemod-limitsband
claude plugin install limits-band@frank-mods --scope user
```

Das Repository ist privat: Der Rechner braucht Zugriff auf GitHub (z. B. über `gh auth login` oder gespeicherte Git-Zugangsdaten).

## Aktualisieren

```bash
claude plugin marketplace update frank-mods
claude plugin update limits-band@frank-mods
```
