"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"
import styles from "../components/ApprovedSummaries.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ApprovedSummaries() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [branchFilter, setBranchFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchBranches()
    fetchSummaries()
  }, [])

  async function fetchBranches() {
    const { data } = await supabase
      .from("users")
      .select("branch")
      .eq("is_active", true)

    const uniqueBranches = Array.from(new Set(data?.map(u => u.branch).filter(Boolean)))
    setBranches(uniqueBranches)
  }

  async function fetchSummaries() {
    let query = supabase.from("pastor_summaries").select("*").eq("status", "approved")

    if (branchFilter) query = query.eq("branch", branchFilter)
    if (startDate) query = query.gte("tarehe", startDate)
    if (endDate) query = query.lte("tarehe", endDate)

    const { data, error } = await query
    if (error) {
      console.error(error)
      setMessage("Hitilafu wakati wa kupakia muhtasari")
    } else {
      setSummaries(data ?? [])
    }
  }

  function exportToExcel() {
    const clean = summaries.map(s => ({
      Tarehe: s.tarehe,
      Mchungaji: s.pastor_name,
      Tawi: s.branch,
      Muhtasari: s.muhtasari,
      Matukio: s.matukio?.join(", "),
      Huduma: s.huduma?.join(", "),
      Ushauri: s.ushauri,
      ApprovedBy: s.approved_by
    }))
    const worksheet = XLSX.utils.json_to_sheet(clean)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approved Summaries")
    XLSX.writeFile(workbook, "approved_summaries.xlsx")
  }

  return (
    <div className={styles.container}>
      <h3>📁 Muhtasari Uliothibitishwa</h3>

      <div className={styles.filters}>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">-- Chagua Tawi --</option>
          {branches.map((b, i) => <option key={i} value={b}>{b}</option>)}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={fetchSummaries}>🔍 Tafuta</button>
        <button onClick={exportToExcel}>📤 Pakua Excel</button>
      </div>

      {summaries.length === 0 ? (
        <p>Hakuna muhtasari uliothibitishwa</p>
      ) : (
        summaries.map((s, i) => (
          <div key={s.id} className={styles.card}>
            <h4>{s.pastor_name} - {s.branch}</h4>
            <p><strong>Tarehe:</strong> {s.tarehe}</p>
            <p><strong>Muhtasari:</strong> {s.muhtasari}</p>
            <p><strong>Matukio:</strong> {s.matukio?.join(", ")}</p>
            <p><strong>Huduma:</strong> {s.huduma?.join(", ")}</p>
            <p><strong>Ushauri:</strong> {s.ushauri}</p>
            <p><strong>Approved By:</strong> {s.approved_by}</p>
          </div>
        ))
      )}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
