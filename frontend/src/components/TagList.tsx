import { api } from "../api";
import type { Tag } from "../types";
import { useState } from "react";

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*$/; // Wörter aus Buchstaben/Ziffern, separiert durch Space/-
const HEX6_RE = /^#[0-9A-Fa-f]{6}$/; // #rrggbb

export default function TagList({
  tags,
  onChanged,
}: {
  tags: Tag[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<{ code: number; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function addTag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") ?? "").trim();
    const color = String(form.get("color") ?? "").trim();

    // Zusätzliche, programmatische Validierung (unabhängig von HTML5-Pattern)
    if (name.length < 2 || name.length > 40 || !NAME_RE.test(name)) {
      setError({
        code: 400,
        message:
          'Ungültiger Tag-Name. 2–40 Zeichen; Buchstaben/Ziffern; Wörter mit Leerzeichen oder Bindestrich trennen (z. B. "High Priority", "UI-Design").',
      });
      // Browser-Validity setzen (optional, aber nice für sofortiges UI-Feedback)
      const nameInput = formEl.elements.namedItem(
        "name",
      ) as HTMLInputElement | null;
      if (nameInput) {
        nameInput.setCustomValidity(
          "2–40 Zeichen; Buchstaben/Ziffern; Wörter mit Leerzeichen oder Bindestrich trennen.",
        );
        nameInput.reportValidity();
        nameInput.setCustomValidity("");
      }
      return;
    }

    if (!HEX6_RE.test(color)) {
      setError({
        code: 400,
        message:
          "Ungültige Farbe. Verwende bitte das Format #rrggbb (z. B. #4f46e5).",
      });
      const colorInput = formEl.elements.namedItem(
        "color",
      ) as HTMLInputElement | null;
      if (colorInput) {
        colorInput.setCustomValidity(
          "Farbwert muss im Format #rrggbb (6-stellig) sein.",
        );
        colorInput.reportValidity();
        colorInput.setCustomValidity("");
      }
      return;
    }

    setSubmitting(true);
    try {
      const res: unknown = await api("/tags", {
        method: "POST",
        body: JSON.stringify({ name, color }),
      });

      // fetch Response?
      if (res && typeof res === "object" && "ok" in (res as Response)) {
        const response = res as Response;

        if (!response.ok) {
          let msg = "";
          try {
            const data = await response.json();
            msg = (data as any)?.error ?? "";
          } catch {
            /* ignore */
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

      // Fallback: { error }
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
      setError({ code: 0, message: err?.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h3>🏷️ Tags</h3>

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

      <form className="row" onSubmit={addTag} noValidate>
        <input
          name="name"
          placeholder="Name"
          required
          minLength={2}
          maxLength={40}
          pattern="^[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*$"
          title='2–40 Zeichen; Buchstaben/Ziffern; Wörter mit Leerzeichen oder Bindestrich trennen (z. B. "High Priority", "UI-Design").'
        />
        <input
          name="color"
          placeholder="#rrggbb"
          defaultValue="#4f46e5"
          required
          pattern="^#[0-9A-Fa-f]{6}$"
          title="6-stellige Hex-Farbe im Format #rrggbb (z. B. #4f46e5)."
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="row" style={{ marginTop: 8 }}>
        {tags.map((t) => (
          <span key={t._id} className="tag" style={{ background: t.color }}>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}
