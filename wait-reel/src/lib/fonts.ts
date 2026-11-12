import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// Montserrat (variable) covers the full Kazakh Cyrillic set: ә ғ қ ң ө ұ ү һ і
export const FONT = "Montserrat";

let fontPromise: Promise<void> | null = null;
export const ensureFonts = () => {
  if (!fontPromise) {
    fontPromise = Promise.all(
      ["600", "700", "800", "900"].map((weight) =>
        loadFont({
          family: FONT,
          url: staticFile("fonts/Montserrat.ttf"),
          weight,
        }),
      ),
    ).then(() => undefined);
  }
  return fontPromise;
};

ensureFonts();

/** true once Montserrat is usable for <canvas> drawing; holds the render until then */
export const useFontsReady = () => {
  const [ready, setReady] = useState(
    () => typeof document !== "undefined" && document.fonts.check(`800 40px ${FONT}`),
  );
  useEffect(() => {
    if (ready) return;
    const h = delayRender("Loading Montserrat for canvas textures");
    ensureFonts()
      .then(() => document.fonts.load(`800 40px ${FONT}`))
      .then(() => {
        setReady(true);
        continueRender(h);
      });
  }, [ready]);
  return ready;
};
