"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/FinancePanel.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FinancePanel() {
  const [activeTab, setActiveTab] = useState("create")
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "TZS",
    requested_by: "Finance Officer",
    requested_by_id: 1,
    department: "",
    note: "",
    source_pending_id: null
  })
  const [approvedBudgets, setApprovedBudgets] = useState<any[]>([])
  const [declinedBudgets, setDeclinedBudgets] = useState<any[]>([])
  const [pendingBudgets, setPendingBudgets] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (activeTab === "approved") fetchApproved()
    if (activeTab === "declined") fetchDeclined()
    if (activeTab === "pending") fetchPending()
  }, [activeTab])

  async function fetchApproved() {
    const { data, error } = await supabase
      .from("approved_budgets")
      .select("*")
      .order("approved_at", { ascending: false })

    if (error) console.error("Approved fetch error:", error)
    else setApprovedBudgets(data ?? [])
  }

  async function fetchDeclined() {
    const { data, error } = await supabase
      .from("declined_budgets")
      .select("*")
      .order("declined_at", { ascending: false })

    if (error) console.error("Declined fetch error:", error)
    else setDeclinedBudgets(data ?? [])
  }

  async function fetchPending() {
    const { data, error } = await supabase
      .from("pending_budgets")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) console.error("Pending fetch error:", error)
    else setPendingBudgets(data ?? [])
  }

  async function submitBudget(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase
      .from("approved_budgets")
      .insert({
        ...form,
        amount: parseFloat(form.amount),
        source_pending_id: form.source_pending_id ? parseInt(String(form.source_pending_id)) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error("Insert error:", error)
      setMessage("Hitilafu wakati wa kuwasilisha bajeti")
    } else {
      setMessage("✅ Bajeti imewasilishwa")
      setForm({
        title: "",
        description: "",
        amount: "",
        currency: "TZS",
        requested_by: "Finance Officer",
        requested_by_id: 1,
        department: "",
        note: "",
        source_pending_id: null
      })
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>💰 Finance Panel</h2>

      <div className={styles.tabBar}>
        <button onClick={() => setActiveTab("create")} className={activeTab === "create" ? styles.active : styles.tab}>➕ Unda Bajeti</button>
        <button onClick={() => setActiveTab("approved")} className={activeTab === "approved" ? styles.active : styles.tab}>✅ Zilizopitishwa</button>
        <button onClick={() => setActiveTab("declined")} className={activeTab === "declined" ? styles.active : styles.tab}>⛔ Zilizokataliwa</button>
        <button onClick={() => setActiveTab("pending")} className={activeTab === "pending" ? styles.active : styles.tab}>⏳ Zinaosubiri</button>
      </div>

      <div className={styles.panel}>
        {activeTab === "create" && (
          <form onSubmit={submitBudget} className={styles.form}>
            <input placeholder="Kichwa cha Bajeti" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Maelezo" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input type="number" placeholder="Kiasi (Tsh)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <input placeholder="Idara" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            <input type="number" placeholder="Source Pending ID (optional)" value={form.source_pending_id ?? ""} onChange={e => setForm({ ...form, source_pending_id: e.target.value ? parseInt(e.target.value) : null })} />
            <textarea placeholder="Maelezo ya ziada" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            <button type="submit">📤 Wasilisha Bajeti</button>
            {message && <p className={styles.message}>{message}</p>}
          </form>
        )}

        {activeTab === "approved" && (
          <div className={styles.list}>
            {approvedBudgets.length === 0 ? <p>Hakuna bajeti zilizopitishwa</p> :
              approvedBudgets.map(b => (
                <div key={b.id} className={`${styles.card} ${styles.approved}`}>
                  <h4>{b.title} · {b.amount} {b.currency}</h4>
                  <p>{b.description}</p>
                  <p><strong>Idara:</strong> {b.department}</p>
                  <p><strong>Imeidhinishwa na:</strong> {b.approved_by}</p>
                  <p><strong>Tarehe:</strong> {b.approved_at?.split("T")[0]}</p>
                </div>
              ))}
          </div>
        )}

        {activeTab === "declined" && (
          <div className={styles.list}>
            {declinedBudgets.length === 0 ? <p>Hakuna bajeti zilizokataliwa</p> :
              declinedBudgets.map(b => (
                <div key={b.id} className={`${styles.card} ${styles.declined}`}>
                  <h4>{b.title} · {b.amount} {b.currency}</h4>
                  <p>{b.description}</p>
                  <p><strong>Idara:</strong> {b.department}</p>
                  <p><strong>Sababu ya kukataa:</strong> {b.declined_reason}</p>
                  <p><strong>Aliyekataa:</strong> {b.declined_by}</p>
                  <p><strong>Tarehe:</strong> {b.declined_at?.split("T")[0]}</p>
                </div>
              ))}
          </div>
        )}

        {activeTab === "pending" && (
          <div className={styles.list}>
            {pendingBudgets.length === 0 ? <p>Hakuna bajeti zinazosubiri</p> :
              pendingBudgets.map(b => (
                <div key={b.id} className={styles.card}>
                  <h4>{b.title} · {b.amount} {b.currency}</h4>
                  <p>{b.description}</p>
                  <p><strong>Idara:</strong> {b.department}</p>
                  <p><strong>Aliyeomba:</strong> {b.requested_by}</p>
                  <p><strong>Tarehe:</strong> {b.created_at?.split("T")[0]}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
