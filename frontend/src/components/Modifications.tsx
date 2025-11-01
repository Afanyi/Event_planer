// src/components/Modifications.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { api } from '../api';
import type { Tag, Participant, Event } from '../types';
import '../Modifications.css';

interface ModificationsProps {
    tags: Tag[];
    participants: Participant[];

    // Events optional: Wenn Parent nichts liefert, lädt die Komponente sie selbst.
    events?: Event[];

    // optionale Selektionen
    selectedTags?: string[];
    selectedParticipants?: string[];
    selectedEvents?: string[];

    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedParticipants: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedEvents?: React.Dispatch<React.SetStateAction<string[]>>;

    /** Optional: Parent kann nach Mutationen refetchen; wenn nicht vorhanden und events nicht geliefert, wird lokal neu geladen */
    onRefresh?: () => void;
}

type ToastKind = 'success' | 'error' | 'info';

/* ---------- Regeln & Helpers (wie im EventForm) ---------- */
const TITLE_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,:;!?\-()'"\/&]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;
const LOCATION_RE: RegExp =
    /^[A-Za-zÀ-ÖØ-öø-ÿ0-9](?:[A-Za-zÀ-ÖØ-öø-ÿ0-9 .,\-\/()]+[A-Za-zÀ-ÖØ-öø-ÿ0-9])?$/;
const PLZ_RE: RegExp = /^\d{5}$/;

