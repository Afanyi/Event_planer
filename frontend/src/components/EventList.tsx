import { api } from "../api";
import React from "react";
import WeatherBadge from "./WeatherBadge";
import type { Event, Participant, Tag, Ref } from "../types";
import { isPopulated, refId } from "../types";

type Props = {
  events: Event[]; // List of all events to display
  allTags: Tag[]; // Global list of all tags (for selection)
  allParticipants: Participant[]; // Global list of all participants (for selection)
  onChanged: () => void; // Callback after a change (e.g. tag added/deleted)
};

/**
 * Helper functions
 * ----------------
 * Used to safely handle both populated objects (Tag | Participant)
 * and plain string IDs in event references.
 */
function resolveTagDisplay(t: Ref<Tag>, all: Tag[]): Tag | null {
  if (isPopulated<Tag>(t)) return t; // Already populated object
  const found = all.find((x) => x._id === t); // Find by ID from global list
  return found ?? null;
}

function resolveParticipantDisplay(
  p: Ref<Participant>,
  all: Participant[],
): Participant | null {
  if (isPopulated<Participant>(p)) return p; // Already populated object
  const found = all.find((x) => x._id === p); // Find by ID from global list
  return found ?? null;
}

/**
 * EventList Component
 * -------------------
 * Displays a list of events with details, tags, participants, and weather.
 * Allows deleting events and dynamically adding/removing tags or participants.
 */
export default function EventList({
  events,
  allTags,
  allParticipants,
  onChanged,
}: Props) {
  /* --------------------- CRUD-like operations --------------------- */

  // Delete an event after confirmation
  async function remove(id: string) {
    if (!confirm("Delete event?")) return;
    await api(`/events/${id}`, { method: "DELETE" });
    onChanged(); // refresh list
  }

  // Add a tag to an event
  async function addTag(eventId: string, tagId: string) {
    await api(`/events/${eventId}/tags/${tagId}`, { method: "POST" });
    onChanged();
  }

  // Remove a tag from an event
  async function removeTag(eventId: string, tagId: string) {
    await api(`/events/${eventId}/tags/${tagId}`, { method: "DELETE" });
    onChanged();
  }

  // Add a participant to an event
  async function addPart(eventId: string, pid: string) {
    await api(`/events/${eventId}/participants/${pid}`, { method: "POST" });
    onChanged();
  }

  // Remove a participant from an event
  async function removePart(eventId: string, pid: string) {
    await api(`/events/${eventId}/participants/${pid}`, { method: "DELETE" });
    onChanged();
  }

  /* --------------------- Rendering the event list --------------------- */
  return (
    <div className="grid" style={{ gap: 8 }}>
      <h3 style={{ margin: 0 }}>📋 Events</h3>

      {/* If there are no events, show a placeholder message */}
      {events.length === 0 && (
        <p style={{ opacity: 0.7 }}>No events yet. Add one!</p>
      )}

      {/* Iterate through all events */}
      {events.map((e) => {
        const dateISO = (e.date ?? "").slice(0, 10); // Extract date part (YYYY-MM-DD)

        // Extract IDs from tag and participant references
        const eventTagIds = e.tags.map((t) => refId<Tag>(t));
        const eventPartIds = e.participants.map((p) => refId<Participant>(p));

        // Resolve full tag and participant objects for display
        const displayTags = e.tags
          .map((t) => resolveTagDisplay(t, allTags))
          .filter((x): x is Tag => !!x);

        const displayParts = e.participants
          .map((p) => resolveParticipantDisplay(p, allParticipants))
          .filter((x): x is Participant => !!x);

        /* --------------------- Event card --------------------- */
        return (
          <div key={e._id} className="card grid" style={{ gap: 8 }}>
            {/* Header section: title, date, location, delete button */}
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{e.title}</strong>
                <div style={{ opacity: 0.8 }}>
                  {new Date(e.date).toLocaleString()}
                </div>
                <div style={{ opacity: 0.8 }}>{e.location}</div>

                {/* 🎨 Freestyle Feature: Display weather info for this event */}
                {dateISO && (
                  <div style={{ marginTop: 6 }}>
                    <WeatherBadge eventId={e._id} dateISO={dateISO} />
                  </div>
                )}
              </div>

              {/* Delete event button */}
              <button onClick={() => remove(e._id)}>Delete</button>
            </div>

            {/* Optional description and image */}
            {e.description && <div>{e.description}</div>}
            {e.imageUrl && (
              <img
                src={e.imageUrl}
                alt="event"
                style={{ maxWidth: "100%", borderRadius: 8 }}
              />
            )}

            {/* ---------------- Tags Section ---------------- */}
            <div className="row">
              {/* Display current tags with remove option */}
              {displayTags.map((t) => (
                <span
                  key={t._id}
                  className="tag"
                  style={{ background: (t as any).color }}
                  onClick={() => removeTag(e._id, t._id)}
                  title="Remove tag"
                >
                  {t.name} ✖
                </span>
              ))}

              {/* Dropdown for adding new tags */}
              <select
                onChange={(ev) => {
                  const v = ev.target.value;
                  if (v) {
                    addTag(e._id, v);
                    ev.currentTarget.selectedIndex = 0; // reset select
                  }
                }}
              >
                <option value="">+ Add tag…</option>
                {allTags
                  .filter((t) => !eventTagIds.includes(t._id))
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* ---------------- Participants Section ---------------- */}
            <div className="row">
              {/* Display current participants with remove option */}
              {displayParts.map((p) => (
                <span
                  key={p._id}
                  className="badge"
                  onClick={() => removePart(e._id, p._id)}
                  title="Remove participant"
                >
                  {p.name} ✖
                </span>
              ))}

              {/* Dropdown for adding participants */}
              <select
                onChange={(ev) => {
                  const v = ev.target.value;
                  if (v) {
                    addPart(e._id, v);
                    ev.currentTarget.selectedIndex = 0; // reset select
                  }
                }}
              >
                <option value="">+ Add participant…</option>
                {allParticipants
                  .filter((p) => !eventPartIds.includes(p._id))
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
