// All times in seconds, taken from word timestamps of voiceover.mp3
// (see src/captions.ts). Scene boundaries follow the meaning of the narration.

export const FPS = 30;
export const VOICE_DURATION = 94.93;
export const DURATION_FRAMES = Math.ceil(VOICE_DURATION * FPS);
/** last 3 seconds are a still frame */
export const FREEZE_AT = VOICE_DURATION - 3;

export const SCENES = {
  s1Sofa: 0, // «Бір нәрсе алайын деп орныңнан тұрып…»
  s2Threshold: 3.3, // «Табалдырықтан аттаған бойда тоқтап қаласың»
  s3Door: 9.78, // «Бұл сенің есің нашарлағаннан емес. Кінәлі — есік.»
  s4Brain: 13.78, // «Ми өміріңді … сахналарға бөліп сақтайды»
  s5Box: 25.9, // «Сен бөлмеден шыққанда … сақтап қояды»
  s6NewRoom: 32.0, // «Жаңа бөлмеге кірдің, жаңа сахна басталды…»
  s7Experiment: 44.66, // «Ғалымдар мұны тәжірибемен дәлелдеген…»
  s8Return: 60.5, // «Ал ең қызығы… бастаған бөлмеңе қайта бар… Ааа!»
  s9Carry: 73.76, // «Ал алдын ала сақтанғың келсе…»
  s10Cta: 82.7, // «Денең мен миың туралы… комментарийге жаза кетіңіз»
} as const;

export const T = {
  // scene 1–3 (house)
  standUp: 0.55,
  walkStart: 1.3,
  doorOpen1: 2.15,
  crossDoor1: 3.45,
  stop: 4.74, // «тоқтап» → record scratch
  doorClose1: 5.3,
  question: 6.4, // «Мен мұнда неге келдім?»
  doorGlow: 11.4,
  doorHit: 12.68, // «есік.»
  // scene 4–5 (brain)
  filmSplit: 17.4, // «бөлек-бөлек»
  newScene: 20.6, // «жаңа сахна»
  surroundings: 22.34, // «Айналаң өзгергенде»
  doorIcons: 24.6, // «есіктен өткенде»
  cardOut: 27.88, // «алдыңғы сахна бітті»
  lidClose: 29.88, // «жауып»
  stored: 30.92, // «сақтап қояды»
  // scene 6
  kitchenWalk: 32.6,
  newRoomWord: 37.0,
  lookAround: 40.33, // «айналаңа назар аударады»
  oldThought: 42.1, // «ал ескі ой жабылған қалтаның ішінде жатыр»
  // scene 7
  expPeople: 46.94,
  expTask: 49.64, // «тапсырманы есте сақтауды»
  expWalk: 49.9,
  expCross: 52.2, // «Есіктен өткендер»
  expResult: 56.28, // «ұмытқан»
  expDoor: 58.48, // «дәл есіктің өзі»
  // scene 8
  turnBack: 61.2,
  doorOpen2: 63.7,
  walkBack: 64.0, // «Ұмытып қалсаң, бастаған бөлмеңе қайта бар»
  boxOpen: 68.06, // «ашады»
  remember: 68.66, // «ойың өзінен-өзі есіңе түседі»
  aha: 71.2, // «Ааа, зарядтағышты…»
  // scene 9
  orbForm: 77.38, // «не алатыныңды іштей бір рет айтып ал»
  carryWalk: 79.6, // «Сонда ой жаңа сахнаға сенімен бірге өтеді»
  // scene 10
  subscribe: 86.3, // «парақшаға жазылып қойыңыз»
  comment: 87.84, // «Және … кім кінәлі …»
};

export const sceneAt = (t: number): number => {
  const starts = Object.values(SCENES);
  let idx = 0;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) idx = i;
  return idx + 1;
};
