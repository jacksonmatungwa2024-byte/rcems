"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

const WelcomePage: React.FC = () => {
  const router = useRouter()
  const [showButton, setShowButton] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true)
    }, 500) // Show button after 1.5 minutes

    return () => clearTimeout(timer)
  }, [])

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setAudioStarted(true)
      setTimeout(() => {
        router.push("/login")
      }, 21000) // Redirect 15s after audio starts
    }
  }

  return (
    <>
      <style>{`
        .welcome-container {
          position: relative;
          height: 100vh;
          overflow: hidden;
          font-family: 'Segoe UI', 'Roboto', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: #000;
          color: #fff;
        }

        .video-bg {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          z-index: 0;
          opacity: 0.6;
        }

        .overlay {
          position: relative;
          z-index: 2;
          padding: 2rem;
          animation: fadeIn 2s ease-in-out;
        }

        .title {
          font-size: 2.8rem;
          font-weight: bold;
          color: #ffe0f7;
          animation: zoomIn 2s ease-in-out;
        }

        .subtitle {
          font-size: 1.6rem;
          color: #ffd6e7;
          margin-top: 1rem;
          animation: pulse 2s infinite;
        }

        .verse {
          margin-top: 2rem;
          font-size: 1rem;
          color: #ccc;
          animation: slideUp 3s ease-in-out;
        }

        .play-button {
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          background: linear-gradient(to right, #6a1b9a, #9c27b0);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          animation: fadeIn 2s ease-in-out;
        }

        .play-button:hover {
          background: linear-gradient(to right, #4a148c, #7b1fa2);
        }

        .footer {
          position: absolute;
          bottom: 1rem;
          font-size: 0.85rem;
          color: #aaa;
          z-index: 2;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .title { font-size: 2rem; }
          .subtitle { font-size: 1.2rem; }
          .verse { font-size: 0.9rem; }
        }
      `}</style>

      <div className="welcome-container">
        <video className="video-bg" autoPlay muted loop playsInline>
          <source src="/aerial.mp4" type="video/mp4" />
        </video>

        <div className="overlay">
          <div className="title">🌟 Karibu RCEMS Portal</div>
          <div className="subtitle">ZOE isiyoisha uzima ndani yangu</div>
          <div className="verse">“Nami nitawapa uzima wa milele, wala hawatapotea kamwe.” — Yohana 10:28</div>

          {showButton && !audioStarted && (
            <button className="play-button" onClick={handlePlay}>
              🔊 Play Theme
            </button>
          )}

          <audio ref={audioRef}>
            <source src="/theme.mp3" type="audio/mp3" />
          </audio>
        </div>

        <div className="footer">&copy; Abel Memorial Programmers · RCEMS Legacy</div>
      </div>
    </>
  )
}

export default WelcomePage
