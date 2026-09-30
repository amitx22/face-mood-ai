import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { EMOTIONS, calculateEmotions, playMoodSound } from "../emotions";
import "./FaceExpression.css";

function FaceExpression() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothedScoresRef = useRef({});
  const lastDominantRef = useRef("neutral");
  const fpsCountRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });

  // Core State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasFace, setHasFace] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [dominantEmotion, setDominantEmotion] = useState(EMOTIONS.find((e) => e.id === "neutral"));
  const [emotionScores, setEmotionScores] = useState({});
  const [confidence, setConfidence] = useState(0);
  const [fps, setFps] = useState(0);
  const [videoResolution, setVideoResolution] = useState({ width: 1280, height: 720 });

  // Camera Devices
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // UI Preferences & Controls
  const [showMesh, setShowMesh] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  const [snapshotImg, setSnapshotImg] = useState(null);

  // Initialize baseline scores
  useEffect(() => {
    const initial = {};
    EMOTIONS.forEach((e) => {
      initial[e.id] = e.id === "neutral" ? 100 : 0;
    });
    smoothedScoresRef.current = initial;
    setEmotionScores(initial);
  }, []);

  // Fetch camera devices
  const loadCameraDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameraDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn("Could not enumerate camera devices:", e);
    }
  };

  // Start Camera Stream
  const initCameraStream = async (deviceId) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setVideoResolution({
              width: video.videoWidth || 1280,
              height: video.videoHeight || 720,
            });
            setIsLoading(false);
            setError("");
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings."
          : err.message || "Failed to access webcam."
      );
      setIsLoading(false);
    }
  };

  // Setup MediaPipe & Camera on mount
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        setIsLoading(true);
        setError("");

        // 1. Fileset resolver for WASM
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );

        if (!isMounted) return;

        // 2. FaceLandmarker with blendshapes & matrices
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });

        if (!isMounted) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;

        // 3. Load devices list & start camera
        await loadCameraDevices();
        if (isCameraActive) {
          await initCameraStream(selectedDeviceId);
        }
      } catch (err) {
        console.error("Setup error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load MediaPipe AI Vision models.");
          setIsLoading(false);
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, []);

  // Handle camera switch or toggle
  const handleDeviceChange = async (e) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    if (isCameraActive) {
      await initCameraStream(newDeviceId);
    }
  };

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setHasFace(false);
    } else {
      setIsCameraActive(true);
      await initCameraStream(selectedDeviceId);
    }
  };

  // Main Detection & Render Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let isRunning = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d");
    const drawingUtils = new DrawingUtils(canvasCtx);

    const renderLoop = () => {
      if (!isRunning) return;

      const v = videoRef.current;
      const c = canvasRef.current;

      // Track FPS
      fpsCountRef.current.frames++;
      const now = performance.now();
      if (now - fpsCountRef.current.lastTime >= 1000) {
        setFps(Math.round((fpsCountRef.current.frames * 1000) / (now - fpsCountRef.current.lastTime)));
        fpsCountRef.current.frames = 0;
        fpsCountRef.current.lastTime = now;
      }

      if (v && c && faceLandmarkerRef.current && v.readyState >= 2) {
        if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
        }

        canvasCtx.clearRect(0, 0, c.width, c.height);

        if (v.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = v.currentTime;

          const results = faceLandmarkerRef.current.detectForVideo(v, performance.now());

          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            setHasFace(true);

            // Calculate 12 emotions
            const blendshapes = results.faceBlendshapes[0].categories;
            const parsed = calculateEmotions(blendshapes, sensitivity);

            if (parsed) {
              const prev = smoothedScoresRef.current;
              const alpha = 0.35;
              const smoothed = {};

              EMOTIONS.forEach((emo) => {
                const target = parsed.normalized[emo.id] || 0;
                const current = prev[emo.id] || 0;
                smoothed[emo.id] = current + alpha * (target - current);
              });

              smoothedScoresRef.current = smoothed;
              setEmotionScores({ ...smoothed });

              let highestId = "neutral";
              let highestScore = -1;
              EMOTIONS.forEach((emo) => {
                if (smoothed[emo.id] > highestScore) {
                  highestScore = smoothed[emo.id];
                  highestId = emo.id;
                }
              });

              const dominantObj = EMOTIONS.find((e) => e.id === highestId) || EMOTIONS[EMOTIONS.length - 1];
              setDominantEmotion(dominantObj);
              setConfidence(Math.round(highestScore));

              if (highestId !== lastDominantRef.current && highestScore > 32) {
                lastDominantRef.current = highestId;
                if (isSoundEnabled) {
                  playMoodSound(dominantObj.soundFreq);
                }

                setMoodHistory((prevHistory) => [
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    emotion: dominantObj,
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    confidence: Math.round(highestScore),
                  },
                  ...prevHistory.slice(0, 7),
                ]);
              }
            }

            // Draw Face Mesh Wireframe Overlay
            if (showMesh && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0];

              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, {
                color: "rgba(255, 255, 255, 0.14)",
                lineWidth: 0.8,
              });

              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, {
                color: "rgba(255, 255, 255, 0.45)",
                lineWidth: 1.5,
              });

              const themeColor = dominantEmotion.color || "#06B6D4";
              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, {
                color: themeColor,
                lineWidth: 2,
              });
              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, {
                color: themeColor,
                lineWidth: 2,
              });
              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, {
                color: themeColor,
                lineWidth: 2,
              });
              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, {
                color: themeColor,
                lineWidth: 2,
              });

              drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
                color: "#FB7185",
                lineWidth: 2.2,
              });
            }
          } else {
            setHasFace(false);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, showMesh, sensitivity, isSoundEnabled, dominantEmotion.color]);

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!stageWrapperRef.current) return;
    if (!document.fullscreenElement) {
      stageWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch((err) => console.warn(err));
    }
  };

  // High-Res Snapshot Capture
  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    const overlayCanvas = canvasRef.current;
    if (!video || !video.videoWidth) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth;
    snapCanvas.height = video.videoHeight;
    const ctx = snapCanvas.getContext("2d");

    if (isMirrored) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -snapCanvas.width, 0, snapCanvas.width, snapCanvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    }

    if (showMesh && overlayCanvas) {
      if (isMirrored) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(overlayCanvas, -snapCanvas.width, 0, snapCanvas.width, snapCanvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(overlayCanvas, 0, 0, snapCanvas.width, snapCanvas.height);
      }
    }

    const bannerH = Math.max(70, Math.round(snapCanvas.height * 0.12));
    const bannerY = snapCanvas.height - bannerH;

    const grad = ctx.createLinearGradient(0, bannerY, snapCanvas.width, bannerY);
    grad.addColorStop(0, "rgba(8, 10, 18, 0.95)");
    grad.addColorStop(1, "rgba(18, 22, 38, 0.9)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, bannerY, snapCanvas.width, bannerH);

    ctx.fillStyle = dominantEmotion.color;
    ctx.fillRect(0, bannerY, snapCanvas.width, 4);

    const fontSize = Math.max(22, Math.round(bannerH * 0.38));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${dominantEmotion.emoji}  ${dominantEmotion.label} (${dominantEmotion.hindiLabel})`, 24, bannerY + bannerH * 0.62);

    ctx.font = `600 ${Math.max(14, Math.round(bannerH * 0.24))}px sans-serif`;
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.fillText(`Face Mood AI • ${new Date().toLocaleTimeString()}`, snapCanvas.width - 24, bannerY + bannerH * 0.62);

    const dataUrl = snapCanvas.toDataURL("image/png");
    setSnapshotImg(dataUrl);
  };

  return (
    <div
      className="mood-app-container"
      style={{
        "--theme-color": dominantEmotion.color,
        "--theme-glow": dominantEmotion.glowColor,
      }}
    >
      {/* Static Ambient Color Glow */}
      <div
        className="mood-ambient-glow"
        style={{
          backgroundColor: dominantEmotion.color,
          boxShadow: `0 0 200px ${dominantEmotion.glowColor}`,
        }}
      />

      <div className="mood-content-wrapper">
        {/* Navigation / Header */}
        <header className="mood-header">
          <div className="mood-logo-group">
            <div
              className="mood-logo-icon"
              style={{
                borderColor: `${dominantEmotion.color}50`,
                boxShadow: `0 0 15px ${dominantEmotion.glowColor}`,
              }}
            >
              {dominantEmotion.emoji}
            </div>
            <div>
              <h1 className="mood-header-title">
                Face Mood <span className="mood-gradient-text">AI</span>
                <span className="mood-header-badge">v2.0 Vision</span>
              </h1>
              <p className="mood-header-subtitle">
                Real-Time 478-Point Facial Expression & Mood Intelligence
              </p>
            </div>
          </div>

          <div className="mood-header-actions">
            <div className="mood-chip-badge">
              <span
                className="status-dot-static"
                style={{
                  backgroundColor: hasFace ? dominantEmotion.color : "#eab308",
                  boxShadow: hasFace ? `0 0 8px ${dominantEmotion.color}` : "0 0 6px #eab308",
                }}
              />
              <span>{hasFace ? "Face Tracked" : isCameraActive ? "Align Face in Center" : "Camera Paused"}</span>
            </div>

            <div className="mood-chip-badge">
              <span>⚡ {fps} FPS</span>
            </div>

            <div className="mood-chip-badge">
              <span>📐 {videoResolution.width}×{videoResolution.height}</span>
            </div>
          </div>
        </header>

        {/* Main Grid: Clean Left Camera Stage & Clean Right Expression Sidepanel */}
        <div className="mood-main-grid">
          {/* ==================================================== */}
          {/* LEFT: CLEAN STUDIO CAMERA SECTION (NO FLOATING PILL) */}
          {/* ==================================================== */}
          <div
            ref={stageWrapperRef}
            className={`mood-stage-card ${isFullscreen ? "is-fullscreen-mode" : ""}`}
            style={{
              borderColor: hasFace ? `${dominantEmotion.color}60` : "var(--card-border)",
            }}
          >
            {/* Viewport Frame Container */}
            <div className="mood-viewport-wrapper">
              {/* Corner Viewfinder Brackets */}
              <div className="reticle-bracket top-left" style={{ borderColor: dominantEmotion.color }} />
              <div className="reticle-bracket top-right" style={{ borderColor: dominantEmotion.color }} />
              <div className="reticle-bracket bottom-left" style={{ borderColor: dominantEmotion.color }} />
              <div className="reticle-bracket bottom-right" style={{ borderColor: dominantEmotion.color }} />

              {/* Top HUD Status Bar */}
              <div className="mood-camera-hud-top">
                <div className="hud-status-tag">
                  <span
                    className="hud-rec-dot"
                    style={{ backgroundColor: isCameraActive ? "#ef4444" : "#64748b" }}
                  />
                  <span>{isCameraActive ? "LIVE FEED" : "STANDBY"}</span>
                </div>

                <div className="hud-right-tags">
                  <button
                    className="hud-mini-btn"
                    onClick={handleToggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                  >
                    {isFullscreen ? "🗗 Exit" : "⛶ Fullscreen"}
                  </button>
                </div>
              </div>

              {/* Loading Screen */}
              {isLoading && (
                <div className="mood-loading-view">
                  <div className="mood-spinner" style={{ borderTopColor: dominantEmotion.color }} />
                  <p style={{ fontWeight: 600, color: "#cbd5e1" }}>Initializing MediaPipe AI Face Landmarker...</p>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Loading neural vision weights & webcam</span>
                </div>
              )}

              {/* Paused Screen */}
              {!isCameraActive && !isLoading && (
                <div className="mood-loading-view" style={{ background: "rgba(10, 12, 20, 0.95)" }}>
                  <div style={{ fontSize: "42px" }}>📹</div>
                  <p style={{ fontWeight: 700, fontSize: "17px", color: "#f1f5f9" }}>Camera Stream is Paused</p>
                  <button className="mood-btn mood-btn-primary" onClick={handleToggleCamera}>
                    <span>▶️ Resume Camera</span>
                  </button>
                </div>
              )}

              {/* Error Screen */}
              {error && (
                <div className="mood-loading-view" style={{ background: "rgba(35, 10, 15, 0.95)" }}>
                  <span style={{ fontSize: "32px" }}>⚠️</span>
                  <p style={{ color: "#ef4444", fontWeight: 700, fontSize: "15px" }}>Camera Access Error</p>
                  <p style={{ color: "#fca5a5", fontSize: "13px", maxWidth: "80%", textAlign: "center" }}>{error}</p>
                  <button className="mood-btn mood-btn-glass" onClick={() => initCameraStream(selectedDeviceId)}>
                    🔄 Retry Camera
                  </button>
                </div>
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`mood-video-element ${isMirrored ? "mood-video-mirrored" : ""}`}
              />

              {/* Landmark Canvas Element */}
              <canvas
                ref={canvasRef}
                className={`mood-canvas-overlay ${isMirrored ? "mood-video-mirrored" : ""}`}
              />

              {/* No Face Warning Alert (Top Centered) */}
              {!hasFace && isCameraActive && !isLoading && !error && (
                <div className="mood-noface-alert">
                  <span>👤</span>
                  <span>Face not detected • Please position your face in center</span>
                </div>
              )}
            </div>

            {/* Camera Control Deck */}
            <div className="mood-controls-toolbar">
              <div className="mood-controls-left">
                {/* Camera Power Toggle */}
                <button
                  className={`mood-btn mood-btn-glass ${isCameraActive ? "active" : ""}`}
                  onClick={handleToggleCamera}
                  title="Turn Camera ON or OFF"
                >
                  <span>{isCameraActive ? "🔴" : "⚪"}</span>
                  <span>{isCameraActive ? "Camera ON" : "Camera OFF"}</span>
                </button>

                {/* Face Mesh Toggle */}
                <button
                  className={`mood-btn mood-btn-glass ${showMesh ? "active" : ""}`}
                  onClick={() => setShowMesh(!showMesh)}
                  title="Toggle 478-Point Face Mesh Wireframe"
                >
                  <span>🕸️</span>
                  <span>Face Mesh: {showMesh ? "ON" : "OFF"}</span>
                </button>

                {/* Mirror Toggle */}
                <button
                  className={`mood-btn mood-btn-glass ${isMirrored ? "active" : ""}`}
                  onClick={() => setIsMirrored(!isMirrored)}
                  title="Flip Video Feed Horizontally"
                >
                  <span>🪞</span>
                  <span>Mirror: {isMirrored ? "ON" : "OFF"}</span>
                </button>

                {/* Sound Chimes Toggle */}
                <button
                  className={`mood-btn mood-btn-glass ${isSoundEnabled ? "active" : ""}`}
                  onClick={() => {
                    setIsSoundEnabled(!isSoundEnabled);
                    if (!isSoundEnabled) playMoodSound(dominantEmotion.soundFreq);
                  }}
                  title="Toggle Audio Feedback Chimes on Mood Shifts"
                >
                  <span>{isSoundEnabled ? "🔔" : "🔕"}</span>
                  <span>Audio: {isSoundEnabled ? "ON" : "OFF"}</span>
                </button>

                {/* Camera Source Selector Dropdown */}
                {cameraDevices.length > 1 && (
                  <select
                    className="mood-select-device"
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    title="Select Camera Input"
                  >
                    {cameraDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        📷 {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mood-controls-right">
                {/* Sensitivity Slider */}
                <div className="mood-sensitivity-group">
                  <span>Sensitivity:</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.8"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="mood-slider"
                  />
                  <span className="mood-sens-val">{sensitivity.toFixed(1)}x</span>
                </div>

                {/* Snapshot Capture */}
                <button
                  className="mood-btn mood-btn-primary"
                  onClick={handleTakeSnapshot}
                  disabled={!isCameraActive || !hasFace}
                  title="Capture Instant Photo with Mood Stamp"
                >
                  <span>📸</span>
                  <span>Snap Mood</span>
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT: FIXED SIDEBAR EXPRESSION DASHBOARD           */}
          {/* ==================================================== */}
          <div className="mood-sidebar-card">
            {/* Live Detected Expression Hero Spotlight Card */}
            <div
              className="mood-dominant-hero"
              style={{
                borderColor: `${dominantEmotion.color}75`,
                boxShadow: `0 15px 40px -10px ${dominantEmotion.glowColor}`,
              }}
            >
              <div className="mood-hero-top">
                <span
                  className="mood-hero-tag"
                  style={{
                    backgroundColor: `${dominantEmotion.color}20`,
                    color: dominantEmotion.color,
                    border: `1px solid ${dominantEmotion.color}50`,
                  }}
                >
                  {dominantEmotion.tag || "Live Detected Expression"}
                </span>

                <span className="mood-hero-status-pill">
                  <span className="status-dot-static" style={{ backgroundColor: dominantEmotion.color }} />
                  Live Mood
                </span>
              </div>

              <div className="mood-hero-main">
                <div className="mood-hero-emoji-large">
                  {dominantEmotion.emoji}
                </div>
                <div className="mood-hero-details">
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                    <h2 className="mood-hero-title">{dominantEmotion.label}</h2>
                    <span className="mood-hero-hindi">({dominantEmotion.hindiLabel})</span>
                  </div>
                  <div className="mood-hero-conf-badge" style={{ color: dominantEmotion.color }}>
                    Confidence Strength: <strong>{confidence}%</strong>
                  </div>
                </div>
              </div>

              <p className="mood-hero-quote" style={{ borderColor: dominantEmotion.color }}>
                "{dominantEmotion.quote}"
              </p>

              <div className="mood-hero-meter-wrap">
                <div className="mood-hero-meter-label">
                  <span>Confidence Gauge</span>
                  <span style={{ color: dominantEmotion.color, fontWeight: 800 }}>{confidence}%</span>
                </div>
                <div className="mood-progress-track">
                  <div
                    className="mood-progress-fill"
                    style={{
                      width: `${confidence}%`,
                      backgroundColor: dominantEmotion.color,
                      boxShadow: `0 0 14px ${dominantEmotion.color}`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 12 Emotion Spectrum Breakdown List */}
            <div className="mood-breakdown-card">
              <div className="mood-section-header">
                <h3 className="mood-section-title">
                  <span>📊</span>
                  <span>Expression Spectrum List</span>
                </h3>
                <span className="mood-section-badge">12 Expressions</span>
              </div>

              <div className="mood-emotions-list">
                {EMOTIONS.map((emo) => {
                  const score = Math.round(emotionScores[emo.id] || 0);
                  const isDominant = dominantEmotion.id === emo.id;

                  return (
                    <div
                      key={emo.id}
                      className={`mood-emotion-item ${isDominant ? "is-dominant" : ""}`}
                      style={{
                        borderColor: isDominant ? `${emo.color}90` : undefined,
                        boxShadow: isDominant ? `0 4px 18px ${emo.glowColor}` : undefined,
                      }}
                      onClick={() => {
                        setDominantEmotion(emo);
                        if (isSoundEnabled) playMoodSound(emo.soundFreq);
                      }}
                      title={`Click to preview ${emo.label}`}
                    >
                      <div className="mood-item-header">
                        <div className="mood-item-label-group">
                          <span className="mood-item-emoji">{emo.emoji}</span>
                          <div className="mood-item-text-wrap">
                            <span className="mood-item-name">{emo.label}</span>
                            <span className="mood-item-hindi"> ({emo.hindiLabel})</span>
                          </div>
                        </div>
                        <span className="mood-item-pct" style={{ color: isDominant ? emo.color : "#94a3b8" }}>
                          {score}%
                        </span>
                      </div>

                      <div className="mood-progress-track">
                        <div
                          className="mood-progress-fill"
                          style={{
                            width: `${score}%`,
                            backgroundColor: emo.color,
                            opacity: isDominant ? 1 : 0.65,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Mood History Timeline */}
            {moodHistory.length > 0 && (
              <div className="mood-history-card">
                <div className="mood-section-header">
                  <h3 className="mood-section-title">
                    <span>⏱️</span>
                    <span>Recent Mood Shifts</span>
                  </h3>
                  <span className="mood-section-badge">{moodHistory.length} Shifts</span>
                </div>

                <div className="mood-history-timeline">
                  {moodHistory.map((item) => (
                    <div
                      key={item.id}
                      className="mood-history-badge"
                      style={{
                        borderColor: `${item.emotion.color}60`,
                        background: `${item.emotion.color}18`,
                      }}
                    >
                      <span>{item.emotion.emoji}</span>
                      <span style={{ color: item.emotion.color, fontWeight: 700 }}>{item.emotion.label}</span>
                      <span style={{ color: "#94a3b8", fontSize: "11px" }}>{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {snapshotImg && (
        <div className="snapshot-modal-overlay" onClick={() => setSnapshotImg(null)}>
          <div className="snapshot-modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "19px" }}>
                📸 Mood Snapshot Captured!
              </h3>
              <button
                className="mood-btn mood-btn-glass"
                style={{ padding: "4px 10px" }}
                onClick={() => setSnapshotImg(null)}
              >
                ✕
              </button>
            </div>

            <img src={snapshotImg} alt="Mood Snapshot" className="snapshot-preview-img" />

            <div className="snapshot-modal-actions">
              <button className="mood-btn mood-btn-glass" onClick={() => setSnapshotImg(null)}>
                Close
              </button>
              <a
                href={snapshotImg}
                download={`face-mood-${dominantEmotion.id}-${Date.now()}.png`}
                className="mood-btn mood-btn-primary"
                style={{ textDecoration: "none" }}
              >
                <span>💾 Download Photo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FaceExpression;