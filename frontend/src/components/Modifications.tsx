import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import type { Tag, Participant } from '../types';
import '../Modifications.css'

interface ModificationsProps {
    tags: Tag[];
    participants: Participant[];
    selectedTags: string[];
    selectedParticipants: string[];
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedParticipants: React.Dispatch<React.SetStateAction<string[]>>;
    /** Optional: Parent kann nach Mutationen refetchen, sonst fallback reload */
    onRefresh?: () => void;
}

type ToastKind = 'success' | 'error' | 'info';

export function Modifications({
                                  tags,
                                  participants,
                                  selectedTags,
                                  selectedParticipants,
                                  setSelectedTags,
                                  setSelectedParticipants,
                                  onRefresh,
                              }: ModificationsProps) {

    /* ---------- Helper UI: Toast ---------- */
    const [toast, setToast] = useState<{ kind: ToastKind; msg: string } | null>(null);
    function showToast(kind: ToastKind, msg: string, ms = 2600) {
        setToast({ kind, msg });
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), ms);
    }

    /* ---------- Helper UI: Confirm Dialog ---------- */
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
    function askConfirm(text: string, action: () => void) {
        setConfirmText(text);
        setOnConfirm(() => action);
        setConfirmOpen(true);
    }

    /* ---------- Selektion + Prefill ---------- */
    const selectedTag = useMemo(
        () => (selectedTags.length === 1 ? tags.find(t => t._id === selectedTags[0]) : undefined),
        [selectedTags, tags]
    );
    const selectedPart = useMemo(
        () => (selectedParticipants.length === 1 ? participants.find(p => p._id === selectedParticipants[0]) : undefined),
        [selectedParticipants, participants]
    );

    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('');
    useEffect(() => {
        setTagName(selectedTag?.name ?? '');
        setTagColor(selectedTag?.color ?? '');
    }, [selectedTag]);

    const [partName, setPartName] = useState('');
    const [partEmail, setPartEmail] = useState('');
    useEffect(() => {
        setPartName(selectedPart?.name ?? '');
        setPartEmail(selectedPart?.email ?? '');
    }, [selectedPart]);

    /* ---------- Validierungen ---------- */
    const canUpdateTag = selectedTags.length === 1 && selectedParticipants.length === 0 && tagName.trim().length > 0;
    const canUpdatePart =
        selectedParticipants.length === 1 && selectedTags.length === 0 && partName.trim().length > 0;

    const canDeleteTags = selectedTags.length > 0 && selectedParticipants.length === 0;
    const canDeleteParts = selectedParticipants.length > 0 && selectedTags.length === 0;

    const crossSelection =
        (selectedTags.length > 0 && selectedParticipants.length > 0) ?
            'Bitte nicht Tag(s) und Teilnehmer gleichzeitig auswählen. Aktualisieren/Löschen ist immer nur für eine Art möglich.' : '';

    /* ---------- Mutationen ---------- */
    async function doDeleteTags() {
        try {
            await api('/tags', { method: 'DELETE', body: JSON.stringify({ ids: selectedTags }) });
            setSelectedTags([]);
            showToast('success', `${selectedTags.length} Tag(s) gelöscht.`);
            onRefresh ? onRefresh() : window.location.reload();
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
            onRefresh ? onRefresh() : window.location.reload();
        } catch (e) {
            console.error(e);
            showToast('error', 'Löschen der Teilnehmer fehlgeschlagen.');
        }
    }

    async function doUpdateTag() {
        if (!canUpdateTag) return;
        try {
            const id = selectedTags[0]; // genau 1 Tag
            await api(`/tags/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tagName.trim(),
                    color: tagColor.trim(),
                }),
            });
            showToast('success', 'Tag aktualisiert.');
            onRefresh ? onRefresh() : window.location.reload();
        } catch (e) {
            console.error(e);
            showToast('error', 'Aktualisierung des Tags fehlgeschlagen.');
        }
    }

    async function doUpdateParticipant() {
        if (!canUpdatePart) return;
        try {
            const id = selectedParticipants[0]; // genau 1 Teilnehmer
            await api(`/participants/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: partName.trim(),
                    email: partEmail.trim(),
                }),
            });
            showToast('success', 'Teilnehmer aktualisiert.');
            onRefresh ? onRefresh() : window.location.reload();
        } catch (e) {
            console.error(e);
            showToast('error', 'Aktualisierung des Teilnehmers fehlgeschlagen.');
        }
    }


    /* ---------- UI ---------- */
    return (
        <div className="card">
            <h3>📝 Modifications</h3>

            {crossSelection && <div className="note warning">{crossSelection}</div>}

            {/* Tags */}
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
                                disabled={selectedParticipants.length > 0} // block mixed selection
                            />
                            <span className="tag" style={{ background: tag.color }}>{tag.name}</span>
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
                        disabled={selectedTags.length !== 1 || selectedParticipants.length > 0}
                    />
                    <input
                        type="text"
                        placeholder="Neue Tag-Farbe (z.B. #FFAA00)"
                        value={tagColor}
                        onChange={e => setTagColor(e.target.value)}
                        disabled={selectedTags.length !== 1 || selectedParticipants.length > 0}
                    />
                    <button
                        type="button"
                        className="btn"
                        disabled={!canUpdateTag}
                        onClick={() =>
                            askConfirm('Ausgewählten Tag aktualisieren?', doUpdateTag)
                        }
                    >
                        Tag aktualisieren
                    </button>
                </div>
            </section>

            {/* Participants */}
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
                                disabled={selectedTags.length > 0} // block mixed selection
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
                        disabled={selectedParticipants.length !== 1 || selectedTags.length > 0}
                    />
                    <input
                        type="email"
                        placeholder="Neue E-Mail"
                        value={partEmail}
                        onChange={e => setPartEmail(e.target.value)}
                        disabled={selectedParticipants.length !== 1 || selectedTags.length > 0}
                    />
                    <button
                        type="button"
                        className="btn"
                        disabled={!canUpdatePart}
                        onClick={() =>
                            askConfirm('Ausgewählten Teilnehmer aktualisieren?', doUpdateParticipant)
                        }
                    >
                        Teilnehmer aktualisieren
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
                                className="btn danger"
                                onClick={() => {
                                    setConfirmOpen(false);
                                    onConfirm?.();
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
