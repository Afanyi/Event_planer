import React from 'react';
import type { WeatherSummary } from '../types';
import { api } from '../api'; // ⬅ use the same helper as EventForm/EventList

type Props = {
    eventId: string;
    /** YYYY-MM-DD (wird vom Backend so erwartet) */
    dateISO: string;
    /** Optional: kompaktes Rendering ohne Beschreibung */
    compact?: boolean;
};

type FetchError = { status?: number; message: string };

export default function WeatherBadge({ eventId, dateISO, compact = false }: Props) {
    const [data, setData] = React.useState<WeatherSummary | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<FetchError | null>(null);

    React.useEffect(() => {
        let aborted = false;
        setLoading(true);
        setErr(null);

        (async () => {
            try {
                // api() should prefix with VITE_API_BASE (e.g. http://localhost:4000/api)
                const res = await api(`/events/${eventId}/weather?date=${encodeURIComponent(dateISO)}`);
                if (!aborted) setData(res as WeatherSummary);
            } catch (e: any) {
                if (aborted) return;

                // Try to normalize backend error
                let status: number | undefined;
                let message = 'Unbekannter Fehler beim Abrufen der Wetterdaten.';

                // If your api() throws { status, body/text }, handle both JSON & text
                if (typeof e?.status === 'number') status = e.status;
                if (typeof e?.body === 'object' && e.body) {
                    message = (e.body.error || e.body.message || JSON.stringify(e.body));
                } else if (typeof e?.text === 'string') {
                    message = e.text;
                } else if (typeof e?.message === 'string') {
                    message = e.message;
                }

                setErr({ status, message });
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => { aborted = true; };
    }, [eventId, dateISO]);

    if (loading) return <span className="text-sm" style={{ opacity: 0.7 }}>Wetter lädt…</span>;

    if (err) {
        const prefix = err.status ? `Fehler ${err.status}: ` : '';
        return (
            <span className="text-sm" style={{ color: '#c33' }} title={`${prefix}${err.message}`}>
        {prefix}{err.message}
      </span>
        );
    }

    if (!data || !data.available)
        return <span className="text-sm" style={{ opacity: 0.7 }}>Keine Prognose</span>;

    const { tempMin, tempMax, precipitationChance, icon, description } = data;
    const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : undefined;

    return (
        <div
            className="row"
            style={{
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                width: 'fit-content',
            }}
            aria-label="Wettervorhersage"
            title={description || 'Wetter'}
        >
            {iconUrl && (
                <img src={iconUrl} alt={description ?? 'weather'} width={24} height={24} loading="lazy" />
            )}
            {!compact && description && (
                <span className="text-sm" style={{ whiteSpace: 'nowrap' }}>{description}</span>
            )}
            <span className="text-sm" style={{ fontWeight: 600 }}>
        {typeof tempMin === 'number' && typeof tempMax === 'number' ? `${tempMin}–${tempMax}°C` : '—'}
      </span>
            {typeof precipitationChance === 'number' && (
                <span className="text-xs" style={{ opacity: 0.75, whiteSpace: 'nowrap' }}>🌧 {precipitationChance}%</span>
            )}
        </div>
    );
}
