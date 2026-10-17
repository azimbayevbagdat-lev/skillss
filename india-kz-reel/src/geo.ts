import { geoAzimuthalEqualArea, geoContains, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology, GeometryCollection } from "topojson-specification";
import countries50 from "world-atlas/countries-50m.json";
import land110 from "world-atlas/land-110m.json";
import { MAP_CY, W } from "./theme";

const topo = countries50 as unknown as Topology<{
  countries: GeometryCollection;
}>;
const all = feature(
  topo,
  topo.objects.countries,
) as FeatureCollection<Geometry>;

const byId = (id: string) => {
  const f = all.features.find((x) => String(x.id) === id);
  if (!f) throw new Error(`Country ${id} not found`);
  return f;
};

export const KZ = byId("398");
export const INDIA = byId("356");

const landTopo = land110 as unknown as Topology<{ land: GeometryCollection }>;
export const LAND = feature(
  landTopo,
  landTopo.objects.land,
) as FeatureCollection<Geometry>;

// ONE equal-area projection for everything, so projected areas are proportional to
// real areas and the India-over-Kazakhstan comparison stays honest.
export const projection = geoAzimuthalEqualArea()
  .rotate([-72, -36])
  .fitExtent(
    [
      [190, 640],
      [W - 190, 1460],
    ],
    { type: "FeatureCollection", features: [KZ, INDIA] },
  );

const pathGen = geoPath(projection);

export const KZ_D = pathGen(KZ) ?? "";
export const INDIA_D = pathGen(INDIA) ?? "";
export const LAND_D = pathGen(LAND) ?? "";

export type Pt = [number, number];
export const P = (lonlat: Pt): Pt => projection(lonlat) as Pt;

export const bboxOf = (f: Feature) => {
  const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
  return {
    x0,
    y0,
    x1,
    y1,
    w: x1 - x0,
    h: y1 - y0,
    cx: (x0 + x1) / 2,
    cy: (y0 + y1) / 2,
  };
};

export const KZ_BOX = bboxOf(KZ);
export const INDIA_BOX = bboxOf(INDIA);
export const KZ_CENTROID = pathGen.centroid(KZ) as Pt;
export const INDIA_CENTROID = pathGen.centroid(INDIA) as Pt;

// ---------- Camera ----------
export type Camera = { x: number; y: number; z: number };

export const CAM_BOTH: Camera = {
  x:
    (Math.min(KZ_BOX.x0, INDIA_BOX.x0) + Math.max(KZ_BOX.x1, INDIA_BOX.x1)) / 2,
  y:
    (Math.min(KZ_BOX.y0, INDIA_BOX.y0) + Math.max(KZ_BOX.y1, INDIA_BOX.y1)) / 2,
  z: 1,
};
export const CAM_KZ: Camera = {
  x: KZ_BOX.cx,
  y: KZ_BOX.cy,
  z: Math.min(900 / KZ_BOX.w, 700 / KZ_BOX.h),
};
export const CAM_INDIA: Camera = {
  x: INDIA_BOX.cx,
  y: INDIA_BOX.cy,
  z: Math.min(820 / INDIA_BOX.w, 820 / INDIA_BOX.h),
};

export const camTransform = (c: Camera) =>
  `translate(${W / 2} ${MAP_CY}) scale(${c.z}) translate(${-c.x} ${-c.y})`;

export const toScreen = (c: Camera, [x, y]: Pt): Pt => [
  W / 2 + (x - c.x) * c.z,
  MAP_CY + (y - c.y) * c.z,
];

export const lerpCam = (a: Camera, b: Camera, t: number): Camera => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t),
});

export const zoomCam = (c: Camera, k: number): Camera => ({ ...c, z: c.z * k });

// ---------- Sample points inside countries (world coords) ----------
const samplePoints = (f: Feature, step: number): Pt[] => {
  const [[lon0, lat0], [lon1, lat1]] = geoPath().bounds(f);
  const out: Pt[] = [];
  for (let lat = lat0; lat <= lat1; lat += step) {
    for (let lon = lon0; lon <= lon1; lon += step) {
      if (geoContains(f, [lon, lat])) out.push(P([lon, lat]));
    }
  }
  return out;
};

let kzPts: Pt[] | null = null;
let inPts: Pt[] | null = null;
export const kzPoints = () => (kzPts ??= samplePoints(KZ, 0.45));
export const indiaPoints = () => (inPts ??= samplePoints(INDIA, 0.45));

// ---------- Cities ----------
export const CITIES = {
  astana: { name: "Астана", ll: [71.43, 51.13] as Pt },
  almaty: { name: "Алматы", ll: [76.95, 43.24] as Pt },
  shymkent: { name: "Шымкент", ll: [69.6, 42.32] as Pt },
};

export const OTHER_CITIES: Pt[] = [
  [73.1, 49.8], // Қарағанды
  [57.2, 50.3], // Ақтөбе
  [51.9, 47.1], // Атырау
  [51.2, 43.65], // Ақтау
  [51.37, 51.23], // Орал
  [63.6, 53.2], // Қостанай
  [69.15, 54.87], // Петропавл
  [76.95, 52.29], // Павлодар
  [82.6, 49.95], // Өскемен
  [80.25, 50.41], // Семей
  [71.37, 42.9], // Тараз
  [65.5, 44.85], // Қызылорда
  [68.25, 43.3], // Түркістан
  [78.37, 45.0], // Талдықорған
  [67.7, 47.8], // Жезқазған
  [69.4, 53.28], // Көкшетау
  [74.98, 46.84], // Балқаш
];

// Rough centers of the big desert / semi-desert zones (lon, lat, radius in degrees)
export const DESERTS: { ll: Pt; r: number }[] = [
  { ll: [64.5, 43.2], r: 3.6 }, // Қызылқұм
  { ll: [61.5, 46.0], r: 3.2 }, // Арал Қарақұмы
  { ll: [56.5, 44.2], r: 3.2 }, // Үстірт
  { ll: [51.5, 46.4], r: 3.0 }, // Каспий маңы ойпаты
  { ll: [55.5, 47.6], r: 2.6 }, // Каспий маңы
  { ll: [69.5, 45.2], r: 2.6 }, // Мойынқұм
  { ll: [70.0, 46.8], r: 2.8 }, // Бетпақдала
  { ll: [76.0, 45.9], r: 2.4 }, // Сарыесік-Атырау
  { ll: [66.0, 47.0], r: 2.4 },
  { ll: [59.0, 48.4], r: 2.2 },
];

// Degree → world px helper (approximate, good enough for blob radii)
export const degToPx = (ll: Pt, deg: number) => {
  const a = P(ll);
  const b = P([ll[0], ll[1] + deg]);
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
};
