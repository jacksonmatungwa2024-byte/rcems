"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/SummaryApproval.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SummaryApproval() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [rejectionComments, setRejectionComments] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchPendingSummaries()
  }, [])

  async function fetchPendingSummaries() {
    const { data, error } = await supabase
      .from("pastor_summaries")
      .select("*")
      .eq("status", "pending")
    

    if (error) {
      console.error("Fetch error:", error)
      setMessage("Hitilafu wakati wa kupakia muhtasari")
    } else {
      setSummaries(data ?? [])
    }
  }

  async function approveSummary(id: number) {
    const { data, error } = await supabase
      .from("pastor_summaries")
      .update({
        status: "approved",
        approved_by: "BISHOP KASIMBAZI",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Approve error:", error)
      setMessage("Hitilafu wakati wa kuidhinisha muhtasari")
    } else {
      setMessage("✅ Muhtasari umeidhinishwa")
      fetchPendingSummaries()
    }
  }

  function updateRejectionComment(id: number, comment: string) {
    setRejectionComments(prev => ({ ...prev, [id]: comment }))
  }

  async function rejectSummary(id: number) {
    const reason = rejectionComments[id]
    if (!reason || reason.trim() === "") {
      setMessage("⚠️ Tafadhali andika sababu ya kukataa")
      return
    }

    const { data, error } = await supabase
      .from("pastor_summaries")
      .update({
        status: "rejected",
        rejection_reason: reason,
        rejected_by: "BISHOP KASIMBAZI",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Reject error:", error)
      setMessage("Hitilafu wakati wa kukataa muhtasari")
    } else {
      setMessage("⛔ Muhtasari umekataliwa")
      fetchPendingSummaries()
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>📋 Muhtasari Wanaosubiri Idhini</h3>
      {summaries.length === 0 ? (
        <p className={styles.empty}>Hakuna muhtasari wa kuidhinishwa kwa sasa</p>
      ) : (
        summaries.map((s) => (
          <div key={s.id} className={styles.summaryCard}>
            <h4>{s.pastor_name} - {s.branch}</h4>
            <p><strong>Tarehe:</strong> {s.tarehe}</p>
            <p><strong>Muhtasari:</strong> {s.muhtasari}</p>
            <p><strong>Matukio:</strong> {s.matukio?.join(", ")}</p>
            <p><strong>Huduma:</strong> {s.huduma?.join(", ")}</p>
            <p><strong>Ushauri:</strong> {s.ushauri}</p>

            <div className={styles.actions}>
              <button onClick={() => approveSummary(s.id)}>✅ Idhinisha</button>
              <textarea
                placeholder="Sababu ya kukataa"
                value={rejectionComments[s.id] ?? ""}
                onChange={(e) => updateRejectionComment(s.id, e.target.value)}
                rows={2}
                className={styles.rejectionBox}
              />
              <button onClick={() => rejectSummary(s.id)}>⛔ Kataa Muhtasari</button>
            </div>
          </div>
        ))
      )}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
