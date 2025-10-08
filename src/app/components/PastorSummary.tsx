"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/PastorSummary.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PastorSummary() {
  const [branches, setBranches] = useState<string[]>([])
  const [pastors, setPastors] = useState<any[]>([])
  const [bishop, setBishop] = useState<any | null>(null)

  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedPastor, setSelectedPastor] = useState("")
  const [dateServed, setDateServed] = useState("")
  const [summary, setSummary] = useState("")
  const [events, setEvents] = useState<string[]>([""])
  const [services, setServices] = useState<string[]>([""])
  const [advice, setAdvice] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBranchesAndPastors()
  }, [])

  async function fetchBranchesAndPastors() {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, branch, role")
      .eq("is_active", true)

    const uniqueBranches = Array.from(new Set(users?.map(u => u.branch).filter(Boolean)))
    const activePastors = users?.filter(u => u.role === "pastor")
    const bishopKasimbazi = users?.find(u => u.full_name.toLowerCase().includes("kasimbazi"))

    setBranches(uniqueBranches)
    setPastors(activePastors ?? [])
    setBishop(bishopKasimbazi ?? null)
  }

  function updateEvent(index: number, value: string) {
    const updated = [...events]
    updated[index] = value
    setEvents(updated)
  }

  function updateService(index: number, value: string) {
    const updated = [...services]
    updated[index] = value
    setServices(updated)
  }

  function addEventField() {
    setEvents([...events, ""])
  }

  function addServiceField() {
    setServices([...services, ""])
  }

  async function submitSummary() {
    if (!selectedPastor || !selectedBranch || !dateServed || !summary) {
      setMessage("⚠️ Tafadhali jaza taarifa zote muhimu")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("pastor_summaries").insert({
        branch: selectedBranch,
        pastor_name: selectedPastor,
        tarehe: dateServed,
        muhtasari: summary,
        matukio: events.filter(e => e.trim() !== ""),
        huduma: services.filter(s => s.trim() !== ""),
        ushauri: advice,
        approved_by: bishop?.full_name ?? "BISHOP KASIMBAZI",
        status: "pending",
      })

      if (error) throw error
      setMessage("✅ Muhtasari umetumwa kwa BISHOP KASIMBAZI kwa approval")
      resetForm()
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu wakati wa kutuma muhtasari")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSelectedBranch("")
    setSelectedPastor("")
    setDateServed("")
    setSummary("")
    setEvents([""])
    setServices([""])
    setAdvice("")
  }

  return (
    <div className={styles.container}>
      <h3>📋 Fomu ya Muhtasari wa Huduma ya Mchungaji</h3>

      <div className={styles.formGroup}>
        <label>Tawi</label>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
          <option value="">-- Chagua Tawi --</option>
          {branches.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Majina ya Mchungaji</label>
        <input
          type="text"
          list="pastorList"
          value={selectedPastor}
          onChange={(e) => setSelectedPastor(e.target.value)}
          placeholder="Tafuta jina..."
        />
        <datalist id="pastorList">
          {pastors.map(p => (
            <option key={p.id} value={p.full_name} />
          ))}
        </datalist>
      </div>

      <div className={styles.formGroup}>
        <label>Tarehe ya Huduma</label>
        <input type="date" value={dateServed} onChange={(e) => setDateServed(e.target.value)} />
      </div>

      <div className={styles.formGroup}>
        <label>Muhtasari wa Huduma</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} />
      </div>

      <div className={styles.formGroup}>
        <label>Matukio ya Huduma</label>
        {events.map((event, i) => (
          <input
            key={i}
            type="text"
            value={event}
            onChange={(e) => updateEvent(i, e.target.value)}
            placeholder={`Tukio #${i + 1}`}
          />
        ))}
        <button onClick={addEventField}>➕ Ongeza Tukio</button>
      </div>

      <div className={styles.formGroup}>
        <label>Huduma Zilizotolewa</label>
        {services.map((service, i) => (
          <input
            key={i}
            type="text"
            value={service}
            onChange={(e) => updateService(i, e.target.value)}
            placeholder={`Huduma #${i + 1}`}
          />
        ))}
        <button onClick={addServiceField}>➕ Ongeza Huduma</button>
      </div>

      <div className={styles.formGroup}>
        <label>Ushauri wa Mchungaji</label>
        <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} rows={3} />
      </div>

      <button className={styles.submitBtn} onClick={submitSummary} disabled={submitting}>
        📨 Tuma kwa Bishop Kasimbazi
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
