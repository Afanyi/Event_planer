import { api } from "../api";
import type { Participant } from "../types";
import { useState } from "react";

// ==== Regex-Definitionen ====
// Name: "Vorname Nachname" (jeweils groß beginnend, erlaubt Bindestrich, Umlaute)
const NAME_REGEX =
  /^([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?)(\s+[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?)+$/u;

// Simple, robuste E-Mail-Prüfung (kein RFC-Overkill, aber praxistauglich)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ParticipantList({
  participants,
  onChanged,
}: {
  participants: Participant[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<{ code: number; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function addP(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const formEl = e.currentTarget;
      const form = new FormData(formEl);

      const name = String(form.get("name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();

      // ---- Clientseitige Validierung mit Regex ----
      if (!NAME_REGEX.test(name)) {
        setError({
          code: 400,
          message:
            "Ungültiger Name. Verwende bitte Vor- und Nachname (z. B. „Max Mustermann“). Bindestriche sind erlaubt.",
        });
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        setError({
          code: 400,
          message: "Ungültige E-Mail-Adresse.",
        });
        return;
      }

      const res: unknown = await api("/participants", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });

      // Wenn api() eine fetch-Response zurückgibt -> HTTP-Status auswerten
      if (res && typeof res === "object" && "ok" in (res as Response)) {
        const response = res as Response;

        if (!response.ok) {
          let msg = "";
          try {
            const data = await response.json();
            msg = (data as any)?.error ?? "";
          } catch {
            // ignore JSON parse errors
          }
          setError({
            code: response.status,
            message: msg || response.statusText || "Request failed",
          });
          return;
        }
        formEl.reset();
        onChanged();
        return;
      }

      // Fallback: api() lieferte direkt JSON mit error-Feld
      if (res && typeof res === "object" && "error" in (res as any)) {
        setError({
          code: 400,
          message: (res as any).error || "Bad Request",
        });
        return;
      }

      formEl.reset();
      onChanged();
    } catch (err: any) {
      setError({
        code: 0,
        message: err?.message || "Network error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h3>👥 Participants</h3>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          style={{
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #b84a4a",
            background: "#2a0f0f",
            color: "#ffd9d9",
            fontSize: 14,
          }}
        >
          ⚠️ {error.code ? `HTTP ${error.code}: ` : ""}
          {error.message}
        </div>
      )}

      <form className="row" onSubmit={addP} noValidate>
        <input
          name="name"
          placeholder="Name"
          required
          // HTML5-Validierung als Ergänzung
          pattern={NAME_REGEX.source}
          title="Vor- und Nachname, jeweils groß beginnend (z. B. „Max Mustermann“)."
        />
        <input
          name="email"
          placeholder="Email"
          required
          pattern={EMAIL_REGEX.source}
          title="Gültige E-Mail-Adresse (z. B. name@example.com)."
        />
        <button disabled={submitting}>{submitting ? "Adding…" : "Add"}</button>
      </form>

      <ul>
        {participants.map((p) => (
          <li key={p._id}>
            {p.name} — <span style={{ opacity: 0.7 }}>{p.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
