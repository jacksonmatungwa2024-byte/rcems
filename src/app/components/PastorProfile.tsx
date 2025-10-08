"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const email = sessionData?.session?.user?.email

    if (!email) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (!error && data) {
      setUser(data)
    }

    setLoading(false)
  }

  if (loading) return <p style={styles.loading}>⏳ Loading profile...</p>
  if (!user) return <p style={styles.error}>🚫 Hakuna taarifa za mtumiaji.</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🙋 Karibu {user.full_name}</h2>
      <div style={styles.card}>
        <img
          src={user.profile_url || "default-profile.png"}
          alt="Profile"
          style={styles.avatar}
        />
        <div style={styles.info}>
          <p><strong>📧 Email:</strong> {user.email}</p>
          <p><strong>📞 Simu:</strong> {user.phone || "—"}</p>
          <p><strong>🧑‍💼 Nafasi:</strong> {user.role}</p>
          <p><strong>🌿 Tawi:</strong> {user.branch || "—"}</p>
          <p><strong>🧠 Bio:</strong> {user.bio || "—"}</p>
          <p><strong>🕒 Membership:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    maxWidth: 600,
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    background: "linear-gradient(to bottom right, #f3e5f5, #ede7f6)",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    animation: "fadeIn 0.6s ease"
  },
  header: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#6a1b9a",
    marginBottom: 16
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    background: "#fff",
    padding: 20,
    borderRadius: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #6a1b9a",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  info: {
    fontSize: "1rem",
    color: "#333",
    textAlign: "left",
    width: "100%"
  },
  loading: {
    textAlign: "center",
    fontSize: "1rem",
    color: "#666",
    marginTop: 40
  },
  error: {
    textAlign: "center",
    fontSize: "1rem",
    color: "#d32f2f",
    marginTop: 40
  }
}
