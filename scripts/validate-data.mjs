#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const data = read('src/data/cities.json');
const map = read('src/data/map.json');
const culture = read('src/data/den-haag-culture.json');
const errors = [];
const warnings = [];
const statuses = new Set(['actief', 'collectief', 'vacant']);
const ids = new Set();

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());
const isSince = (v) => v === null || (typeof v === 'string' && /^\d{4}(-\d{2}){0,2}$/.test(v));

if (!map.paths?.length) errors.push('Kaart: geen paths');
if (!map.viewBox) errors.push('Kaart: geen viewBox');

for (const c of data.cities) {
  const where = c.id || c.city || 'onbekend';
  if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) errors.push(`${where}: ongeldige id`);
  if (ids.has(c.id)) errors.push(`${where}: dubbele id`);
  ids.add(c.id);
  if (!c.city || !c.province) errors.push(`${where}: stad/provincie ontbreekt`);
  if (!statuses.has(c.status)) errors.push(`${where}: ongeldige status ${c.status}`);
  if (!c.blurb || c.blurb.length < 20) errors.push(`${where}: blurb te kort`);
  if (!Array.isArray(c.tags) || c.tags.length < 2) errors.push(`${where}: minimaal 2 tags`);
  if (!Array.isArray(c.sources) || c.sources.length < 1) errors.push(`${where}: geen bron`);
  for (const s of c.sources || []) {
    if (!s.label || !s.url) errors.push(`${where}: bron zonder label/url`);
    if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${where}: bron-url niet http(s): ${s.url}`);
    if (s.date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s.date)) warnings.push(`${where}: bron-datum ${s.date} niet ISO`);
  }
  if (!isDate(c.checked)) errors.push(`${where}: checked geen ISO-datum`);
  if (!isSince(c.since)) errors.push(`${where}: since ongeldig (${c.since})`);
  if (c.status === 'actief' && !c.name) errors.push(`${where}: actief zonder naam`);
  if (c.status === 'collectief' && !c.name) errors.push(`${where}: collectief zonder naam`);
  if (c.status === 'vacant' && c.name) errors.push(`${where}: vacant met naam`);
  if (c.status === 'actief' && !c.since) warnings.push(`${where}: actief zonder since`);
  if (typeof c.x !== 'number' || typeof c.y !== 'number') errors.push(`${where}: x/y ontbreekt`);
  if (c.x < 0 || c.x > 1000 || c.y < 0 || c.y > 1200) errors.push(`${where}: x/y buiten kaart`);
  if (c.path !== `/stad/${c.id}/`) errors.push(`${where}: path klopt niet`);
  if (c.photo) {
    if (!c.photo.src || !c.photo.alt || !c.photo.credit || !c.photo.license) errors.push(`${where}: foto mist alt/credit/license`);
    if (c.photo.src?.startsWith('/') && !fs.existsSync(path.join(root, 'public', c.photo.src))) errors.push(`${where}: fotobestand mist ${c.photo.src}`);
  }
}

if (culture.city !== 'den-haag') errors.push('Cultuur: city moet den-haag zijn');
if (!isDate(culture.updated)) errors.push('Cultuur: updated geen ISO-datum');
if (!Array.isArray(culture.venues) || culture.venues.length < 3) errors.push('Cultuur: minimaal 3 plekken');
if (!Array.isArray(culture.events) || culture.events.length < 3) errors.push('Cultuur: minimaal 3 events');
const venueIds = new Set();
for (const v of culture.venues || []) {
  if (!v.id || !/^[a-z0-9-]+$/.test(v.id)) errors.push(`Cultuur ${v.id || '?'}: ongeldige id`);
  if (venueIds.has(v.id)) errors.push(`Cultuur ${v.id}: dubbele id`);
  venueIds.add(v.id);
  if (!v.name || !v.type || !v.address) errors.push(`Cultuur ${v.id}: naam/type/adres mist`);
  for (const key of ['website', 'agenda']) {
    if (!v[key] || !/^https?:\/\//.test(v[key])) errors.push(`Cultuur ${v.id}: ${key} ongeldig`);
  }
  if (!v.description || v.description.length < 30) errors.push(`Cultuur ${v.id}: beschrijving te kort`);
  if (!Array.isArray(v.tags) || v.tags.length < 2) errors.push(`Cultuur ${v.id}: minimaal 2 tags`);
}
let lastEvent = '';
for (const e of culture.events || []) {
  const where = e.title || e.date || '?';
  if (!isDate(e.date)) errors.push(`Cultuur ${where}: datum ongeldig`);
  if (!/^\d{2}:\d{2}$/.test(e.start || '')) errors.push(`Cultuur ${where}: starttijd ongeldig`);
  if (e.end && !/^\d{2}:\d{2}$/.test(e.end)) errors.push(`Cultuur ${where}: eindtijd ongeldig`);
  if (!e.title || !e.venue || !e.source) errors.push(`Cultuur ${where}: titel/venue/bron mist`);
  if (!venueIds.has(e.venue)) errors.push(`Cultuur ${where}: onbekende venue ${e.venue}`);
  if (e.locationVenue && !venueIds.has(e.locationVenue)) errors.push(`Cultuur ${where}: onbekende locationVenue ${e.locationVenue}`);
  for (const key of ['url', 'ticket']) if (e[key] && !/^https?:\/\//.test(e[key])) errors.push(`Cultuur ${where}: ${key} ongeldig`);
  const stamp = `${e.date}${e.start}`;
  if (stamp < lastEvent) warnings.push(`Cultuur ${where}: events niet chronologisch`);
  lastEvent = stamp;
}
for (const s of culture.sources || []) {
  if (!s.label || !/^https?:\/\//.test(s.url || '')) errors.push('Cultuur: bron ongeldig');
}

const counts = data.cities.reduce((acc, c) => { acc[c.status]++; return acc; }, { actief: 0, collectief: 0, vacant: 0 });
const metaCounts = data.meta.counts;
for (const key of ['actief', 'collectief', 'vacant']) {
  if (counts[key] !== metaCounts[key]) errors.push(`Meta-count ${key} klopt niet (${counts[key]} vs ${metaCounts[key]})`);
}
if (data.cities.length !== metaCounts.total) errors.push(`Meta-totaal klopt niet (${data.cities.length} vs ${metaCounts.total})`);

if (warnings.length) {
  console.warn(`\n⚠ ${warnings.length} waarschuwing(en):`);
  warnings.forEach(w => console.warn('  - ' + w));
}
if (errors.length) {
  console.error(`\n✖ ${errors.length} fout(en):`);
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
}
console.log(`✓ Data gevalideerd: ${data.cities.length} vermeldingen (${counts.actief} burgemeesters, ${counts.collectief} collectieven, ${counts.vacant} zonder), ${map.paths.length} kaartpaden, ${culture.venues.length} cultuurplekken en ${culture.events.length} events.`);
