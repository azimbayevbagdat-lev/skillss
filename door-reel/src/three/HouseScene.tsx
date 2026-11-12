import React from "react";
import { Easing, interpolate } from "remotion";
import { lerp, lerpAngle, pop, walkAlong } from "../lib/anim";
import { SCENES, T } from "../timeline";
import { Character } from "./Character";
import { BOX_POS, House, SOFA } from "./House";
import {
  Card,
  IdeaOrb,
  MemoryBox,
  QuestionMark,
  Sparkles,
  ThoughtBubble,
} from "./Props";

const ci = (t: number, inp: number[], out: number[]) =>
  interpolate(t, inp, out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

/** Where the character is and what he does, for every moment in the house scenes. */
export const characterAt = (t: number) => {
  // defaults
  let x = SOFA.x;
  let z = SOFA.z + 0.18;
  let rotY = 0;
  let walkDist = 0;
  let walk = 0;
  let sit = 0;
  let headYaw = 0;
  let headPitch = 0;
  let smile = 0.25;
  let surprise = 0;
  let holdR = 0;
  let cheer = 0;
  let scratch = 0;

  if (t < SCENES.s6NewRoom) {
    // scene 1-3: sofa → door → stops in room B
    sit = 1 - ci(t, [T.standUp, T.standUp + 0.75], [0, 1]);
    z = lerp(
      SOFA.z + 0.18,
      SOFA.z + 0.45,
      ci(t, [T.standUp, T.standUp + 0.75], [0, 1]),
    );
    const w = walkAlong(t, T.walkStart, T.stop - 0.05, [
      [SOFA.x, SOFA.z + 0.45],
      [-2.2, -0.6],
      [-0.8, 0.02],
      [0.6, 0.02],
      [1.35, 0.25],
    ]);
    if (t >= T.walkStart) {
      x = w.x;
      z = w.z;
      walkDist = w.dist;
      walk = w.speed;
      rotY = w.heading;
    }
    if (t >= T.stop - 0.05) {
      // turn a bit toward the camera, freeze, look around confused
      rotY = lerpAngle(
        Math.PI / 2,
        0.55,
        ci(t, [T.stop, T.stop + 0.9], [0, 1]),
      );
      surprise =
        ci(t, [T.stop, T.stop + 0.25], [0, 1]) *
        (1 - ci(t, [9.5, 10.2], [0, 0.6]));
      scratch = ci(t, [7.1, 7.6], [0, 1]) * (1 - ci(t, [9.6, 10.2], [0, 1]));
      headYaw =
        Math.sin((t - T.stop) * 1.6) *
        0.35 *
        ci(t, [T.question, T.question + 0.4], [0, 1]);
      headPitch = -0.08;
      smile = 0;
      // scene 3: he turns to look at the door
      const lookDoor = ci(t, [10.6, 11.6], [0, 1]);
      rotY = lerpAngle(rotY, -Math.PI / 2 + 0.25, lookDoor);
      headYaw = lerp(headYaw, 0, lookDoor);
    }
  } else if (t < SCENES.s8Return + 3.4) {
    // scene 6: walks deeper into the kitchen, looks around
    const w = walkAlong(t, T.kitchenWalk, T.kitchenWalk + 2.4, [
      [1.35, 0.25],
      [1.75, -0.35],
      [1.85, -0.95],
    ]);
    x = w.x;
    z = w.z;
    walkDist = w.dist;
    walk = w.speed;
    rotY = w.moving
      ? w.heading
      : lerpAngle(
          Math.PI * 0.95,
          0.45,
          ci(t, [T.kitchenWalk + 2.4, T.kitchenWalk + 3.4], [0, 1]),
        );
    if (t < T.kitchenWalk) rotY = 0.55;
    const look =
      ci(t, [T.lookAround, T.lookAround + 0.4], [0, 1]) *
      (1 - ci(t, [43.5, 44.3], [0, 1]));
    headYaw = Math.sin((t - T.lookAround) * 1.5) * 0.7 * look;
    headPitch = -0.05;
    smile = 0.35;
    // scene 8 start: «Ал ең қызығы…» – a thoughtful pause, turns to the door
    if (t >= SCENES.s8Return) {
      rotY = lerpAngle(
        0.45,
        -Math.PI * 0.62,
        ci(t, [T.turnBack, T.turnBack + 0.9], [0, 1]),
      );
      headPitch = -0.05;
      smile = 0.2;
    }
  } else if (t < SCENES.s9Carry) {
    // scene 8: walk back to room A, to the box
    const w = walkAlong(t, T.walkBack, 66.9, [
      [1.85, -0.95],
      [1.2, -0.1],
      [0.4, 0.0],
      [-0.75, 0.05],
      [-0.95, 0.8],
    ]);
    x = w.x;
    z = w.z;
    walkDist = w.dist;
    walk = w.speed;
    rotY = t < T.walkBack ? -Math.PI * 0.62 : w.heading;
    if (t >= 66.9) rotY = 0; // facing the box (+z), toward the camera
    const ahaK = ci(t, [T.aha - 0.1, T.aha + 0.25], [0, 1]);
    smile = lerp(0.15, 1, ahaK);
    surprise = ci(t, [T.boxOpen, T.boxOpen + 0.3], [0, 0.6]) * (1 - ahaK);
    cheer =
      ci(t, [T.aha, T.aha + 0.4], [0, 1]) * (1 - ci(t, [72.8, 73.6], [0, 1]));
    // turn toward camera when he remembers
    rotY = lerpAngle(rotY, 0.35, ci(t, [T.aha - 0.2, T.aha + 0.5], [0, 1]));
  } else {
    // scene 9-10: holds the idea orb, walks through the door into room B
    const w = walkAlong(t, T.carryWalk, 82.6, [
      [-0.95, 0.8],
      [-0.75, 0.05],
      [0.6, 0.02],
      [1.55, 0.35],
    ]);
    x = w.x;
    z = w.z;
    walkDist = w.dist;
    walk = w.speed;
    rotY =
      t < T.carryWalk
        ? lerpAngle(0.35, 0.25, ci(t, [74, 75], [0, 1]))
        : w.heading;
    holdR = ci(t, [T.orbForm - 0.4, T.orbForm + 0.3], [0, 1]);
    smile = 0.85;
    if (t > 82.6) {
      rotY = lerpAngle(Math.PI / 2, 0.15, ci(t, [82.6, 83.6], [0, 1]));
      holdR = 1;
    }
    headPitch = -0.05;
  }
  return {
    x,
    z,
    rotY,
    walkDist,
    walk,
    sit,
    headYaw,
    headPitch,
    smile,
    surprise,
    holdR,
    cheer,
    scratch,
  };
};

export const doorOpenAt = (t: number) => {
  if (t < SCENES.s6NewRoom) {
    return (
      ci(t, [T.doorOpen1, T.doorOpen1 + 0.8], [0, 1]) *
      (1 - ci(t, [T.doorClose1, T.doorClose1 + 0.9], [0, 1]))
    );
  }
  return ci(t, [T.doorOpen2, T.doorOpen2 + 0.7], [0, 1]);
};

export const HouseScene: React.FC<{ t: number }> = ({ t }) => {
  const c = characterAt(t);
  const doorGlow =
    t < SCENES.s4Brain
      ? ci(t, [T.doorGlow, T.doorHit], [0, 0.6]) +
        ci(t, [T.doorHit - 0.05, T.doorHit + 0.1], [0, 0.9]) *
          (1 - ci(t, [T.doorHit + 0.2, 13.7], [0, 0.6]))
      : 0;

  // question mark above head (scene 2-3)
  const q = pop(t, T.question, 0.5) * (1 - ci(t, [10.3, 10.8], [0, 1]));

  // scene 6: the forgotten thought, left behind the door in room A, sinks into the box
  const s6 = t >= SCENES.s6NewRoom && t < SCENES.s8Return;
  const thoughtSink = ci(t, [T.oldThought + 0.3, T.oldThought + 1.4], [0, 1]);
  const boxLidS6 = 1 - ci(t, [T.oldThought + 1.2, T.oldThought + 1.5], [0, 1]);
  // scene 8: box opens, the card rises
  const open8 =
    t >= SCENES.s8Return
      ? ci(t, [T.boxOpen - 0.1, T.boxOpen + 0.6], [0, 1])
      : 0;
  const rise =
    t >= SCENES.s8Return ? ci(t, [T.remember, T.remember + 1.4], [0, 1]) : 0;
  const cardGone = t >= SCENES.s9Carry ? 1 : 0;
  let boxOpen = 0;
  if (s6) boxOpen = boxLidS6;
  else if (t >= SCENES.s8Return) boxOpen = open8;
  const boxGlow = s6 ? 0.35 : open8 * (1 - ci(t, [72.5, 73.7], [0, 1]) * 0.6);

  // orb in hand (scene 9-10)
  const orbS = t >= SCENES.s9Carry ? pop(t, T.orbForm - 0.2, 0.6) : 0;

  return (
    <House
      doorOpen={doorOpenAt(t)}
      doorGlow={doorGlow}
      kitchenHighlight={
        ci(t, [T.lookAround, T.lookAround + 0.5], [0, 1]) *
        (1 - ci(t, [42.3, 43], [0, 1]))
      }
    >
      <Character
        {...c}
        handChild={
          <IdeaOrb
            position={[0, 0.06, 0.12]}
            scale={orbS}
            pulse={t * 3}
            faceRotY={-c.rotY + 0.4}
          />
        }
      />
      <QuestionMark
        position={[c.x, 2.05 + Math.sin(t * 2.2) * 0.03, c.z]}
        scale={q * 1.4}
        rotY={0.5}
        wobble={t * 2}
      />

      <MemoryBox position={BOX_POS} rotY={0.25} open={boxOpen} glow={boxGlow} />
      {/* scene 6: ghostly thought floating behind the door, then stored in the box */}
      {s6 ? (
        <ThoughtBubble
          position={[
            BOX_POS[0] + 0.05,
            lerp(1.75, 0.9, thoughtSink),
            BOX_POS[2] + 0.1,
          ]}
          scale={
            pop(t, SCENES.s6NewRoom + 0.4, 0.6) * lerp(1.1, 0.35, thoughtSink)
          }
          opacity={1 - ci(t, [T.oldThought + 1.1, T.oldThought + 1.3], [0, 1])}
          dim={0.45}
          faceRotY={0.3}
        />
      ) : null}
      {/* scene 8: the charger card comes back out, glowing */}
      {t >= SCENES.s8Return && !cardGone ? (
        <Card
          kind="charger"
          position={[
            BOX_POS[0] - rise * 0.32,
            lerp(0.75, 2.02, rise),
            BOX_POS[2] + 0.05 + rise * 0.1,
          ]}
          rotation={[0, 0.45, 0]}
          scale={rise > 0 ? 0.35 + rise * 0.45 : 0}
          glow={rise * (1 - ci(t, [72.6, 73.6], [0, 0.7]))}
          width={0.55}
        />
      ) : null}
      <Sparkles
        t={t}
        start={T.boxOpen}
        position={[BOX_POS[0], 0.95, BOX_POS[2]]}
        radius={0.8}
        count={30}
        life={1.8}
      />
      <Sparkles
        t={t}
        start={T.aha}
        position={[c.x, 1.9, c.z]}
        radius={0.6}
        count={20}
        life={1.2}
        color="#FFF3B0"
      />
    </House>
  );
};