function composeLocation(street: string, houseNumber: string, postalCode: string, city: string): string {
    return `${street} ${houseNumber}, ${postalCode} ${city}`.replace(/\s+/g, ' ').trim();
}
function parseLocation(loc: string) {
    const m = (loc || '').match(/^(.+?)\s+(\S+),\s*(\d{5})\s+(.+)$/);
    return {
        street: m?.[1] ?? '',
        houseNumber: m?.[2] ?? '',
        postalCode: m?.[3] ?? '',
        city: m?.[4] ?? '',
    };
}
function toLocalDatetimeInputValue(d = new Date()): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInputValue(v: string) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function Modifications(props: ModificationsProps) {
    /* ---------- sichere Defaults ---------- */
    const tags = props.tags ?? [];
    const participants = props.participants ?? [];

    const selectedTags = props.selectedTags ?? [];
    const selectedParticipants = props.selectedParticipants ?? [];

    const setSelectedTags = props.setSelectedTags;
    const setSelectedParticipants = props.setSelectedParticipants;
    const onRefresh = props.onRefresh;

    /* ---------- Events: Daten laden (Fallback) ---------- */
    const [ownEvents, setOwnEvents] = useState<Event[]>([]);
    const [evLoading, setEvLoading] = useState(false);
    const [evError, setEvError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const events: Event[] = Array.isArray(props.events) ? props.events : ownEvents;

    const fetchOwnEvents = useCallback(async () => {
        setEvLoading(true);
        setEvError(null);
        try {
            const res = await api('/events'); // GET /events
            const list: Event[] = Array.isArray(res) ? res : (res?.items ?? res?.events ?? res?.data ?? []);
            if (mountedRef.current) setOwnEvents(list);
        } catch (e) {
            console.error(e);
            if (mountedRef.current) setEvError('Events konnten nicht geladen werden.');
        } finally {
            if (mountedRef.current) setEvLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!Array.isArray(props.events)) {
            fetchOwnEvents();
        }
    }, [props.events, fetchOwnEvents]);

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    /* ---------- Events: Selektion (Fix: Fallback-State statt No-Op) ---------- */
    const hasExternalEventSelection =
        Array.isArray(props.selectedEvents) && typeof props.setSelectedEvents === 'function';

    const [ownSelectedEvents, setOwnSelectedEvents] = useState<string[]>([]);
    const selectedEvents: string[] = hasExternalEventSelection ? (props.selectedEvents as string[]) : ownSelectedEvents;
    const setSelectedEvents: React.Dispatch<React.SetStateAction<string[]>> =
        hasExternalEventSelection ? (props.setSelectedEvents as React.Dispatch<React.SetStateAction<string[]>>) : setOwnSelectedEvents;

    const refreshAfterMutation = useCallback((what?: 'events' | 'tags' | 'participants') => {
        // 1) Prefer parent-driven refetch if available
        if (onRefresh) {
            onRefresh();
            return;
        }
        if (what === 'events' && !Array.isArray(props.events)) {
            void fetchOwnEvents();
            return;
        }

        window.location.reload();
    }, [onRefresh, props.events, fetchOwnEvents]);


    /* ---------- Toast ---------- */
    const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
    const toastTimerRef = useRef<number | null>(null);
    function showToast(kind: ToastKind, msg: string, ms = 2600) {
        setToast({ kind, msg });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToast(null), ms);
    }
    useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current); }, []);

    /* ---------- Confirm Dialog ---------- */
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const confirmActionRef = useRef<(() => void) | null>(null);
    const confirmYesBtnRef = useRef<HTMLButtonElement | null>(null);

    function askConfirm(text: string, action: () => void) {
        setConfirmText(text);
        confirmActionRef.current = action;
        setConfirmOpen(true);
    }
    useEffect(() => {
        if (confirmOpen) confirmYesBtnRef.current?.focus();
    }, [confirmOpen]);

    /* ---------- Selektion + Prefill ---------- */
    const selectedTag = useMemo(
        () => (selectedTags.length === 1 ? tags.find(t => t._id === selectedTags[0]) : undefined),
        [selectedTags, tags]
    );
    const selectedPart = useMemo(
        () => (selectedParticipants.length === 1 ? participants.find(p => p._id === selectedParticipants[0]) : undefined),
        [selectedParticipants, participants]
    );
    const selectedEvent = useMemo(
        () => (selectedEvents.length === 1 ? events.find(e => e._id === selectedEvents[0]) : undefined),
        [selectedEvents, events]
    );

    // Tag state
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('');
    useEffect(() => {
        setTagName(selectedTag?.name ?? '');
        setTagColor(selectedTag?.color ?? '');
    }, [selectedTag]);

    // Participant state
    const [partName, setPartName] = useState('');
    const [partEmail, setPartEmail] = useState('');
    useEffect(() => {
        setPartName(selectedPart?.name ?? '');
        setPartEmail(selectedPart?.email ?? '');
    }, [selectedPart]);

    // Event state
    const [evTitle, setEvTitle] = useState('');
    const [evDateLocal, setEvDateLocal] = useState('');
    const [evStreet, setEvStreet] = useState('');
    const [evHouseNumber, setEvHouseNumber] = useState('');
    const [evPostalCode, setEvPostalCode] = useState('');
    const [evCity, setEvCity] = useState('');
    const [evImageUrl, setEvImageUrl] = useState('');
    const [evDescription, setEvDescription] = useState('');
    const updateMinDate = useMemo(() => toLocalDatetimeInputValue(), []);

    useEffect(() => {
        setEvTitle(selectedEvent?.title ?? '');
        setEvDateLocal(selectedEvent?.date ? toLocalDatetimeInputValue(new Date(selectedEvent.date)) : '');
        setEvImageUrl(selectedEvent?.imageUrl ?? '');
        setEvDescription(selectedEvent?.description ?? '');

        // Einzelteile nutzen, sonst aus location parsen
        const street = (selectedEvent as any)?.street ?? '';
        const houseNumber = (selectedEvent as any)?.houseNumber ?? '';
        const postalCode = (selectedEvent as any)?.postalCode ?? '';
        const city = (selectedEvent as any)?.city ?? '';
        if (street && houseNumber && postalCode && city) {
            setEvStreet(street);
            setEvHouseNumber(houseNumber);
            setEvPostalCode(postalCode);
            setEvCity(city);
        } else {
            const parsed = parseLocation(selectedEvent?.location ?? '');
            setEvStreet(parsed.street);
            setEvHouseNumber(parsed.houseNumber);
            setEvPostalCode(parsed.postalCode);
            setEvCity(parsed.city);
        }
    }, [selectedEvent]);

    /* ---------- Validierungen ---------- */
    const canUpdateTag =
        selectedTags.length === 1 &&
        selectedParticipants.length === 0 &&
        selectedEvents.length === 0 &&
        tagName.trim().length > 0;

    const canUpdatePart =
        selectedParticipants.length === 1 &&
        selectedTags.length === 0 &&
        selectedEvents.length === 0 &&
        partName.trim().length > 0;

    const canDeleteTags =
        selectedTags.length > 0 &&
        selectedParticipants.length === 0 &&
        selectedEvents.length === 0;

    const canDeleteParts =
        selectedParticipants.length > 0 &&
        selectedTags.length === 0 &&
        selectedEvents.length === 0;

    const canUpdateEvent =
        selectedEvents.length === 1 &&
        selectedTags.length === 0 &&
        selectedParticipants.length === 0 &&
        evTitle.trim().length >= 3 &&
        evTitle.trim().length <= 80 &&
        TITLE_RE.test(evTitle.trim()) &&
        evStreet.trim().length >= 2 &&
        evStreet.trim().length <= 80 &&
        evHouseNumber.trim().length >= 1 &&
        evHouseNumber.trim().length <= 10 &&
        PLZ_RE.test(evPostalCode.trim()) &&
        evCity.trim().length >= 2 &&
        evCity.trim().length <= 80;

    const canDeleteEvents =
        selectedEvents.length > 0 &&
        selectedTags.length === 0 &&
        selectedParticipants.length === 0;

    const typesSelected =
        (selectedTags.length > 0 ? 1 : 0) +
        (selectedParticipants.length > 0 ? 1 : 0) +
        (selectedEvents.length > 0 ? 1 : 0);

    const crossSelection =
        typesSelected > 1
            ? 'Bitte nicht Tags, Teilnehmer und Events gleichzeitig auswählen. Aktualisieren/Löschen ist immer nur für eine Art möglich.'
            : '';

    /* ---------- Mutationen ---------- */
    async function doDeleteTags() {
        try {
            await api('/tags', { method: 'DELETE', body: JSON.stringify({ ids: selectedTags }) });
            setSelectedTags([]);
            showToast('success', `${selectedTags.length} Tag(s) gelöscht.`);
            refreshAfterMutation('tags');
        } catch (e) {
            console.error(e);
            showToast('error', 'Löschen der Tags fehlgeschlagen.');
        }
    }

    async function doDeleteParticipants() {
        try {
            await api('/participants', { method: 'DELETE', body: JSON.stringify({ ids: selectedParticipants }) });
            setSelectedParticipants([]);
            showToast('success', `${selectedParticipants.length} Teilnehmer gelöscht.`);
            refreshAfterMutation('participants');
        } catch (e) {
            console.error(e);
            showToast('error', 'Löschen der Teilnehmer fehlgeschlagen.');
        }
    }

    async function doDeleteEvents() {
        try {
            await api('/events', { method: 'DELETE', body: JSON.stringify({ ids: selectedEvents }) });
            setSelectedEvents([]);
            showToast('success', `${selectedEvents.length} Event(s) gelöscht.`);
            refreshAfterMutation('events');
        } catch (e) {
            console.error(e);
            showToast('error', 'Löschen der Events fehlgeschlagen.');
        }
    }

    async function doUpdateTag() {
        if (!canUpdateTag) return;
        try {
            const id = selectedTags[0];
            await api(`/tags/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tagName.trim(),
                    color: tagColor.trim(),
                }),
            });
            showToast('success', 'Tag aktualisiert.');
            refreshAfterMutation('tags');
        } catch (e) {
            console.error(e);
            showToast('error', 'Aktualisierung des Tags fehlgeschlagen.');
        }
    }

    async function doUpdateParticipant() {
        if (!canUpdatePart) return;
        try {
            const id = selectedParticipants[0];
            await api(`/participants/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: partName.trim(),
                    email: partEmail.trim(),
                }),
            });
            showToast('success', 'Teilnehmer aktualisiert.');
            refreshAfterMutation('participants');
        } catch (e) {
            console.error(e);
            showToast('error', 'Aktualisierung des Teilnehmers fehlgeschlagen.');
        }
    }

    async function doUpdateEvent() {
        if (!canUpdateEvent) return;
        try {
            const id = selectedEvents[0];
            const location = composeLocation(evStreet.trim(), evHouseNumber.trim(), evPostalCode.trim(), evCity.trim());
            if (!LOCATION_RE.test(location)) {
                showToast('error', 'Adresse unzulässig. Erlaubt: Buchstaben/Ziffern . , - / ( ); keine führenden/abschließenden Symbole.');
                return;
            }
            await api(`/events/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: evTitle.trim(),
                    description: evDescription?.trim() ?? '',
                    imageUrl: evImageUrl?.trim() ?? '',
                    street: evStreet.trim(),
                    houseNumber: evHouseNumber.trim(),
                    postalCode: evPostalCode.trim(),
                    city: evCity.trim(),
                    location,
                    date: fromLocalInputValue(evDateLocal) || (selectedEvent?.date ?? ''),
                }),
            });
            showToast('success', 'Event aktualisiert.');
            refreshAfterMutation('events');
        } catch (e) {
            console.error(e);
            showToast('error', 'Aktualisierung des Events fehlgeschlagen.');
        }
    }

    /* ---------- UI ---------- */
    return (
        <div className="card">
            <h3>📝 Modifications</h3>

            {crossSelection && <div className="note warning">{crossSelection}</div>}

            {/* ====================== TAGS ====================== */}
            <section className="section">
                <div className="section-header">
                    <strong>Tags</strong>
                    <span className="badge">{selectedTags.length} ausgewählt</span>
                </div>

                <div className="list">
                    {tags.map(tag => (
                        <label key={tag._id} className="row">
                            <input
                                type="checkbox"
                                value={tag._id}
                                checked={selectedTags.includes(tag._id)}
                                onChange={() =>
                                    setSelectedTags(prev =>
                                        prev.includes(tag._id) ? prev.filter(id => id !== tag._id) : [...prev, tag._id]
                                    )
                                }
                                disabled={selectedParticipants.length > 0 || selectedEvents.length > 0}
                            />
                            <span className="tag" style={{ background: tag.color ?? undefined }}>{tag.name}</span>
                        </label>
                    ))}
                </div>

                <div className="actions">
                    <button
                        type="button"
                        className="btn danger"
                        disabled={!canDeleteTags}
                        onClick={() =>
                            askConfirm(
                                `Sollen wirklich ${selectedTags.length} Tag(s) gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`,
                                doDeleteTags
                            )
                        }
                    >
                        Löschen
                    </button>
                </div>

                {/* Update Tag */}
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Neuer Tag-Name"
                        value={tagName}
                        onChange={e => setTagName(e.target.value)}
                        disabled={selectedTags.length !== 1 || selectedParticipants.length > 0 || selectedEvents.length > 0}
                    />
                    <input
                        type="text"
                        placeholder="Farbe (z. B. #FFAA00 oder 'orange')"
                        value={tagColor}
                        onChange={e => setTagColor(e.target.value)}
                        disabled={selectedTags.length !== 1 || selectedParticipants.length > 0 || selectedEvents.length > 0}
                    />
                    <button
                        type="button"
                        className="btn"
                        disabled={!canUpdateTag}
                        onClick={() => askConfirm('Ausgewählten Tag aktualisieren?', doUpdateTag)}
                    >
                        Tag aktualisieren
                    </button>
                </div>
            </section>

            {/* ====================== TEILNEHMER ====================== */}
            <section className="section">
                <div className="section-header">
                    <strong>Teilnehmer</strong>
                    <span className="badge">{selectedParticipants.length} ausgewählt</span>
                </div>

                <div className="list">
                    {participants.map(p => (
                        <label key={p._id} className="row">
                            <input
                                type="checkbox"
                                value={p._id}
                                checked={selectedParticipants.includes(p._id)}
                                onChange={() =>
                                    setSelectedParticipants(prev =>
                                        prev.includes(p._id) ? prev.filter(id => id !== p._id) : [...prev, p._id]
                                    )
                                }
                                disabled={selectedTags.length > 0 || selectedEvents.length > 0}
                            />
                            <span>{p.name}</span>
                            {p.email && <span className="muted">&nbsp;·&nbsp;{p.email}</span>}
                        </label>
                    ))}
                </div>

                <div className="actions">
                    <button
                        type="button"
                        className="btn danger"
                        disabled={!canDeleteParts}
                        onClick={() =>
                            askConfirm(
                                `Sollen wirklich ${selectedParticipants.length} Teilnehmer gelöscht werden?`,
                                doDeleteParticipants
                            )
                        }
                    >
                        Löschen
                    </button>
                </div>

                {/* Update Participant */}
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Neuer Name"
                        value={partName}
                        onChange={e => setPartName(e.target.value)}
                        disabled={selectedParticipants.length !== 1 || selectedTags.length > 0 || selectedEvents.length > 0}
                    />
                    <input
                        type="email"
                        placeholder="Neue E-Mail"
                        value={partEmail}
                        onChange={e => setPartEmail(e.target.value)}
                        disabled={selectedParticipants.length !== 1 || selectedTags.length > 0 || selectedEvents.length > 0}
                    />
                    <button
                        type="button"
                        className="btn"
                        disabled={!canUpdatePart}
                        onClick={() => askConfirm('Ausgewählten Teilnehmer aktualisieren?', doUpdateParticipant)}
                    >
                        Teilnehmer aktualisieren
                    </button>
                </div>
            </section>

            {/* ====================== EVENTS ====================== */}
            <section className="section">
                <div className="section-header">
                    <strong>Events</strong>
                    <span className="badge">{selectedEvents.length} ausgewählt</span>
                </div>

                {/* Feedback fürs Laden/Fehler/leer */}
                {evLoading && <p className="muted">Lade Events…</p>}
                {evError && <div className="note warning">{evError}</div>}
                {!evLoading && !evError && events.length === 0 && (
                    <p className="muted">Keine Events gefunden.</p>
                )}

                <div className="list">
                    {events.map(ev => {
                        const labelDate = ev.date ? new Date(ev.date).toLocaleString('de-DE') : '—';
                        return (
                            <label key={ev._id} className="row">
                                <input
                                    type="checkbox"
                                    value={ev._id}
                                    checked={selectedEvents.includes(ev._id)}
                                    onChange={() =>
                                        setSelectedEvents(prev =>
                                            prev.includes(ev._id) ? prev.filter(id => id !== ev._id) : [...prev, ev._id]
                                        )
                                    }
                                    disabled={selectedTags.length > 0 || selectedParticipants.length > 0}
                                />
                                <span>{ev.title}</span>
                                <span className="muted">&nbsp;·&nbsp;{labelDate}</span>
                            </label>
                        );
                    })}
                </div>

                <div className="actions">
                    <button
                        type="button"
                        className="btn danger"
                        disabled={!canDeleteEvents}
                        onClick={() =>
                            askConfirm(
                                `Sollen wirklich ${selectedEvents.length} Event(s) gelöscht werden?`,
                                doDeleteEvents
                            )
                        }
                    >
                        Löschen
                    </button>
                </div>

                {/* Update Event – wie EventForm (ohne Tags/Teilnehmer) */}
                <div className="form-grid form-grid-ev">
                    <input
                        name="title"
                        placeholder="Title"
                        required
                        minLength={3}
                        maxLength={80}
                        pattern={TITLE_RE.source}
                        title="3–80 Zeichen; Buchstaben/Ziffern; Satzzeichen erlaubt (.,:;!?-()'&/); keine führenden/abschließenden Symbole."
                        value={evTitle}
                        onChange={(e) => setEvTitle(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />
                    <input
                        name="date"
                        type="datetime-local"
                        required
                        min={selectedEvents.length === 1 ? undefined : toLocalDatetimeInputValue()}
                        title="Datum und Uhrzeit wählen (bei neuen Events: nicht in der Vergangenheit)."
                        value={evDateLocal}
                        onChange={(e) => setEvDateLocal(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />

                    {/* Address (4 Felder) */}
                    <input
                        name="street"
                        placeholder="Street (e.g. Main Street)"
                        required
                        minLength={2}
                        maxLength={80}
                        value={evStreet}
                        onChange={(e) => setEvStreet(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />
                    <input
                        name="houseNumber"
                        placeholder="No."
                        required
                        minLength={1}
                        maxLength={10}
                        value={evHouseNumber}
                        onChange={(e) => setEvHouseNumber(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />
                    <input
                        name="postalCode"
                        placeholder="ZIP"
                        required
                        pattern="\d{5}"
                        title="5-stellige deutsche Postleitzahl"
                        value={evPostalCode}
                        onChange={(e) => setEvPostalCode(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />
                    <input
                        name="city"
                        placeholder="City (e.g. Berlin)"
                        required
                        minLength={2}
                        maxLength={80}
                        value={evCity}
                        onChange={(e) => setEvCity(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />

                    {/* Image URL */}
                    <input
                        name="imageUrl"
                        placeholder="Image URL (optional)"
                        value={evImageUrl}
                        onChange={(e) => setEvImageUrl(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />

                    {/* Description */}
                    <textarea
                        name="description"
                        placeholder="Description"
                        maxLength={500}
                        title="Max. 500 Zeichen"
                        value={evDescription}
                        onChange={(e) => setEvDescription(e.target.value)}
                        disabled={selectedEvents.length !== 1 || selectedTags.length > 0 || selectedParticipants.length > 0}
                    />

                    <button
                        type="button"
                        className="btn"
                        disabled={!canUpdateEvent}
                        onClick={() => askConfirm('Ausgewähltes Event aktualisieren?', doUpdateEvent)}
                    >
                        Event aktualisieren
                    </button>
                </div>
            </section>

            {/* Confirm Dialog */}
            {confirmOpen && (
                <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                    <div className="modal">
                        <h4 id="confirm-title">Bestätigen</h4>
                        <p>{confirmText}</p>
                        <div className="modal-actions">
                            <button className="btn ghost" onClick={() => setConfirmOpen(false)}>Abbrechen</button>
                            <button
                                ref={confirmYesBtnRef}
                                className="btn danger"
                                onClick={() => {
                                    setConfirmOpen(false);
                                    confirmActionRef.current?.();
                                }}
                            >
                                Ja, fortfahren
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.kind}`} role="status" aria-live="polite">
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
