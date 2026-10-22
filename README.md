# Alicante Guide 2026

Kleiner Reiseguide für unsere Freundesgruppe: eine Liste mit Orten in Alicante plus OpenStreetMap-Karte (Leaflet). Läuft über GitHub Pages.

## Neuen Ort hinzufügen

Alle Orte stehen in [`data/orte.json`](data/orte.json). Einfach einen Eintrag ergänzen:

```json
{
  "id": "kurzer-eindeutiger-name",
  "name": "Name des Ortes",
  "kategorie": "Markt | Café / Brunch | Restaurant | Strand | Sehenswürdigkeit | …",
  "adresse": "Straße Nr, PLZ Alicante",
  "lat": 38.345,
  "lon": -0.481,
  "oeffnungszeiten": ["Mo bis Fr: 09:00 bis 18:00"],
  "beschreibung": "Ein, zwei Sätze, warum wir hinwollen.",
  "link": "https://… (optional)",
  "google_maps": "https://maps.app.goo.gl/… (optional, sonst wird automatisch nach Name + Adresse gesucht)",
  "nominiert_von": "Name"
}
```

Koordinaten bekommt man auf openstreetmap.org per Rechtsklick → „Adresse anzeigen“ (oder in Google Maps per Rechtsklick).

## Lokal ansehen

```sh
python3 -m http.server
```

Dann http://localhost:8000 öffnen.

## GitHub Pages

Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)`.
