const karte = L.map('karte').setView([38.3452, -0.4810], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(karte);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sucht nach Name + Adresse, damit Google Maps den echten Eintrag (mit Bewertungen) findet.
const googleMaps = (o) => o.google_maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.name}, ${o.adresse}`)}`;

function links(o) {
  const a = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${text}</a>`;
  return [
    o.link && a(o.link, 'Website'),
    a(googleMaps(o), 'Google Maps'),
    a(`https://www.openstreetmap.org/directions?to=${o.lat}%2C${o.lon}`, 'Route (OSM)')
  ].filter(Boolean).join(' · ');
}

// Eigener Marker für unsere Unterkunft, damit man sie auf der Karte sofort findet.
const unterkunftIcon = L.divIcon({
  className: 'unterkunft-marker',
  html: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor"/></svg>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

function zeigeOrt(o, marker) {
  karte.setView([o.lat, o.lon], 17);
  marker.openPopup();
  document.getElementById('karte').scrollIntoView({ behavior: 'smooth' });
}

function popup(o) {
  const zeiten = (o.oeffnungszeiten || []).map((z) => `<li>${esc(z)}</li>`).join('');
  return `<strong>${esc(o.name)}</strong><br>${esc(o.adresse)}${zeiten ? `<ul class="zeiten">${zeiten}</ul>` : '<br>'}${links(o)}`;
}

const laden = (datei) => fetch(datei, { cache: 'no-cache' }).then((r) => r.json());

Promise.all([laden('data/orte.json'), laden('data/touren.json').catch(() => [])])
  .then(([orte, touren]) => {
    const liste = document.getElementById('orte');
    const filter = document.getElementById('filter');
    orte.sort((a, b) => Boolean(b.unterkunft) - Boolean(a.unterkunft));
    const eintraege = orte.map((o) => {
      const marker = L.marker([o.lat, o.lon], o.unterkunft ? { icon: unterkunftIcon, zIndexOffset: 1000 } : {}).addTo(karte).bindPopup(popup(o));
      const li = document.createElement('li');
      li.className = o.unterkunft ? 'ort unterkunft' : 'ort';
      li.innerHTML = `
        <div class="kat">${esc(o.unterkunft ? 'Unsere Unterkunft' : o.kategorie)}</div>
        <h2>${esc(o.name)}</h2>
        <div class="adr">${esc(o.adresse)}</div>
        ${o.oeffnungszeiten ? `<ul class="zeiten">${o.oeffnungszeiten.map((z) => `<li>${esc(z)}</li>`).join('')}</ul>` : ''}
        ${o.beschreibung ? `<p>${esc(o.beschreibung)}</p>` : ''}
        <div class="links">${links(o)}</div>
        ${o.nominiert_von ? `<div class="von">Nominiert von ${esc(o.nominiert_von)}</div>` : ''}`;
      li.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        zeigeOrt(o, marker);
      });
      liste.appendChild(li);
      return { o, marker, li };
    });

    if (eintraege.length) karte.fitBounds(L.featureGroup(eintraege.map((e) => e.marker)).getBounds().pad(0.2));

    function zeigeKategorie(k) {
      filter.querySelectorAll('button').forEach((x) => {
        x.classList.toggle('aktiv', x.textContent === k);
        x.setAttribute('aria-pressed', x.textContent === k);
      });
      eintraege.forEach(({ o, marker, li }) => {
        const sichtbar = k === 'Alle' || o.kategorie === k || o.unterkunft;
        li.hidden = !sichtbar;
        sichtbar ? marker.addTo(karte) : marker.remove();
      });
    }

    const kategorien = ['Alle', ...new Set(orte.filter((o) => !o.unterkunft).map((o) => o.kategorie))];
    kategorien.forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.className = k === 'Alle' ? 'aktiv' : '';
      b.setAttribute('aria-pressed', k === 'Alle');
      b.addEventListener('click', () => zeigeKategorie(k));
      filter.appendChild(b);
    });

    // Tagesausflüge: Schritte aus data/touren.json, verknüpft mit Orten über deren id.
    const proId = Object.fromEntries(eintraege.map((e) => [e.o.id, e]));
    const tourenListe = document.getElementById('touren');
    touren.forEach((t) => {
      const details = document.createElement('details');
      details.className = 'tour';
      details.innerHTML = `
        <summary><span class="kat">Tagesausflug</span><h2>${esc(t.titel)}</h2><div class="adr">${esc(t.untertitel)}</div></summary>
        <ol>${t.schritte.map((s) => `
          <li><strong>${esc(s.titel)}:</strong> ${esc(s.text)}
            ${proId[s.ort] ? `<button type="button" class="auf-karte" data-ort="${esc(s.ort)}">Auf der Karte</button>` : ''}</li>`).join('')}
        </ol>
        ${t.hinweis ? `<p class="hinweis">${esc(t.hinweis)}</p>` : ''}
        <button type="button" class="alle-zeigen">Alle Orte des Ausflugs zeigen</button>`;
      details.addEventListener('click', (e) => {
        const knopf = e.target.closest('button');
        if (!knopf) return;
        if (knopf.classList.contains('alle-zeigen')) {
          zeigeKategorie(t.kategorie);
          const marker = t.schritte.map((s) => proId[s.ort]?.marker).filter(Boolean);
          if (marker.length) karte.fitBounds(L.featureGroup(marker).getBounds().pad(0.2));
          document.getElementById('karte').scrollIntoView({ behavior: 'smooth' });
        } else {
          const { o, marker } = proId[knopf.dataset.ort];
          zeigeKategorie(t.kategorie);
          zeigeOrt(o, marker);
        }
      });
      tourenListe.appendChild(details);
    });
  });
