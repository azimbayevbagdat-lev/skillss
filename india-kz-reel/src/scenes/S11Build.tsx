import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { Tags } from "../components/Tags";
import { CITIES, OTHER_CITIES, P, Pt, kzPoints, toScreen } from "../geo";
import { C, GRAD, H, W } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease, sec } from "./common";

// «Ал мемлекетке қалаларды, жолдарды, су құбырлары мен электр станцияларын нөлден салу керек болар еді.»

// Spread-out new city sites: farthest-point sampling inside Kazakhstan
const pickSites = (n: number): Pt[] => {
  const pts = kzPoints();
  const existing = [
    ...Object.values(CITIES).map((c) => P(c.ll)),
    ...OTHER_CITIES.map(P),
  ];
  const chosen: Pt[] = [];
  const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (let k = 0; k < n; k++) {
    let best = pts[0];
    let bestD = -1;
    for (let i = 0; i < pts.length; i += 3) {
      const p = pts[i];
      const d =
        Math.min(...[...existing, ...chosen].map((q) => dist(p, q))) *
        (0.8 + 0.4 * random(`fp${i}`));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    chosen.push(best);
  }
  return chosen;
};

// Minimum spanning tree (Prim) → road network
const mst = (pts: Pt[]) => {
  const inTree = new Set([0]);
  const edges: [number, number][] = [];
  while (inTree.size < pts.length) {
    let best: [number, number] = [0, 0];
    let bd = Infinity;
    for (const i of inTree) {
      for (let j = 0; j < pts.length; j++) {
        if (inTree.has(j)) continue;
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d < bd) {
          bd = d;
          best = [i, j];
        }
      }
    }
    inTree.add(best[1]);
    edges.push(best);
  }
  return edges;
};

const Bolt: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <path
    d="M2 -14 L-8 2 L-1 2 L-4 14 L8 -3 L1 -3 Z"
    transform={`translate(${x} ${y}) scale(${s * 1.6})`}
    fill={C.heatHot}
    stroke="#fff"
    strokeWidth={0.6}
  />
);

export const S11Build: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, -1);
  const { sites, nodes, edges } = useMemo(() => {
    const s = pickSites(12);
    const n = [
      ...Object.values(CITIES).map((c) => P(c.ll)),
      ...OTHER_CITIES.map(P),
      ...s,
    ];
    return { sites: s, nodes: n, edges: mst(n) };
  }, []);
  const tCities = sec(0.95);
  const tRoads = sec(1.6);
  const tWater = sec(2.1);
  const tPower = sec(3.1);

  return (
    <AbsoluteFill>
      <KzMap cam={cam}>
        <Heat main={0.5} spread={0.25} />
      </KzMap>
      <svg
        width={W}
        height={H}
        style={{
          position: "absolute",
          inset: 0,
          filter: `drop-shadow(0 0 6px ${C.heatHot})`,
        }}
      >
        {edges.map(([a, b], i) => {
          const [x1, y1] = toScreen(cam, nodes[a]);
          const [x2, y2] = toScreen(cam, nodes[b]);
          const p = ease(frame, tRoads + i * 2, tRoads + i * 2 + 14);
          const water = i % 3 === 1;
          if (water && frame < tWater) return null;
          const pw = water ? ease(frame, tWater + i, tWater + i + 16) : p;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x1 + (x2 - x1) * pw}
              y2={y1 + (y2 - y1) * pw}
              stroke={water ? "#5fd4ff" : C.heatHot}
              strokeWidth={water ? 3 : 4}
              strokeDasharray={water ? "10 7" : undefined}
              strokeLinecap="round"
              opacity={0.95}
            />
          );
        })}
        {sites.map((p, i) => {
          const [x, y] = toScreen(cam, p);
          const s = ease(frame, tCities + i * 2, tCities + i * 2 + 8);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={9 * s}
              fill="#fff"
              stroke={C.heatHot}
              strokeWidth={4}
            />
          );
        })}
        {sites.slice(0, 6).map((p, i) => {
          const [x, y] = toScreen(cam, p);
          const s = ease(frame, tPower + i * 3, tPower + i * 3 + 8);
          return s > 0 ? <Bolt key={i} x={x + 22} y={y - 22} s={s} /> : null;
        })}
      </svg>
      <Header
        kicker="Мемлекет"
        title={"САЛУЫ\nКЕРЕК"}
        grad={GRAD.warm}
        kickerColor="#ffd37a"
      />
      <Tags
        items={["қалалар", "жолдар", "су құбыры", "электр станциялары"]}
        top={1330}
        border={C.heatHot}
        from={tCities}
        stagger={sec(0.6)}
      />
    </AbsoluteFill>
  );
};
