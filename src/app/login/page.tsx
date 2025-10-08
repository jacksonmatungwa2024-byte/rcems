"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const LoginPage: React.FC = () => {
  const [loginMessage, setLoginMessage] = useState("")
  const [tangazo, setTangazo] = useState<any>(null)
  const [localAttempts, setLocalAttempts] = useState(0)
  const [countdown, setCountdown] = useState("")
  const [showCartoon, setShowCartoon] = useState(false)
  const router = useRouter()

    useEffect(() => {
    fetchTangazo()

    const bgImages = document.querySelectorAll<HTMLImageElement>("#backgroundSlideshow img")
    let bgIndex = 0
    const bgTimer = setInterval(() => {
      bgImages.forEach(img => img.classList.remove("active"))
      bgImages[bgIndex].classList.add("active")
      bgIndex = (bgIndex + 1) % bgImages.length
    }, 6000)

    return () => clearInterval(bgTimer)
  }, [])

  async function fetchTangazo() {
    const { data } = await supabase
      .from("tangazo")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) setTangazo(data)
  }

    const startCountdown = (targetTime: Date) => {
    setShowCartoon(true)
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetTime.getTime() - now

      if (distance <= 0) {
        clearInterval(interval)
        setCountdown("✅ Sasa unaweza kuingia.")
        setShowCartoon(false)
        return
      }

      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((distance / (1000 * 60)) % 60)
      const seconds = Math.floor((distance / 1000) % 60)

      setCountdown(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const email = (form.email as HTMLInputElement).value.trim()
    const password = (form.password as HTMLInputElement).value.trim()

    setLoginMessage("")

    if (!email || !password) {
      setLoginMessage("Tafadhali jaza taarifa zote.")
      return
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (!userRecord) {
      const newAttempts = localAttempts + 1
      setLocalAttempts(newAttempts)
      if (newAttempts >= 3) router.push("/404")
      setLoginMessage("❌ Akaunti haijapatikana.")
      return
    }

    if (!userRecord.is_active) {
      setLoginMessage("🚫 Akaunti yako imefungwa. Tafadhali wasiliana na admin.")
      return
    }

    const now = new Date()
    const expiry = userRecord.active_until ? new Date(userRecord.active_until) : null
    if (expiry && now > expiry) {
      await supabase
        .from("users")
        .update({
          metadata: { reset_status: "expired" },
          active_until: null
        })
        .eq("id", userRecord.id)

      setLoginMessage("⏳ Akaunti yako imeisha muda wake. Tafadhali wasiliana na admin kwa upya.")
      return
    }

    const status = userRecord.metadata?.reset_status
    const readyAt = userRecord.metadata?.password_reset_ready_at
    const readyTime = readyAt ? new Date(readyAt) : null

    if (status === "approved_by_admin") {
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
      await supabase
        .from("users")
        .update({
          metadata: {
            reset_status: "ready_for_user",
            password_reset_ready_at: oneHourLater.toISOString()
          }
        })
        .eq("id", userRecord.id)

      setLoginMessage("✅ Admin amepokea ombi lako. Login tena baada ya lisaa limoja.")
      return
    }

    if (status === "ready_for_user") {
      if (readyTime && now < readyTime) {
        startCountdown(readyTime)
        setLoginMessage("⏳ Subiri lisaa limoja kabla ya kuweka nenosiri.")
        return
      }

      router.push(`/set-password?user_id=${userRecord.id}`)
      return
    }

    if (status === "wait_before_login") {
      if (readyTime && now < readyTime) {
        startCountdown(readyTime)
        setLoginMessage("⏳ Umefanikiwa kubadilisha nenosiri. Login tena baada ya lisaa limoja.")
        return
      }

      await supabase
        .from("users")
        .update({ metadata: { reset_status: null, password_reset_ready_at: null } })
        .eq("id", userRecord.id)
    }

    const lastFailed = userRecord.last_failed_login ? new Date(userRecord.last_failed_login) : null
    const oneHour = 60 * 60 * 1000
    if (userRecord.login_attempts >= 5 && lastFailed && now.getTime() - lastFailed.getTime() < oneHour) {
      setLoginMessage("⏳ Umefungiwa kwa saa 1 baada ya majaribio 5 ya kuingia.")
      return
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData?.user) {
      const attempts = (userRecord.login_attempts || 0) + 1
      const updates: any = {
        login_attempts: attempts,
        last_failed_login: now.toISOString()
      }

      if (attempts >= 10) updates.is_active = false

      await supabase.from("users").update(updates).eq("id", userRecord.id)
      setLoginMessage("❌ Taarifa si sahihi, jaribu tena.")
      return
    }

    await supabase.from("users").update({ login_attempts: 0 }).eq("id", userRecord.id)
    setLocalAttempts(0)

    await fetch("/functions/v1/notify_admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userRecord.id,
        email: userRecord.email,
        full_name: userRecord.full_name
      })
    })

    router.push("/home")
  }

      return (
    <>
    <style>{`
  .login-wrapper {
    display: flex;
    flex-direction: row;
    height: 100vh;
    font-family: 'Segoe UI', 'Roboto', sans-serif;
    background: linear-gradient(to right, #ede7f6, #f3e5f5);
    overflow: hidden;
    flex-wrap: wrap;
  }

  .login-left, .login-right {
    flex: 1;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .login-left {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
  }

  .logo-container {
    text-align: center;
    margin-bottom: 1rem;
  }

  .church-logo {
    max-width: 100px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  h2 {
    text-align: center;
    color: #4a148c;
    margin-bottom: 1.5rem;
    font-size: 1.6rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 400px;
  }

  label {
    font-weight: 600;
    color: #3c1363;
    font-size: 0.95rem;
  }

  input {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    background: #fff;
    width: 100%;
  }

  input:focus {
    border-color: #6a1b9a;
    outline: none;
  }

  button {
    padding: 0.75rem;
    background: linear-gradient(to right, #6a1b9a, #9c27b0);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1rem;
  }

  button:hover {
    background: linear-gradient(to right, #4a148c, #7b1fa2);
  }

  .login-message {
    margin-top: 1rem;
    color: #d32f2f;
    font-weight: bold;
    text-align: center;
    font-size: 0.95rem;
  }

  .login-right {
    position: relative;
    background: #ede7f6;
    color: #4a148c;
    text-align: center;
    overflow: hidden;
  }

  .background-slideshow img {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    z-index: 0;
  }

  .background-slideshow img.active {
    opacity: 0.3;
  }

  .tangazo-box {
    position: relative;
    z-index: 2;
    background: rgba(255,255,255,0.95);
    padding: 2rem;
    border-radius: 16px;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-top: 2rem;
  }

  .tangazo-box h3 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    color: #6a1b9a;
  }

  .tangazo-box p {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .tangazo-image {
    max-width: 100%;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    .login-wrapper {
      flex-direction: column;
      height: auto;
    }

    .login-left, .login-right {
      width: 100%;
      padding: 2rem 1.5rem;
    }

    h2 {
      font-size: 1.4rem;
    }

    .tangazo-box {
      margin-top: 1rem;
      padding: 1.5rem;
    }

    form {
      max-width: 100%;
    }
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.login-left {
  overflow-y: auto;
  max-height: 100vh;
}

    input, button {
      font-size: 0.95rem;
    }
  }
`}</style>

      <div className="login-wrapper">
        <div className="login-left">
          <div className="logo-container">
            <img src="rhema.jpg" alt="Kanisa la Rhema Logo" className="church-logo" />
          </div>
          <h2>🔐 Ingia kwenye Mfumo</h2>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">📧 Barua Pepe:</label>
            <input type="email" id="email" name="email" required placeholder="Andika barua pepe yako" />
            <label htmlFor="password">🔑 Nenosiri:</label>
            <input type="password" id="password" name="password" required placeholder="Andika nenosiri lako" />
            <button type="submit">🚪 Ingia</button>
          </form>
          <button
            onClick={() => router.push("/forgot-password")}
            style={{
              marginTop: "1rem",
              background: "#009688",
              color: "#fff",
              padding: "0.75rem",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "none",
              cursor: "pointer"
            }}
          >
            ❓ Umesahau Nenosiri?
          </button>

          <div className="login-message">{loginMessage}</div>

          {countdown && (
            <div style={{ marginTop: 12, fontWeight: 700, color: "#4a148c" }}>
              ⏳ {countdown}
            </div>
          )}

          {showCartoon && (
            <div style={{ marginTop: 24 }}>
              <img
                src="/cartoon-waiting.gif"
                alt="Kamdori anasubiri"
                style={{
                  maxWidth: 200,
                  borderRadius: 12,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}
              />
              <div style={{ marginTop: 8, fontWeight: 600, color: "#6a1b9a" }}>
                😂 Kamdori anasubiri muda wako kuisha...
              </div>
            </div>
          )}
        </div>

        <div className="login-right">
          <div className="background-slideshow" id="backgroundSlideshow" aria-hidden="true">
            <img src="maua.jpg" className="active" alt="Background 1" />
            <img src="clouds.jpeg" alt="Background 2" />
            <img src="Cross-Easter-scaled.jpg" alt="Background 3" />
          </div>

          {tangazo && (
            <div className="tangazo-box">
              <h3>📣 {tangazo.title}</h3>
              <p>{tangazo.message}</p>
              {tangazo.image_url && (
                <img src={tangazo.image_url} alt="Tangazo" className="tangazo-image" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default LoginPage
