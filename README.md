# 🎭 Face Mood AI

> **Real-Time Facial Expression & Mood Intelligence powered by React, Vite and MediaPipe**

Face Mood AI is a real-time computer vision web application that analyzes facial expressions through your webcam and estimates your current facial mood using **MediaPipe Face Landmarker**.

The application processes facial blendshape data directly in the browser and provides a modern interactive dashboard with live face tracking, facial mesh visualization, emotion confidence scores, mood history, audio feedback, snapshots, and camera controls.

## 🚀 Live Demo

🌐 **Live Website:**
https://face-mood-ai.vercel.app/

## ✨ Features

* 🎥 **Real-Time Face Tracking**

  * Uses your webcam for live facial analysis.
  * Supports camera device selection when multiple cameras are available.

* 🧠 **AI Facial Expression Analysis**

  * Uses MediaPipe Face Landmarker and facial blendshapes.
  * Estimates **12 different facial expressions**.

* 😊 **12 Expression Categories**

  * 😊 Happy
  * 🤩 Excited
  * 😢 Sad
  * 😠 Angry
  * 😮 Surprised
  * 😨 Scared
  * 🤢 Disgusted
  * 😉 Winking
  * 🤔 Thinking
  * 😘 Kiss / Pout
  * 😴 Sleepy
  * 😐 Neutral

* 🕸️ **478-Point Face Mesh**

  * Visualizes facial landmarks in real time.
  * Dynamic highlighting based on the detected expression.

* 📊 **Confidence & Expression Scores**

  * Displays normalized expression scores.
  * Calculates the dominant expression dynamically.

* ⚡ **Live FPS & Resolution**

  * Shows real-time processing FPS.
  * Displays the active camera resolution.

* 🎚️ **Sensitivity Control**

  * Adjust detection sensitivity from the dashboard.

* 🔊 **Mood Audio Feedback**

  * Optional audio tones when the detected mood changes.

* 📸 **Mood Snapshot**

  * Capture a high-resolution snapshot.
  * Adds the detected mood and timestamp to the captured image.

* 🪞 **Mirror Mode**

  * Toggle horizontal mirroring of the webcam feed.

* 📹 **Camera Controls**

  * Turn the camera ON/OFF.
  * Switch between available camera devices.

* ⛶ **Fullscreen Mode**

  * View the live camera experience in fullscreen.

* 📜 **Mood History**

  * Keeps a short history of detected expression changes with timestamps and confidence.

* 🎨 **Dynamic UI**

  * The interface dynamically changes its theme, glow and visual accents according to the detected expression.

## 🧠 How It Works

```text
Webcam
   ↓
Video Stream
   ↓
MediaPipe Face Landmarker
   ↓
Facial Landmarks + Blendshapes
   ↓
Expression Calculation
   ↓
Smoothing & Normalization
   ↓
Dominant Expression
   ↓
Interactive Dashboard
```

### Detection Pipeline

1. The browser requests webcam permission.
2. MediaPipe Vision loads the Face Landmarker model.
3. Facial landmarks and blendshape scores are extracted from the video stream.
4. The application analyzes facial features such as:

   * Smile
   * Frown
   * Eyebrow movement
   * Eye openness
   * Eye blinking
   * Jaw movement
   * Mouth movement
   * Nose movement
5. These signals are combined into expression scores.
6. Scores are normalized and smoothed to reduce sudden fluctuations.
7. The highest-scoring expression becomes the current dominant expression.
8. The dashboard updates in real time.

## 🛠️ Tech Stack

| Technology                  | Purpose                              |
| --------------------------- | ------------------------------------ |
| **React 19**                | Frontend UI                          |
| **Vite**                    | Development & build tooling          |
| **MediaPipe Tasks Vision**  | Face landmark & blendshape detection |
| **JavaScript (ES Modules)** | Application logic                    |
| **HTML5 Video API**         | Webcam stream                        |
| **Canvas API**              | Face mesh rendering & snapshots      |
| **Web Audio API**           | Mood sound feedback                  |
| **CSS3**                    | Responsive glassmorphism UI          |
| **Vercel**                  | Deployment                           |

