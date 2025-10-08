"use client"

import React, { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const accessMap: Record<string, string[]> = {
  admin: ["adminTab", "usherTab", "pastorTab", "mediaTab", "financeTab"],
  usher: ["usherTab"],
  pastor: ["pastorTab"],
  media: ["mediaTab"],
  finance: ["financeTab"],
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  usher: "Mhudumu",
  pastor: "Mchungaji",
  media: "Media",
  finance: "Fedha",
}

const Dashboard: React.FC = () => {
  const [role, setRole] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [branch, setBranch] = useState("")
  const [profileUrl, setProfileUrl] = useState("")
  const [lastLogin, setLastLogin] = useState("")
  const [statusLight, setStatusLight] = useState<"green" | "red" | "grey">("grey")
  const [statusText, setStatusText] = useState("⏳ Tafadhali chagua paneli.")
  const [themeVerse, setThemeVerse] = useState("")
  const [audioPlaying, setAudioPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const email = sessionData?.session?.user?.email
      if (sessionError || !email) {
        window.location.href = "/login"
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (userError || !userData) {
        alert("Haiwezekani kupata taarifa zako.")
        window.location.href = "/login"
        return
      }

      setRole(userData.role)
      setUsername(userData.username || "")
      setFullName(userData.full_name || "")
      setBranch(userData.branch || "")
      setProfileUrl(userData.profile_url || "")
      setLastLogin(userData.last_login ? new Date(userData.last_login).toLocaleString() : "")
    }

    const fetchTheme = async () => {
      const { data } = await supabase
        .from("tangazo")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (data) setThemeVerse(data.message)
    }

    loadUser()
    fetchTheme()
  }, [])

  const handleClick = (tabId: string, page: string) => {
    if (!accessMap[role]?.includes(tabId)) {
      setStatusLight("red")
      setStatusText("🚫 Huna ruhusa ya kuingia sehemu hii.")
      return
    }

    setStatusLight("green")
    setStatusText(`✅ Unaelekezwa kwenye ${tabId}...`)
    window.location.href = page
  }

  const handleAudioPlay = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setAudioPlaying(true)
    }
  }

  return (
  <>
    <style>{`
      .dashboard {
  font-family: 'Segoe UI', 'Roboto', Inter, sans-serif;
  background: linear-gradient(-45deg, #ede7f6, #fce4ec, #e8f5e9, #fff3e0);
  background-size: 400% 400%;
  animation: gradientFlow 15s ease infinite;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.floating-scripture {
  font-size: 1rem;
  color: #6a1b9a;
  margin-bottom: 1rem;
  font-style: italic;
  animation: floatVerse 6s ease-in-out infinite;
}

@keyframes floatVerse {
  0% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0); }
}

#welcomeMessage {
  font-size: 1.8rem;
  font-weight: 900;
  color: #2e7d32;
  margin-bottom: 0.5rem;
}

.theme-verse {
  font-size: 1rem;
  color: #4a148c;
  margin-bottom: 1rem;
}

.profile-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.audio-button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  background: #4a148c;
  color: #fff;
  border: none;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  animation: pulseTab 2s infinite;
}

.indicator-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.light {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: grey;
  box-shadow: 0 0 6px rgba(0,0,0,0.2);
}

.light.green {
  background-color: #2e7d32;
  animation: glowGreen 2s infinite;
}

.light.red {
  background-color: #c62828;
  animation: glowRed 2s infinite;
}

@keyframes glowGreen {
  0% { box-shadow: 0 0 6px #2e7d32; }
  50% { box-shadow: 0 0 12px #2e7d32; }
  100% { box-shadow: 0 0 6px #2e7d32; }
}

@keyframes glowRed {
  0% { box-shadow: 0 0 6px #c62828; }
  50% { box-shadow: 0 0 12px #c62828; }
  100% { box-shadow: 0 0 6px #c62828; }
}

.label {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  animation: slideInGrid 1.5s ease-out;
  width: 100%;
  max-width: 900px;
}

@keyframes slideInGrid {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tab {
  background: #ffffff;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 600;
  color: #4a148c;
  font-size: 1rem;
}

.tab:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: pulseTab 0.6s ease-in-out;
}

@keyframes pulseTab {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.tab i {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }

  #welcomeMessage {
    font-size: 1.4rem;
  }

  .audio-button {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }

  .tab {
    font-size: 0.95rem;
    padding: 0.8rem;
  }

  .tab i {
    font-size: 1.4rem;
  }
}

    `}</style>

    


      <div className="dashboard">
        <div className="floating-scripture">“Nuru yako itangaze gizani.” — Isaya 60:1</div>

        <h2 id="welcomeMessage">
          Karibu {roleLabels[role] || ""} {fullName}
        </h2>

        {branch && <div className="theme-verse">📍 Tawi: {branch}</div>}
        {lastLogin && <div className="theme-verse">🕒 Ilipoingia mwisho: {lastLogin}</div>}
        <div className="theme-verse">📖 {themeVerse || "Leo ni siku ya neema na uzima."}</div>

        {profileUrl && (
          <div style={{ marginBottom: "1rem" }}>
            <img
              src={profileUrl}
              alt="Profile"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}
            />
          </div>
        )}

        <button className="audio-button" onClick={handleAudioPlay}>
          🔊 {audioPlaying ? "Inapigwa..." : "Play Theme"}
        </button>
        <audio ref={audioRef} loop>
          <source src="/ana.mp3" type="audio/mp3" />
        </audio>

        <div className="indicator-container">
          <div className="indicator">
            <div className={`light ${statusLight}`}></div>
            <div className="label">{statusText}</div>
          </div>
        </div>

        <div className="grid">
          <div className="tab" id="adminTab" onClick={() => handleClick("adminTab", "/admin")}>
            <i className="fas fa-user-shield"></i>Admin Panel
          </div>
          <div className="tab" id="usherTab" onClick={() => handleClick("usherTab", "/usher")}>
            <i className="fas fa-fingerprint"></i>Usher Panel
          </div>
          <div className="tab" id="pastorTab" onClick={() => handleClick("pastorTab", "/pastor")}>
            <i className="fas fa-praying-hands"></i>Pastor Panel
          </div>
          <div className="tab" id="mediaTab" onClick={() => handleClick("mediaTab", "/media")}>
            <i className="fas fa-video"></i>Media Team
          </div>
          <div className="tab" id="financeTab" onClick={() => handleClick("financeTab", "/finance")}>
            <i className="fas fa-coins"></i>Finance
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
