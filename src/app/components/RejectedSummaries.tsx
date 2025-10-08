"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/RejectedSummaries.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RejectedSummaries() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchRejected()
  }, [])

  async function fetchRejected() {
    const { data, error } = await supabase
      .from("pastor_summaries")
      .select("*")
      .eq("status", "rejected")

    if (error) {
      console.error(error)
      setMessage("Hitilafu wakati wa kupakia muhtasari")
    } else {
      setSummaries(data ?? [])
    }
  }

  return (
    <div className={styles.container}>
      <h3>⛔ Muhtasari Uliokataliwa</h3>
      {summaries.length === 0 ? (
        <p>Hakuna muhtasari uliokataliwa</p>
      ) : (
        summaries.map((s, i) => (
          <div key={s.id} className={styles.card}>
            <h4>{s.pastor_name} - {s.branch}</h4>
            <p><strong>Tarehe:</strong> {s.tarehe}</p>
            <p><strong>Muhtasari:</strong> {s.muhtasari}</p>
            <p><strong>Matukio:</strong> {s.matukio?.join(", ")}</p>
            <p><strong>Huduma:</strong> {s.huduma?.join(", ")}</p>
            <p><strong>Ushauri:</strong> {s.ushauri}</p>
            <p><strong>Sababu ya Kukataa:</strong> {s.rejection_reason}</p>
            <p><strong>Aliyekataa:</strong> {s.rejected_by}</p>
          </div>
        ))
      )}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
