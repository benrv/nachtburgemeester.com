import payload from '../data/cities.json';

export type Status = 'actief' | 'collectief' | 'vacant';

export interface Source {
  label: string;
  url: string;
  date: string | null;
  title: string;
}

export interface Photo {
  kind?: 'portrait' | 'city';
  src: string;
  alt: string;
  credit: string;
  license: string;
  licenseUrl: string;
  source: string;
}

export interface City {
  id: string;
  city: string;
  province: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  status: Status;
  name: string | null;
  role: string;
  since: string | null;
  website: string | null;
  tags: string[];
  blurb: string;
  sources: Source[];
  checked: string;
  verified: boolean;
  note: string | null;
  photo: Photo | null;
  alert: string | null;
  path: string;
}

export const meta = payload.meta;
export const cities = payload.cities as City[];
export const byId = new Map(cities.map((c) => [c.id, c]));
export const counts = meta.counts;

export const statusLabel: Record<Status, string> = {
  actief: 'Burgemeester',
  collectief: 'Collectief',
  vacant: 'Geen burgemeester'
};

export const statusPlural: Record<Status, string> = {
  actief: 'burgemeesters',
  collectief: 'collectieven',
  vacant: 'steden zonder burgemeester'
};

export const activeCities = cities.filter((c) => c.status === 'actief');
export const collectiveCities = cities.filter((c) => c.status === 'collectief');
export const vacantCities = cities.filter((c) => c.status === 'vacant');

export const getCity = (id: string) => byId.get(id);

export const formatDate = (date: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!date) return '—';
  const d = new Date(date.length === 4 ? `${date}-01-01T12:00:00` : `${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('nl-NL', opts).format(d);
};

export const shortDate = (date: string | null) => {
  if (!date) return '—';
  const d = new Date(date.length === 4 ? `${date}-01-01T12:00:00` : `${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d).replace(/\//g, '.');
};

export const cityHref = (city: City) => `/stad/${city.id}/`;

export const websiteLabel = (url: string | null) => {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

export const featuredCity = getCity('den-haag') ?? activeCities[0];