The project uses `@mediapipe/tasks-vision` alongside React and Vite.

## 📂 Project Structure

```text
face-mood-ai/
│
├── public/
│   └── models/
│       └── face_landmarker.task
│
├── src/
│   ├── features/
│   │   └── Expression/
│   │       ├── components/
│   │       │   ├── FaceExpression.jsx
│   │       │   └── FaceExpression.css
│   │       │
│   │       └── emotions.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/amitx22/face-mood-ai.git
```

### 2. Navigate to the project

```bash
cd face-mood-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available at the local Vite development URL shown in your terminal.

## 📦 Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Runs the production build locally.

```bash
npm run lint
```

Checks the project using ESLint.

These scripts are defined in the project's `package.json`.

## 🎛️ Dashboard Controls

| Control            | Function                                |
| ------------------ | --------------------------------------- |
| 🔴 Camera ON/OFF   | Enable or disable webcam                |
| 🕸️ Face Mesh      | Show/hide facial landmark mesh          |
| 🪞 Mirror          | Flip webcam horizontally                |
| 🔔 Audio           | Enable/disable mood sound               |
| 🎚️ Sensitivity    | Adjust expression detection sensitivity |
| 📷 Camera Selector | Switch between available cameras        |
| 📸 Snap Mood       | Capture current mood snapshot           |
| ⛶ Fullscreen       | Enter/exit fullscreen mode              |

## 🧮 Expression Detection

The application does not simply map one facial feature to one emotion.

Instead, it combines multiple MediaPipe blendshape signals.

For example:

```text
Smile + Cheek Squint
        ↓
      Happy
```

```text
Brow Down + Eye Squint + Mouth Press
        ↓
      Angry
```

```text
Jaw Open + Wide Eyes + Raised Brows
        ↓
    Surprised
```

```text
Eye Blink + Low Smile + Jaw Open
        ↓
      Sleepy
```

The resulting scores are normalized and smoothed before selecting the dominant expression.

## 🎨 User Interface

Face Mood AI uses a modern dark **glassmorphism-inspired interface** with:

* Dynamic expression-based colors
* Ambient background glow
* Live camera HUD
* Face mesh visualization
* Expression dashboard
* Responsive layout
* Fullscreen camera mode
* Real-time status indicators

The UI is designed to work across desktop and smaller screens.

## 🔐 Privacy

Face Mood AI is designed as a **browser-based computer vision application**.

The webcam stream is accessed through the browser's camera APIs and facial analysis is performed in the application using MediaPipe.

> **Important:** Facial-expression detection is an estimation based on visible facial movements. It should not be treated as a definitive measurement of a person's actual emotional or psychological state.

## 🌐 Deployment

The application is deployed using **Vercel**.

**Live Demo:**
https://face-mood-ai.vercel.app/

## 🔮 Future Improvements

Possible future enhancements include:

* 📈 Advanced mood analytics
* 📊 Long-term expression charts
* 👥 Multi-face detection
* 📱 Improved mobile camera support
* 🎵 Mood-based music recommendations
* 🤖 AI-generated mood insights
* 🗓️ Daily mood timeline
* 💾 Optional local mood history
* 🌍 PWA support
* 🎨 More expression categories
* ⚡ Further performance optimization

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repository
# Create a new branch
git checkout -b feature/your-feature

# Make your changes
git add .

# Commit
git commit -m "Add your feature"

# Push
git push origin feature/your-feature
```

Then open a Pull Request.

## 📄 License

This project currently does not specify a license.

If you plan to make the project open-source for reuse and contribution, consider adding an appropriate license such as MIT.

## 👨‍💻 Author

**Amit Kumar Singh**

🎓 B.Tech CSE
💻 Full-Stack & AI/ML Enthusiast

### 🔗 Connect

* GitHub: https://github.com/amitx22
* Project: https://github.com/amitx22/face-mood-ai

---

⭐ **If you found Face Mood AI interesting, consider giving the repository a star!**

Made with ❤️ using React + MediaPipe
