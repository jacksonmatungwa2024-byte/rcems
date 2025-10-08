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
    const { data, error } = await supabase
      .from("tangazo")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!error && data) setTangazo(data)
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setLoginMessage("Taarifa si sahihi, jaribu tena.")
    } else {
      router.push("/home")
    }
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

  .footer {
    margin-top: auto;
    text-align: center;
    font-size: 0.85rem;
    color: #555;
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
          <div className="login-message">{loginMessage}</div>
          <div className="footer">&copy; Abel Memorial Programmers</div>
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
              {tangazo.image_url && <img src={tangazo.image_url} alt="Tangazo" className="tangazo-image" />}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default LoginPage
