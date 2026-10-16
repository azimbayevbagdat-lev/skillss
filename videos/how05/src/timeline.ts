import timing from "./timing.json";
import { FPS } from "./theme";

export type Word = { text: string; start: number; end: number };
export const WORDS: Word[] = timing.words;
export const HAS_VOICE: boolean = (timing as { hasVoice?: boolean }).hasVoice ?? false;
export const AUDIO_SECONDS: number = timing.duration;
export const TOTAL_FRAMES = Math.ceil((AUDIO_SECONDS + 1.5) * FPS);

/** Scene changes lead the trigger word by 3 frames. */
export const LEAD = 3;

export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[«»"?.,:!—]/g, "")
    .trim();

/** Index of the first word of the `nth` occurrence of `phrase` in the script. */
export const wordIndex = (phrase: string, nth = 0) => {
  const parts = phrase.split(/\s+/).map(norm).filter(Boolean);
  let seen = 0;
  for (let i = 0; i <= WORDS.length - parts.length; i++) {
    if (parts.every((p, k) => norm(WORDS[i + k].text) === p || (k === parts.length - 1 && norm(WORDS[i + k].text).startsWith(p)))) {
      if (seen === nth) return i;
      seen++;
    }
  }
  throw new Error(`Cue not found in script: "${phrase}" #${nth}`);
};

/** Frame a cue fires: trigger word start minus LEAD. */
export const cue = (phrase: string, nth = 0) => Math.max(0, Math.round(WORDS[wordIndex(phrase, nth)].start * FPS) - LEAD);
/** Frame the given word ends (no lead). */
export const cueEnd = (phrase: string, nth = 0) => Math.round(WORDS[wordIndex(phrase, nth)].end * FPS);

const s = (n: number) => Math.round(n * FPS);

// Scene and beat cues. Each entry names the spoken trigger from the brief.
export const T = {
  // 1. Intro: hovering car
  s1: 0,
  invert: cue("төңкеріліп"),
  // 2. Compressed air tanks
  s2: cue("Құпиясы"),
  tanks: cue("ыдыстарға"),
  litres: cue("алты жүз литр"),
  macro: cue("сығылған ауа"),
  // 3. Balloon analogy
  s3: cue("Үрленген"),
  untied: cue("байламай"),
  airOut: cue("ауа бір жаққа"),
  balloonFly: cue("ал шар қарсы"),
  roadsterToo: cue("Roadster да"),
  // 4. Cold gas thrusters and valve
  s4: cue("Көліктің астында"),
  thrusterTag: cue("суық газды"),
  valve: cue("Клапан"),
  valveShoot: cue("шүмектен төмен"),
  carUp: cue("ал көлік жоғары"),
  // 5. Thrust vs weight
  s5: cue("Итеру күші"),
  exceeds: cue("салмағынан асса"),
  lift: cue("көлік ауаға"),
  half: cue("Бірақ көтерілу"),
  // 6. Balance with ten thrusters
  s6: cue("Ауада теңселмей"),
  ten: cue("Сондықтан он итергіш"),
  pulses: cue("Олар қысқа-қысқа"),
  land: cue("Ал жерге қонарда"),
  // 7. Upside-down driving with fans
  s7: cue("Ал төңкеріліп"),
  fans: cue("Қуатты желдеткіштер"),
  lowP: cue("Астында қысым"),
  outerP: cue("ал сырттағы"),
  // 8. Fans vs thrusters, limited air
  s8: cue("Яғни"),
  limited: cue("Бірақ шардағыдай"),
  // 9. Not independently verified
  s9: cue("Айта кетейін"),
  unverified: cue("тәуелсіз"),
  // 10. CTA
  s10: cue("Комментке"),
  telegram: cue("Telegram"),
  next: TOTAL_FRAMES - s(1.5),
  end: TOTAL_FRAMES,
};

export const SCENES = [
  { id: 1, from: T.s1, label: "Кіріспе: көлік секіреді" },
  { id: 2, from: T.s2, label: "Сығылған ауа ыдыстары" },
  { id: 3, from: T.s3, label: "Шар аналогиясы" },
  { id: 4, from: T.s4, label: "Суық газды итергіш, клапан" },
  { id: 5, from: T.s5, label: "Итеру > Салмақ" },
  { id: 6, from: T.s6, label: "Тепе-теңдік, он итергіш, қону" },
  { id: 7, from: T.s7, label: "Төңкеріліп жүру: желдеткіштер" },
  { id: 8, from: T.s8, label: "Желдеткіш vs итергіш, ауа қоры" },
  { id: 9, from: T.s9, label: "Тәуелсіз тексерілмеген" },
  { id: 10, from: T.s10, label: "CTA" },
];
