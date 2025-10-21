// backend/src/services/weather.service.ts
import fetch from 'node-fetch';
//const fetch = require('node-fetch');

const OWM_BASE = process.env.OWM_BASE ?? 'https://api.openweathermap.org';
//const API_KEY = process.env.OWM_API_KEY!;
const API_KEY = '2c97e8e170ad99836a6e37a7fe103b7a';  // inoder to run tests faster without docker container
if (!API_KEY) throw new Error('Missing OWM_API_KEY');

type Geo = { lat: number; lon: number };

// simple in-memory cache
const cache = new Map<string, { expires: number; data: any }>();
const TTL_MS = 60 * 60 * 1000; // 1h

function getCache(key: string) {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.data;
    if (hit) cache.delete(key);
    return null;
}
function setCache(key: string, data: any) {
    cache.set(key, { expires: Date.now() + TTL_MS, data });
}

async function geocodeDirect(q: string): Promise<Geo | null> {
    const url = `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: number; lon: number }>;
    return arr?.[0] ? { lat: arr[0].lat, lon: arr[0].lon } : null;
}

/**
 * Geocode with fallback strategy:
 * 1) full string (sanitized) + ", Germany"
 * 2) `${postalCode} ${city}, Germany` if available
 * 3) `${city}, Germany` if available
 */
export async function geocodeLocation(raw: string, postalCode?: string, city?: string): Promise<Geo | null> {
    const key = `geo:${raw}|${postalCode}|${city}`;
    const cached = getCache(key);
    if (cached) return cached;

    // sanitize: collapse spaces, remove duplicated "…gasse Straße" etc.
    const q0 = raw
        .replace(/\s+/g, ' ')
        .replace(/\b(gasse|straße|strasse)\s+straße\b/gi, '$1')
        .trim();

    // try full + country
    let geo = await geocodeDirect(`${q0}, Germany`);
    if (geo) { setCache(key, geo); return geo; }

    // fallback: PLZ + City
    const zip = (postalCode || (q0.match(/\b(\d{5})\b/)?.[1]) || '').trim();
    const cty = (city || (q0.split(',').slice(-1)[0] ?? '').trim()).trim();
    if (zip && cty) {
        geo = await geocodeDirect(`${zip} ${cty}, Germany`);
        if (geo) { setCache(key, geo); return geo; }
    }

    // fallback: City only
    if (cty) {
        geo = await geocodeDirect(`${cty}, Germany`);
        if (geo) { setCache(key, geo); return geo; }
    }

    return null;
}

export async function getForecastSummary(lat: number, lon: number, dateISO: string) {
    const key = `fc:${lat.toFixed(3)},${lon.toFixed(3)}:${dateISO}`;
    const cached = getCache(key);
    if (cached) return cached;

    const url = `${OWM_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OWM forecast failed: ${res.status}`);
    const json = await res.json();

    // @ts-ignore
    const list: any[] = json.list ?? [];
    // seconds east of UTC (can be negative)
    // @ts-ignore
    const tzOffsetSec: number = json?.city?.timezone ?? 0;

    // helper to get YYYY-MM-DD in local city time
    const localDateStr = (unixSec: number) => {
        const d = new Date((unixSec + tzOffsetSec) * 1000);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const da = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
    };

    // Build items with local date string
    const enriched = list.map((it) => {
        const unix = it?.dt as number; // seconds
        return { ...it, __localDate: localDateStr(unix) };
    });

    // Filter by target local date (from UI)
    const target = dateISO.slice(0, 10);
    let dayItems = enriched.filter((it) => it.__localDate === target);

    // If still empty, we might be exactly at the edge; pick the closest day available
    if (dayItems.length === 0 && enriched.length > 0) {
        // choose the group whose date is closest to target
        const groups = enriched.reduce<Record<string, any[]>>((acc, it) => {
            (acc[it.__localDate] ||= []).push(it);
            return acc;
        }, {});
        const groupDates = Object.keys(groups).sort();
        // simple absolute difference in days
        const asTime = (s: string) => new Date(s + 'T00:00:00Z').getTime();
        const targetMs = asTime(target);
        let best = groupDates[0];
        let bestDiff = Math.abs(asTime(best) - targetMs);
        for (const gd of groupDates.slice(1)) {
            const diff = Math.abs(asTime(gd) - targetMs);
            if (diff < bestDiff) { best = gd; bestDiff = diff; }
        }
        dayItems = groups[best] || [];
    }

    if (dayItems.length === 0) {
        const msg = { available: false, note: 'No forecast for this date (likely beyond 5 days).' };
        setCache(key, msg);
        return msg;
    }

    const temps = dayItems.map((i) => i.main.temp as number).filter((n) => Number.isFinite(n));
    const icons = dayItems.map((i) => i.weather?.[0]?.icon as string).filter(Boolean);
    const descs = dayItems.map((i) => i.weather?.[0]?.description as string).filter(Boolean);
    const pop = dayItems.map((i) => i.pop ?? 0);

    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avgPop = Math.round((pop.reduce((a, b) => a + b, 0) / pop.length) * 100);
    const mode = (arr: string[]) =>
        arr.sort((a, b) => arr.filter((v) => v === b).length - arr.filter((v) => v === a).length)[0];

    const summary = {
        available: true,
        date: target,
        tempMin: Math.round(min),
        tempMax: Math.round(max),
        precipitationChance: avgPop,
        icon: mode(icons) ?? '01d',
        description: mode(descs) ?? 'clear sky',
        source: 'OpenWeatherMap 5-day/3-hour forecast (local-time aligned)',
    };

    setCache(key, summary);
    return summary;
}
