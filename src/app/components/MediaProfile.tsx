"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/MediaProfile.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type User = {
  id: number
  username?: string
  full_name: string
  email?: string
  phone?: string
  role: string
  branch?: string
  bio?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
  metadata?: any
}

export default function MediaProfile({ userId }: { userId: number }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchUser()
  }, [userId])

  async function fetchUser() {
    setLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("User fetch error:", error)
      setUser(null)
    } else {
      setUser(data)
    }
    setLoading(false)
  }

  if (loading) return <div className={styles.loading}>Loading profile...</div>
  if (!user) return <div className={styles.error}>User not found</div>

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>{user.full_name.slice(0, 1).toUpperCase()}</div>
      <div className={styles.info}>
        <h2>{user.full_name}</h2>
        <p className={styles.role}>{user.role} · {user.branch ?? "—"}</p>
        <p>{user.bio ?? "—"}</p>
        <div className={styles.meta}>
          <span>📧 {user.email ?? "—"}</span>
          <span>📱 {user.phone ?? "—"}</span>
          <span>🕒 Joined: {user.created_at.split("T")[0]}</span>
          {user.last_login && <span>🔓 Last login: {new Date(user.last_login).toLocaleString()}</span>}
        </div>
        {user.metadata && (
          <div className={styles.metadata}>
            <h4>🧠 Metadata</h4>
            <pre>{JSON.stringify(user.metadata, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
