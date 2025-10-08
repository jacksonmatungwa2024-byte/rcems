"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/PastorProfile.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type User = {
  id?: number
  username?: string
  full_name?: string
  email?: string
  phone?: string
  role?: string
  branch?: string
  bio?: string
  is_active?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
  metadata?: any
  profile_url?: string
}

export default function UserProfile({ userId }: { userId?: number | string }): JSX.Element {
  const [profile, setProfile] = useState<User | null>(null)
  const [form, setForm] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchProfileById(userId)
    } else {
      fetchProfileFromSession()
    }
  }, [userId])

  async function fetchProfileFromSession() {
    setLoading(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const email = sessionData?.session?.user?.email
    if (!email) return setLoading(false)

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (!error && data) {
      setProfile(data)
      setForm({ ...data })
    } else {
      setError("User not found or session invalid")
    }

    setLoading(false)
  }

  async function fetchProfileById(id: number | string) {
    setLoading(true)
    setError(null)

    try {
      let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !data) {
        const fallbackKey = typeof id === "string" ? id : String(id)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("users")
          .select("*")
          .or(`email.eq.${JSON.stringify(fallbackKey)},full_name.eq.${JSON.stringify(fallbackKey)}`)
          .limit(1)

        if (!fallbackData || fallbackData.length === 0) throw fallbackError ?? new Error("User not found")
        data = fallbackData[0]
      }

      setProfile(data)
      setForm({ ...data })
    } catch (err: any) {
      console.error("fetchProfile error", err)
      setError("User not found or failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        username: form.username,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        branch: form.branch,
        bio: form.bio,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setSuccess("✅ Profile updated")
      setEditing(false)
    } catch (err: any) {
      console.error("saveProfile error", err)
      setError("Failed to save profile")
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  function onChange<K extends keyof User>(key: K, value: User[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {profile?.profile_url ? (
              <img src={profile.profile_url} alt="Profile" className={styles.avatarImage} />
            ) : (
              (profile?.full_name ?? "U").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className={styles.titleBlock}>
            <h2 className={styles.name}>{profile?.full_name ?? "User"}</h2>
            <div className={styles.meta}>
              {profile?.role ?? "User"} · {profile?.branch ?? "N/A"}
            </div>
          </div>
          <div className={styles.actions}>
            {editing ? (
              <>
                <button className={styles.saveBtn} onClick={saveProfile} disabled={loading}>Save</button>
                <button className={styles.cancelBtn} onClick={() => { setEditing(false); setForm({ ...profile }) }}>Cancel</button>
              </>
            ) : (
              <button className={styles.editBtn} onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Full name</label>
            {!editing ? <div className={styles.value}>{profile?.full_name ?? "—"}</div> : <input className={styles.input} value={form.full_name ?? ""} onChange={(e) => onChange("full_name", e.target.value)} />}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              {!editing ? <div className={styles.value}>{profile?.email ?? "—"}</div> : <input className={styles.input} value={form.email ?? ""} onChange={(e) => onChange("email", e.target.value)} />}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              {!editing ? <div className={styles.value}>{profile?.phone ?? "—"}</div> : <input className={styles.input} value={form.phone ?? ""} onChange={(e) => onChange("phone", e.target.value)} />}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Role</label>
              {!editing ? <div className={styles.value}>{profile?.role ?? "—"}</div> : <input className={styles.input} value={form.role ?? ""} onChange={(e) => onChange("role", e.target.value)} />}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Branch</label>
              {!editing ? <div className={styles.value}>{profile?.branch ?? "—"}</div> : <input className={styles.input} value={form.branch ?? ""} onChange={(e) => onChange("branch", e.target.value)} />}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Bio</label>
            {!editing ? <div className={styles.value}>{profile?.bio ?? "—"}</div> : <textarea className={styles.textarea} value={form.bio ?? ""} onChange={(e) => onChange("bio", e.target.value)} />}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Last Login</label>
              <div className={styles.value}>{profile?.last_login ? new Date(profile.last_login).toLocaleString() : "—"}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.value}>{profile?.is_active ? "✅ Active" : "🚫 Disabled"}</div>

            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Metadata</label>
            <div className={styles.value}>
              {profile?.metadata ? (
                <code>{JSON.stringify(profile.metadata, null, 2)}</code>
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <div className={styles.small}>🕒 Ilipojiunga: {profile?.created_at?.split("T")[0] ?? "—"}</div>
            <div className={styles.small}>🆔 ID: {profile?.id ?? "—"}</div>
            <div className={styles.small}>🔄 Updated: {profile?.updated_at?.split("T")[0] ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
