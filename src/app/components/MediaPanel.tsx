"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/MediaPanel.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Announcement = {
  id: number
  receiver_name: string
  receiver_role: string
  title: string
  description?: string
  media_url?: string
  created_at?: string
  status?: string
  scheduled_for?: string
  approved_by?: string
}

export default function MediaPanel(): JSX.Element {
  const [matangazo, setMatangazo] = useState<Announcement[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [receiverFilter, setReceiverFilter] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [newAlert, setNewAlert] = useState(false)

  useEffect(() => {
    fetchMatangazo()

    const subscription = supabase
      .channel("matangazo-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pastor_announcements" },
        () => {
          setNewAlert(true)
          fetchMatangazo()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [statusFilter, receiverFilter])

  async function fetchMatangazo() {
    try {
      let query = supabase.from("pastor_announcements").select("*")

      if (statusFilter) query = query.eq("status", statusFilter)
      if (receiverFilter) query = query.eq("receiver_name", receiverFilter)

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setMatangazo(data ?? [])
    } catch (err: any) {
      console.error("Error loading matangazo:", err)
      setError("Failed to load matangazo")
    }
  }

  function exportToCSV() {
    const rows = matangazo.map(m => ({
      ID: m.id,
      Title: m.title,
      Receiver: m.receiver_name,
      Role: m.receiver_role,
      Status: m.status,
      Scheduled: m.scheduled_for,
      ApprovedBy: m.approved_by,
      CreatedAt: m.created_at,
      Description: m.description,
      MediaURL: m.media_url
    }))

    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map(row => Object.values(row).map(v => `"${v ?? ""}"`).join(","))
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "matangazo.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueReceivers = Array.from(new Set(matangazo.map(m => m.receiver_name)))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📣 Matangazo ya Kiroho</h2>
        <div className={styles.actions}>
          <button onClick={exportToCSV}>📤 Export CSV</button>
          {newAlert && <span className={styles.bell}>🔔 Tangazo Jipya!</span>}
        </div>
      </div>

      <div className={styles.filters}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">-- Status --</option>
          <option value="pending">⏳ Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="rejected">⛔ Rejected</option>
        </select>

        <select value={receiverFilter} onChange={(e) => setReceiverFilter(e.target.value)}>
          <option value="">-- Receiver --</option>
          {uniqueReceivers.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {matangazo.length === 0 && <p className={styles.empty}>Hakuna matangazo kwa sasa</p>}

      <div className={styles.list}>
        {matangazo.map((m) => (
          <div key={m.id} className={styles.card}>
            <h3>{m.title}</h3>
            <p>
              Kwa: <strong>{m.receiver_name}</strong> ({m.receiver_role}) ·{" "}
              {m.status === "approved" ? "✅ Imeidhinishwa" : m.status === "rejected" ? "⛔ Imekataliwa" : "⏳ Inasubiri"}
            </p>
            {m.description && <p>{m.description}</p>}
            {m.media_url && (
              <div className={styles.media}>
                {m.media_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={m.media_url} alt="Tangazo" className={styles.image} />
                ) : (
                  <a href={m.media_url} download className={styles.downloadBtn}>⬇️ Pakua Faili</a>
                )}
              </div>
            )}
            <div className={styles.footer}>
              <span>📅 {m.scheduled_for ? new Date(m.scheduled_for).toLocaleString() : "Hakujaribiwa"}</span>
              {m.approved_by && <span>✅ Imeidhinishwa na: {m.approved_by}</span>}
              <span>🕒 {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
