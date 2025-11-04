import { Router } from "express";
import { events } from "./events";
import { tags } from "./tags";
import { participants } from "./participants";

export const router = Router();

/** Kleiner Helfer: Endpunkte eines Teilrouters sammeln (ohne Extra-Pakete) */
type RouteItem = { method: string; path: string };
function listFromRouter(base: string, r: Router): RouteItem[] {
  const out: RouteItem[] = [];
  const stack: any[] = (r as any).stack ?? [];

  for (const layer of stack) {
    if (layer?.route) {
      const methods = Object.keys(layer.route.methods || {}).map((m: string) =>
        m.toUpperCase(),
      );
      const sub = layer.route.path === "/" ? "" : layer.route.path; // '/' nicht doppeln
      const full = `/api${base}${sub}`;
      methods.forEach((m: string) => out.push({ method: m, path: full }));
    }
  }
  return out;
}

/** GET /api – listet alle verfügbaren API-Routen */
router.get("/", (_req, res) => {
  const routes: RouteItem[] = [
    { method: "GET", path: "/api/health" }, // liegt in createApp außerhalb dieses Routers
    ...listFromRouter("/events", events),
    ...listFromRouter("/tags", tags),
    ...listFromRouter("/participants", participants),
  ].sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
  );

  res.json({
    name: "Events Backend",
    count: routes.length,
    routes,
  });
});

router.use("/events", events);
router.use("/tags", tags);
router.use("/participants", participants);
