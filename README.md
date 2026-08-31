# 🎵 Zubeen Garg — Music Web App

> A modern, sleek web platform to discover and stream **Zubeen Garg's** iconic Assamese songs, powered by Node.js, Express, and YouTube API.
>
> <img width="1470" height="835" alt="image" src="https://github.com/user-attachments/assets/d252e921-92c4-4dc0-bc6e-eff2d45b9b2a" />


---

## ✨ Features

- 🎧 **Interactive Music Player**: Powered by YouTube IFrame API with custom player controls:
  - Play / Pause toggling
  - Next & Previous track navigation
  - Interactive timeline seekbar with real-time duration updates
  - Smooth volume control slider
- 🔍 **Real-time Song Search**: Live search interface connecting directly to YouTube API to find Zubeen Garg's popular songs and classics.
- 🎨 **Modern Dark Aesthetic**: Ambient glassmorphism overlay, responsive layout, animated search box, and mobile-friendly design.
- ⚡ **Secure Express Proxy**: Backend server built with Express.js to keep YouTube API keys secure and stream search results smoothly.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphism Design System), Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Integrations**: YouTube Data API v3 & YouTube IFrame Player API
- **Environment Management**: `dotenv`

---

## 🚀 Getting Started

Follow these steps to run the application locally on your machine:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### 2. Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kriishna9/Zubeen-music.git
   cd Zubeen-music
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in Browser**
   Navigate to [http://localhost:5500](http://localhost:5500)

---

## 📁 Project Structure

```text
zubeen-music/
├── data/                  # Song data & cached results
├── index.html             # Main application layout & player container
├── style.css              # Custom styling & glassmorphism theme
├── script.js              # Client-side player logic & YouTube API integration
├── server.js              # Node.js Express server & YouTube search proxy API
├── .env                   # Environment variables (API Keys)
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and project config
└── README.md              # Project documentation
```

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
