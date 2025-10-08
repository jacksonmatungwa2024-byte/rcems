"use client"

import React, { useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [status, setStatus] = useState("")

  const verifyOtp = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("metadata")
      .eq("email", email)
      .single()

    if (error || !data) {
      setStatus("❌ Email haijapatikana.")
      return
    }

    const storedOtp = data.metadata?.password_reset_otp
    const resetStatus = data.metadata?.reset_status

    if (storedOtp === otp && resetStatus === "waiting_approval") {
      setStatus("✅ OTP sahihi. Tafadhali subiri admin athibitishe nenosiri.")
    } else {
      setStatus("❌ OTP si sahihi au haijathibitishwa.")
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
      <h2 style={{ color: "#4a148c", fontWeight: 900 }}>🔑 Forgot Password</h2>
      <input
        type="email"
        placeholder="📧 Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="🔐 OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        style={inputStyle}
      />
      <button onClick={verifyOtp} style={btnStyle}>✅ Verify OTP</button>
      {status && <div style={{ marginTop: 12, fontWeight: 700 }}>{status}</div>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 14
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer"
}
