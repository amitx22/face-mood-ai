export const EMOTIONS = [
  {
    id: "happy",
    label: "Happy",
    hindiLabel: "खुश",
    emoji: "😊",
    color: "#10B981", // Emerald Green
    secondaryColor: "#34D399",
    glowColor: "rgba(16, 185, 129, 0.4)",
    quote: "Keep smiling! Bahut acche lag rahe ho ✨",
    tag: "Positive Vibes",
    soundFreq: 587.33, // D5 note
  },
  {
    id: "excited",
    label: "Excited",
    hindiLabel: "उत्साहित / मस्त",
    emoji: "🤩",
    color: "#F59E0B", // Amber Gold
    secondaryColor: "#FBBF24",
    glowColor: "rgba(245, 158, 11, 0.45)",
    quote: "Party mood activated! Full of energy 🎉",
    tag: "High Energy",
    soundFreq: 783.99, // G5 note
  },
  {
    id: "sad",
    label: "Sad",
    hindiLabel: "उदास",
    emoji: "😢",
    color: "#3B82F6", // Ocean Blue
    secondaryColor: "#60A5FA",
    glowColor: "rgba(59, 130, 246, 0.4)",
    quote: "Cheer up! Sab theek ho jayega 💙",
    tag: "Low Mood",
    soundFreq: 293.66, // D4 note (gentle)
  },
  {
    id: "angry",
    label: "Angry",
    hindiLabel: "गुस्सा",
    emoji: "😠",
    color: "#EF4444", // Crimson Red
    secondaryColor: "#F87171",
    glowColor: "rgba(239, 68, 68, 0.45)",
    quote: "Take a deep breath! Shanti rakhein 🧊",
    tag: "Intense",
    soundFreq: 220.0, // A3 note (low tone)
  },
  {
    id: "surprised",
    label: "Surprised",
    hindiLabel: "हैरान / चकित",
    emoji: "😮",
    color: "#8B5CF6", // Purple
    secondaryColor: "#A78BFA",
    glowColor: "rgba(139, 92, 246, 0.45)",
    quote: "Whoa! Didn't see that coming? ⚡",
    tag: "Shock / Surprise",
    soundFreq: 659.25, // E5 note
  },
  {
    id: "scared",
    label: "Scared",
    hindiLabel: "डरा हुआ",
    emoji: "😨",
    color: "#6366F1", // Indigo
    secondaryColor: "#818CF8",
    glowColor: "rgba(99, 102, 241, 0.4)",
    quote: "Relax! Everything is completely safe 🛡️",
    tag: "Anxious",
    soundFreq: 440.0, // A4
  },
  {
    id: "disgusted",
    label: "Disgusted",
    hindiLabel: "घिन / अजीब",
    emoji: "🤢",
    color: "#84CC16", // Lime Green
    secondaryColor: "#A3E635",
    glowColor: "rgba(132, 204, 22, 0.4)",
    quote: "Yuck! Something smells or looks bad 🍋",
    tag: "Displeased",
    soundFreq: 311.13, // Eb4
  },
  {
    id: "winking",
    label: "Winking",
    hindiLabel: "मस्ती / आँख मारना",
    emoji: "😉",
    color: "#EC4899", // Pink
    secondaryColor: "#F472B6",
    glowColor: "rgba(236, 72, 153, 0.45)",
    quote: "Looking sharp! Giving that charming wink 😉",
    tag: "Playful / Flirty",
    soundFreq: 698.46, // F5
  },
  {
    id: "thinking",
    label: "Thinking",
    hindiLabel: "सोच में डूबा",
    emoji: "🤔",
    color: "#06B6D4", // Cyan
    secondaryColor: "#22D3EE",
    glowColor: "rgba(6, 182, 212, 0.4)",
    quote: "Deep in thoughts... Brain gears turning! 💡",
    tag: "Curious / Skeptical",
    soundFreq: 523.25, // C5
  },
  {
    id: "kiss",
    label: "Kiss / Pout",
    hindiLabel: "पाउट / प्यार",
    emoji: "😘",
    color: "#F43F5E", // Rose
    secondaryColor: "#FB7185",
    glowColor: "rgba(244, 63, 94, 0.45)",
    quote: "Selfie-ready pout! Sending positive love 💖",
    tag: "Affectionate",
    soundFreq: 622.25, // D#5
  },
  {
    id: "sleepy",
    label: "Sleepy",
    hindiLabel: "नींद / आलस",
    emoji: "😴",
    color: "#94A3B8", // Slate
    secondaryColor: "#CBD5E1",
    glowColor: "rgba(148, 163, 184, 0.35)",
    quote: "Time for a coffee or a quick power nap! ☕",
    tag: "Tired / Yawning",
    soundFreq: 261.63, // C4
  },
  {
    id: "neutral",
    label: "Neutral",
    hindiLabel: "शांत / सामान्य",
    emoji: "😐",
    color: "#64748B", // Cool Slate
    secondaryColor: "#94A3B8",
    glowColor: "rgba(100, 116, 139, 0.3)",
    quote: "Composed, calm and balanced. 🧘‍♂️",
    tag: "Balanced",
    soundFreq: 440.0,
  },
];

