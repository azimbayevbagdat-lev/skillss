import { RoundedBox } from "@react-three/drei";
import React from "react";
import * as THREE from "three";
import { Character, HOLD_PHONE, SIT } from "../lib/Character";
import { ChatMsg, ChatState, drawChat, Phone, CHAT_W } from "../lib/Phone";
import { Bubble3D, Clock3D, FloorLamp, Plant, QuestionMark, Sofa, Sparkles3D } from "../lib/props";
import { CamRig, KeyLight, Label, Stage } from "../lib/three";
import { kf, lerp, pop, prog, T, useT, wobble } from "../lib/time";

const CHAR_POS: [number, number, number] = [-0.2, 0.72, 0.12];
// phone placement in character space: screen faces the face (up/back)
const PHONE_LOCAL: [number, number, number] = [0, 0.36, 0.33];
// over-the-shoulder close-up camera; the phone screen is turned to face it
const CLOSE_CAM: [number, number, number] = [0.14, 1.8, 0.0];
const PHONE_ROT: [number, number, number] = (() => {
  const o = new THREE.Object3D();
  o.position.set(CHAR_POS[0] + PHONE_LOCAL[0], CHAR_POS[1] + PHONE_LOCAL[1], CHAR_POS[2] + PHONE_LOCAL[2]);
  o.up.set(0, 0.35, 1).normalize();
  o.lookAt(CLOSE_CAM[0], CLOSE_CAM[1] + 0.12, CLOSE_CAM[2] - 0.1);
  return [o.rotation.x, o.rotation.y, o.rotation.z];
})();

// world-space helpers
const phoneWorld = new THREE.Vector3(
  CHAR_POS[0] + PHONE_LOCAL[0],
  CHAR_POS[1] + PHONE_LOCAL[1],
  CHAR_POS[2] + PHONE_LOCAL[2],
);
const screenNormal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...PHONE_ROT));
const phoneUp = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(...PHONE_ROT));
phoneWorld.addScaledVector(phoneUp, 0.06).addScaledVector(screenNormal, 0.03);
const camOnPhone = (dist: number, side = 0, up = 0): [number, number, number] => {
  // dist scales the distance relative to the over-the-shoulder camera
  const right = new THREE.Vector3().crossVectors(phoneUp, screenNormal).normalize();
  const c = new THREE.Vector3(...CLOSE_CAM);
  const p = phoneWorld
    .clone()
    .lerp(c, dist)
    .addScaledVector(right, side)
    .addScaledVector(phoneUp, up);
  return [p.x, p.y, p.z];
};
const P: [number, number, number] = [phoneWorld.x, phoneWorld.y, phoneWorld.z];
const HEAD: [number, number, number] = [CHAR_POS[0], CHAR_POS[1] + 0.78, CHAR_POS[2]];

const blink = (t: number) => {
  const ph = (t + 0.7) % 3.3;
  return ph < 0.12 ? Math.sin((ph / 0.12) * Math.PI) : 0;
};

const mix3 = (a: number[], b: number[], x: number) =>
  [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)] as [number, number, number];

/* camera path: [time, pos, target, fov] */
type Key = [number, [number, number, number], [number, number, number], number, number?];
const CAM: Key[] = [
  // A: wide establishing shot, slow dolly in
  [0.0, [1.35, 1.72, 3.5], [-0.15, 1.12, 0.1], 34],
  [2.05, [0.9, 1.55, 2.6], [-0.2, 1.15, 0.2], 32],
  // B: cut to over-the-shoulder on the phone, slow push + orbit (scene 1 -> 2)
  [2.05, camOnPhone(1.12, 0.06, 0.0), P, 16, 1],
  [4.2, camOnPhone(1.0, 0.0, 0.0), P, 14.5, 1],
  [7.35, camOnPhone(1.04, -0.05, 0.02), [P[0], P[1] + 0.025, P[2] + 0.02], 17, 1],
  // C: cut to the impatient face + big clock
  [7.35, [0.3, 1.6, 1.75], [HEAD[0] + 0.08, HEAD[1] - 0.1, HEAD[2]], 30],
  [10.55, [0.12, 1.58, 1.42], [HEAD[0] + 0.06, HEAD[1] - 0.1, HEAD[2]], 30],
  // D: cut back to the phone for the swipe (scene 3)
  [10.55, camOnPhone(1.03, 0.03, 0.0), P, 15, 1],
  [12.3, camOnPhone(0.98, -0.03, 0.0), P, 14, 1],
  // E: cut wide for the big question, slow pull back
  [12.3, [0.62, 1.68, 2.15], [-0.1, 1.6, 0.2], 34],
  [13.9, [0.85, 1.74, 2.65], [-0.1, 1.62, 0.2], 34],
];

const camAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const x = b[0] - a[0] < 0.001 ? 1 : prog(t, a[0], b[0]);
  const drift = 0.012;
  const pos = mix3(a[1], b[1], x);
  pos[0] += wobble(t * 0.6, 1) * drift;
  pos[1] += wobble(t * 0.6, 2) * drift;
  const u = lerp(a[4] ?? 0, b[4] ?? 0, x);
  const up = mix3([0, 1, 0], [phoneUp.x, phoneUp.y, phoneUp.z], u);
  return { pos, target: mix3(a[2], b[2], x), fov: lerp(a[3], b[3], x), up };
};

const SHOP1 = "Стиль дүкені";
const SHOP2 = "Жылдам дүкен";
const ASK = "Бағасы қанша?";

export const RoomScenes: React.FC = () => {
  const t = useT();
  const cam = camAt(t);
  const onPhone = (t >= 2.05 && t < 7.35) || (t >= 10.55 && t < 12.3);

  /* ---------- phone UI state ---------- */
  const typed = Math.floor(kf(t, [1.95, 3.25], [0, ASK.length], (x) => x));
  const sent = t >= 3.42;
  const read = prog(t, 4.45, 4.75);
  const clockStr = t < 4.2 ? "21:14" : t < 7.35 ? "21:19" : "21:24";
  const chat1: ChatState = {
    shop: SHOP1,
    avatar: "#e2557a",
    status: t < 4.45 ? "онлайн" : "соңғы рет 21:14",
    clock: clockStr,
    input: sent ? "" : ASK.slice(0, typed),
    caret: !sent && t > 1.5 && Math.floor(t * 2.5) % 2 === 0,
    msgs: sent ? [{ me: true, text: ASK, time: "21:14", read, appear: prog(t, 3.42, 3.7) }] : [],
  };
  const swipe = prog(t, 10.65, 11.15);
  const reply = prog(t, 11.45, 11.7);
  const chat2: ChatState = {
    shop: SHOP2,
    avatar: "#20b486",
    status: "онлайн",
    clock: "21:25",
    input: "",
    msgs: [
      { me: true, text: ASK, time: "21:25", read: 1, appear: prog(t, 11.0, 11.25) },
      ...(reply > 0
        ? ([{ me: false, text: "Сәлеметсіз бе! 12 000 ₸. Тапсырыс береміз бе?", time: "21:25", appear: reply }] as ChatMsg[])
        : []),
    ],
  };
  const drawKey = [
    typed,
    sent,
    read.toFixed(2),
    clockStr,
    chat1.status,
    chat1.caret,
    swipe.toFixed(3),
    reply.toFixed(2),
    prog(t, 3.42, 3.7).toFixed(2),
    prog(t, 11.0, 11.25).toFixed(2),
  ].join("|");

  /* ---------- character animation ---------- */
  const typing = t > 1.9 && t < 3.35 ? 1 : 0;
  const tap = typing * Math.max(0, Math.sin(t * 22)) * 0.08;
  const impatient = prog(t, 7.2, 8.0) * (1 - prog(t, 10.5, 11.0));
  const happy = prog(t, 11.5, 11.9);
  const swipeArm = Math.sin(swipe * Math.PI) * 0.25;
  const footTap = impatient * Math.max(0, Math.sin(t * 13)) * 0.25;

  const pose = {
    ...SIT,
    kneeR: SIT.kneeR! - footTap,
    torsoPitch: 0.08 + impatient * 0.05,
    headPitch: 0.42 - impatient * 0.3 - happy * 0.1 + prog(t, 12.4, 13.0) * -0.2,
    headYaw: impatient * Math.sin(t * 1.3) * 0.12,
    headRoll: impatient * 0.12 - happy * 0.08,
    armL: { ...HOLD_PHONE.armL, wrist: HOLD_PHONE.armL.wrist + tap },
    armR: { ...HOLD_PHONE.armR, wrist: HOLD_PHONE.armR.wrist + tap * 0.7 + swipeArm, z: HOLD_PHONE.armR.z - swipeArm * 0.4 },
  };
  const expr = {
    brow: -0.9 * impatient + 0.2 * happy,
    smile: lerp(lerp(0.35, -0.55, impatient), 0.9, happy),
    eyesClosed: blink(t),
    look: [0, -0.6 + impatient * 0.7] as [number, number],
    mouthOpen: prog(t, 12.4, 12.7) * (1 - prog(t, 13.3, 13.7)) * 0.6,
  };

  /* ---------- clocks ---------- */
  const spin = Math.max(0, t - 4.25);
  const minuteA = spin * Math.PI * 2 * 1.4 * (1 + spin * 0.12);
  const clockPhone = pop(t, 4.35) * (1 - prog(t, 10.4, 10.7));
  const clockBig = pop(t, 7.6, 0.5) * (1 - prog(t, 10.4, 10.7));
  const labelMin = t < 7.35 ? "5 минут" : "10 минут";
  const labelPop = t < 7.35 ? pop(t, 4.3) : pop(t, 7.42);

  /* ---------- 3D sent bubble ---------- */
  const fly = prog(t, 3.42, 4.1);
  const qm = pop(t, 12.45, 0.55);

  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} up={cam.up} />
      <Stage
        bg="#2a2238"
        focus={onPhone ? P : HEAD}
        focusRange={onPhone ? 0.5 : 0.9}
        bokeh={onPhone ? 3 : 4}
        bloom={0.6}
        bloomThreshold={1.05}
        fog={[8, 16]}
      >
        <ambientLight intensity={0.25} color="#ffe6d0" />
        <KeyLight position={[2.5, 4.2, 3]} intensity={2.2} target={[0, 0.8, 0]} />
        <directionalLight position={[-3, 2.5, -2]} intensity={1.0} color="#8fb3ff" />
        <FloorLamp position={[-1.55, 0, -0.75]} />
        {/* phone screen light on the face */}
        <pointLight position={[P[0], P[1] + 0.08, P[2] - 0.05]} intensity={0.35} distance={0.9} color="#b9b0ff" />

        {/* room */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 16]} />
          <meshPhysicalMaterial color="#8a5d3b" roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} />
        </mesh>
        <mesh position={[0, 0.006, 0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.6, 64]} />
          <meshPhysicalMaterial color="#e9dcc6" roughness={1} sheen={1} sheenColor="#fff" />
        </mesh>
        <mesh position={[0, 2.5, -1.15]} receiveShadow>
          <planeGeometry args={[16, 5]} />
          <meshStandardMaterial color="#d9cfe9" roughness={0.9} />
        </mesh>
        {/* wall art */}
        <RoundedBox args={[0.9, 0.62, 0.04]} radius={0.01} position={[0.55, 1.95, -1.12]} castShadow>
          <meshStandardMaterial color="#f7f3ea" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0.55, 1.95, -1.095]}>
          <planeGeometry args={[0.78, 0.5]} />
          <meshStandardMaterial color="#7b5cff" roughness={0.7} />
        </mesh>
        <mesh position={[0.4, 1.9, -1.09]}>
          <circleGeometry args={[0.14, 40]} />
          <meshStandardMaterial color="#ffb84a" roughness={0.7} />
        </mesh>
        <Sofa position={[0, 0, -0.5]} />
        <Plant position={[1.65, 0, -0.75]} scale={1.1} />
        {/* coffee table */}
        <group position={[0.15, 0, 1.15]}>
          <RoundedBox args={[1.1, 0.06, 0.6]} radius={0.025} position={[0, 0.42, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={1} />
          </RoundedBox>
          {[-0.45, 0.45].map((x) =>
            [-0.22, 0.22].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.2, z]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 10]} />
                <meshPhysicalMaterial color="#2b2b2b" metalness={0.8} roughness={0.3} />
              </mesh>
            )),
          )}
          <mesh position={[0.3, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.1, 24]} />
            <meshPhysicalMaterial color="#ff6f4f" roughness={0.3} clearcoat={1} />
          </mesh>
        </group>

        <Character
          position={CHAR_POS}
          pose={pose}
          expr={expr}
          shirt="#ff6f4f"
        />
        <group position={CHAR_POS}>
          <group position={PHONE_LOCAL} rotation={PHONE_ROT}>
           <group position={[0, 0.06, 0.03]}>
            <Phone
              draw={(ctx) => {
                if (swipe <= 0) drawChat(ctx, chat1);
                else {
                  drawChat(ctx, chat1, -swipe * CHAT_W);
                  drawChat(ctx, chat2, (1 - swipe) * CHAT_W);
                }
              }}
              drawKey={drawKey}
              glow={0.92}
            />
            {/* thumb doing the swipe */}
            {swipe > 0 && swipe < 1 ? (
              <mesh position={[lerp(0.03, -0.03, swipe), -0.01, 0.018]} rotation={[0, 0, 0.5]}>
                <capsuleGeometry args={[0.009, 0.03, 6, 12]} />
                <meshPhysicalMaterial color="#d9996f" roughness={0.55} />
              </mesh>
            ) : null}
            {/* 3D bubble flying out of the screen when sent */}
            {fly > 0 && fly < 1 ? (
              <Bubble3D
                text={ASK}
                width={0.42}
                scale={0.12 * (0.6 + 0.6 * Math.sin(fly * Math.PI) + fly * 0.2)}
                position={[0.008, -0.03 + fly * 0.12, 0.01 + fly * 0.14]}
                rotation={[-0.2 * fly, 0, 0.1 * fly]}
                glow={0.2}
              />
            ) : null}
            {/* clock above the phone */}
            {clockPhone > 0.01 ? (
              <Clock3D
                minuteAngle={minuteA}
                hourAngle={minuteA / 12}
                position={[0, 0.152, 0.03]}
                rotation={[0, 0, 0]}
                scale={0.055 * clockPhone}
              />
            ) : null}
            {labelPop > 0.01 && t < 8 ? (
              <group position={[0, 0.1, 0.035]} scale={labelPop}>
                <Label text={labelMin} size={0.018} color="#ffffff" bg="#e2557a" />
              </group>
            ) : null}
           </group>
          </group>
        </group>
        {/* big clock above the head in the wide shot */}
        {clockBig > 0.01 ? (
          <Clock3D
            minuteAngle={minuteA}
            hourAngle={minuteA / 12}
            position={[HEAD[0] + 0.3, HEAD[1] + 0.33, HEAD[2] + 0.15]}
            rotation={[0, -0.35 + wobble(t, 3) * 0.05, wobble(t * 3, 4) * 0.04 * (1 + spin * 0.2)]}
            scale={0.16 * clockBig}
          />
        ) : null}
        {qm > 0.01 ? (
          <>
            <QuestionMark
              position={[HEAD[0] + 0.05, HEAD[1] + 0.5 + wobble(t, 6) * 0.02, HEAD[2] + 0.1]}
              rotation={[0, Math.sin(t * 1.5) * 0.35, 0.08]}
              scale={0.95 * qm}
              emissive={0.9}
            />
            <Sparkles3D t={t} count={24} radius={0.55} position={[HEAD[0], HEAD[1] + 0.5, HEAD[2]]} opacity={qm} />
          </>
        ) : null}
      </Stage>
    </>
  );
};

export const ROOM_START = T.s1;
