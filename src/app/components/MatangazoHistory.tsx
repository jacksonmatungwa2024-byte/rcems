"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "./MatangazoHistory.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MatangazoHistory() {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data } = await supabase
      .from("pastor_announcements")
      .select("*")
      .order("created_at", { ascending: false })

    setHistory(data ?? [])
  }

  return (
    <div className={styles.container}>
      <h3>📜 Historia ya Matangazo</h3>
      {history.map((h, i) => (
        <div key={i} className={styles.card}>
          <p><strong>Kwa:</strong> {h.receiver_name} ({h.receiver_role})</p>
          <p><strong>Tangazo:</strong> {h.title}</p>
          <p><strong>Maelezo:</strong> {h.description}</p>
          {h.media_url && <a href={h.media_url} target="_blank">📎 Fungua Faili</a>}
          <p><strong>Tarehe:</strong> {new Date(h.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
