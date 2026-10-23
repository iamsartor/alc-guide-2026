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

function popup(o) {
  const zeiten = (o.oeffnungszeiten || []).map((z) => `<li>${esc(z)}</li>`).join('');
  return `<strong>${esc(o.name)}</strong><br>${esc(o.adresse)}${zeiten ? `<ul class="zeiten">${zeiten}</ul>` : '<br>'}${links(o)}`;
}

fetch('data/orte.json', { cache: 'no-cache' })
  .then((r) => r.json())
  .then((orte) => {
    const liste = document.getElementById('orte');
    const filter = document.getElementById('filter');
    const eintraege = orte.map((o) => {
      const marker = L.marker([o.lat, o.lon]).addTo(karte).bindPopup(popup(o));
      const li = document.createElement('li');
      li.className = 'ort';
      li.innerHTML = `
        <div class="kat">${esc(o.kategorie)}</div>
        <h2>${esc(o.name)}</h2>
        <div class="adr">${esc(o.adresse)}</div>
        ${o.oeffnungszeiten ? `<ul class="zeiten">${o.oeffnungszeiten.map((z) => `<li>${esc(z)}</li>`).join('')}</ul>` : ''}
        ${o.beschreibung ? `<p>${esc(o.beschreibung)}</p>` : ''}
        <div class="links">${links(o)}</div>
        ${o.nominiert_von ? `<div class="von">Nominiert von ${esc(o.nominiert_von)}</div>` : ''}`;
      li.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        karte.setView([o.lat, o.lon], 17);
        marker.openPopup();
        document.getElementById('karte').scrollIntoView({ behavior: 'smooth' });
      });
      liste.appendChild(li);
      return { o, marker, li };
    });

    if (eintraege.length) karte.fitBounds(L.featureGroup(eintraege.map((e) => e.marker)).getBounds().pad(0.2));

    const kategorien = ['Alle', ...new Set(orte.map((o) => o.kategorie))];
    kategorien.forEach((k) => {
      const b = document.createElement('button');
      b.textContent = k;
      b.className = k === 'Alle' ? 'aktiv' : '';
      b.setAttribute('aria-pressed', k === 'Alle');
      b.addEventListener('click', () => {
        filter.querySelectorAll('button').forEach((x) => {
          x.classList.toggle('aktiv', x === b);
          x.setAttribute('aria-pressed', x === b);
        });
        eintraege.forEach(({ o, marker, li }) => {
          const sichtbar = k === 'Alle' || o.kategorie === k;
          li.hidden = !sichtbar;
          sichtbar ? marker.addTo(karte) : marker.remove();
        });
      });
      filter.appendChild(b);
    });
  });