/**
 * Computes raw emotion scores from MediaPipe face blendshapes
 */
export function calculateEmotions(blendshapes, sensitivity = 1.0) {
  if (!blendshapes || blendshapes.length === 0) return null;

  const shapeMap = {};
  for (let i = 0; i < blendshapes.length; i++) {
    shapeMap[blendshapes[i].categoryName] = blendshapes[i].score;
  }

  const get = (name) => shapeMap[name] || 0;

  // Key blendshape features
  const smileL = get("mouthSmileLeft");
  const smileR = get("mouthSmileRight");
  const smile = (smileL + smileR) / 2;

  const frownL = get("mouthFrownLeft");
  const frownR = get("mouthFrownRight");
  const frown = (frownL + frownR) / 2;

  const browDownL = get("browDownLeft");
  const browDownR = get("browDownRight");
  const browDown = (browDownL + browDownR) / 2;

  const browInnerUp = get("browInnerUp");
  const browOuterUpL = get("browOuterUpLeft");
  const browOuterUpR = get("browOuterUpRight");
  const browOuterUp = (browOuterUpL + browOuterUpR) / 2;
  const browUp = (browInnerUp * 1.2 + browOuterUp) / 2.2;

  const eyeBlinkL = get("eyeBlinkLeft");
  const eyeBlinkR = get("eyeBlinkRight");
  const eyeBlink = (eyeBlinkL + eyeBlinkR) / 2;

  const eyeSquintL = get("eyeSquintLeft");
  const eyeSquintR = get("eyeSquintRight");
  const eyeSquint = (eyeSquintL + eyeSquintR) / 2;

  const eyeWideL = get("eyeWideLeft");
  const eyeWideR = get("eyeWideRight");
  const eyeWide = (eyeWideL + eyeWideR) / 2;

  const cheekSquintL = get("cheekSquintLeft");
  const cheekSquintR = get("cheekSquintRight");
  const cheekSquint = (cheekSquintL + cheekSquintR) / 2;

  const jawOpen = get("jawOpen");
  const mouthPress = (get("mouthPressLeft") + get("mouthPressRight")) / 2;
  const mouthPucker = get("mouthPucker");
  const mouthFunnel = get("mouthFunnel");
  const mouthShrugLower = get("mouthShrugLower");
  const mouthLowerDown = (get("mouthLowerDownLeft") + get("mouthLowerDownRight")) / 2;
  const mouthUpperUp = (get("mouthUpperUpLeft") + get("mouthUpperUpRight")) / 2;
  const noseSneer = (get("noseSneerLeft") + get("noseSneerRight")) / 2;
  const mouthStretch = (get("mouthStretchLeft") + get("mouthStretchRight")) / 2;

  // 1. EXCITED
  // Big smile combined with open mouth OR wide eyes OR high cheek lift
  let excited = 0;
  if (smile > 0.35 && (jawOpen > 0.22 || eyeWide > 0.2 || cheekSquint > 0.4)) {
    excited = (smile * 0.45 + jawOpen * 0.35 + eyeWide * 0.2 + cheekSquint * 0.25) * 1.35;
  }

  // 2. HAPPY
  // Warm smile + cheeks
  let happy = (smile * 0.8 + cheekSquint * 0.3) * (excited > 0.5 ? 0.55 : 1.25);

  // 3. SAD
  // Frown corners + inner brows raised (sadness triangle) + chin shrug / lower lip
  let sad = (frown * 1.6 + browInnerUp * 1.2 + mouthShrugLower * 0.9 + mouthLowerDown * 0.8) / 2.0;
  if (smile > 0.12) sad *= Math.max(0, 1 - smile * 3.0);
  if (browDown > 0.35 && browInnerUp < 0.3) sad *= 0.6; // Angry brows suppress sad

  // 4. ANGRY
  // Eyebrows furrowed down + eye squint + mouth press + nose sneer
  let angry = (browDown * 1.7 + eyeSquint * 0.6 + mouthPress * 0.8 + noseSneer * 0.6) / 2.1;
  if (smile > 0.15) angry *= Math.max(0, 1 - smile * 3.0);
  if (browInnerUp > 0.45 && browDown < 0.25) angry *= 0.4;

  // 5. SURPRISED
  // Jaw dropped + brows high + wide open eyes
  let surprised = (jawOpen * 0.85 + browUp * 1.1 + eyeWide * 1.0 + mouthFunnel * 0.7) / 2.3;
  if (smile > 0.4 && jawOpen > 0.3) surprised *= 0.5; // Happy laugh, not surprise

  // 6. SCARED / FEAR
  // Wide eyes + inner brows raised + mouth stretched
  let scared = (eyeWide * 1.2 + browInnerUp * 1.1 + mouthStretch * 1.0) / 2.3;
  if (smile > 0.2) scared *= 0.3;

  // 7. DISGUSTED
  // Wrinkled nose + raised upper lip + slight brow furrow
  let disgusted = (noseSneer * 1.6 + mouthUpperUp * 1.3 + browDown * 0.4) / 1.9;
  if (smile > 0.25) disgusted *= 0.35;

  // 8. WINKING
  let winking = 0;
  const blinkDiff = Math.abs(eyeBlinkL - eyeBlinkR);
  if (blinkDiff > 0.42 && (eyeBlinkL > 0.5 || eyeBlinkR > 0.5) && (eyeBlinkL < 0.35 || eyeBlinkR < 0.35)) {
    winking = blinkDiff * 1.4;
  }

  // 9. KISS / POUT
  let kiss = (mouthPucker * 1.5 + mouthFunnel * 0.5) * 1.1;
  if (smile > 0.25 || jawOpen > 0.35) kiss *= 0.3;

  // 10. THINKING / SKEPTICAL
  const browAsymmetry = Math.abs(browOuterUpL - browOuterUpR);
  let thinking = browAsymmetry * 1.6;
  if (browDown > 0.25 && (get("eyeLookUpLeft") > 0.3 || get("eyeLookUpRight") > 0.3)) {
    thinking += 0.45;
  }

  // 11. SLEEPY
  let sleepy = 0;
  if (eyeBlinkL > 0.42 && eyeBlinkR > 0.42 && eyeBlinkL < 0.88 && eyeBlinkR < 0.88 && smile < 0.2) {
    sleepy = (eyeBlink - 0.38) * 2.2;
  }
  if (jawOpen > 0.65 && browUp < 0.25 && smile < 0.2) {
    sleepy = Math.max(sleepy, jawOpen * 0.95); // Yawning
  }

  // Adjust for sensitivity factor
  const sens = Math.max(0.5, Math.min(2.0, sensitivity));
  excited *= sens;
  happy *= sens;
  sad *= sens;
  angry *= sens;
  surprised *= sens;
  scared *= sens;
  disgusted *= sens;
  winking *= sens;
  kiss *= sens;
  thinking *= sens;
  sleepy *= sens;

  // 12. NEUTRAL
  const maxActive = Math.max(
    excited,
    happy,
    sad,
    angry,
    surprised,
    scared,
    disgusted,
    winking,
    kiss,
    thinking,
    sleepy
  );

  let neutral = Math.max(0.05, 0.7 - maxActive * 0.85);

  const rawScores = {
    excited: Math.max(0, Math.min(1, excited)),
    happy: Math.max(0, Math.min(1, happy)),
    sad: Math.max(0, Math.min(1, sad)),
    angry: Math.max(0, Math.min(1, angry)),
    surprised: Math.max(0, Math.min(1, surprised)),
    scared: Math.max(0, Math.min(1, scared)),
    disgusted: Math.max(0, Math.min(1, disgusted)),
    winking: Math.max(0, Math.min(1, winking)),
    kiss: Math.max(0, Math.min(1, kiss)),
    thinking: Math.max(0, Math.min(1, thinking)),
    sleepy: Math.max(0, Math.min(1, sleepy)),
    neutral: Math.max(0, Math.min(1, neutral)),
  };

  // Convert to normalized percentage scores
  let totalScore = Object.values(rawScores).reduce((a, b) => a + b, 0);
  if (totalScore <= 0) totalScore = 1;

  const normalized = {};
  for (const key of Object.keys(rawScores)) {
    normalized[key] = (rawScores[key] / totalScore) * 100;
  }

  // Find dominant emotion
  let dominantId = "neutral";
  let maxVal = -1;
  for (const key of Object.keys(rawScores)) {
    if (rawScores[key] > maxVal) {
      maxVal = rawScores[key];
      dominantId = key;
    }
  }

  return {
    rawScores,
    normalized,
    dominantId,
    dominantEmotion: EMOTIONS.find((e) => e.id === dominantId) || EMOTIONS[EMOTIONS.length - 1],
    confidence: Math.min(100, Math.round(maxVal * 100)),
  };
}

/**
 * Plays a pleasant soft audio tone when mood shifts (Web Audio API)
 */
let audioCtx = null;
export function playMoodSound(frequency) {
  if (!frequency) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.36);
  } catch (e) {
    // Audio might be blocked if user has not interacted with DOM yet
  }
}
