"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/FinanceReports.module.css"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FinanceReports() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingList, setPendingList] = useState<any[]>([])
  const [finishedList, setFinishedList] = useState<any[]>([])
  const [summaryByType, setSummaryByType] = useState<any[]>([])
  const [summaryByContributor, setSummaryByContributor] = useState<any[]>([])
  const [monthlyProgress, setMonthlyProgress] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === "pending") fetchPending()
    if (activeTab === "finished") fetchFinished()
    if (activeTab === "summary") fetchSummary()
  }, [activeTab])

  async function fetchPending() {
    const { data } = await supabase.from("pending_michango").select("*").order("created_at", { ascending: false })
    setPendingList(data ?? [])
  }

  async function fetchFinished() {
    const { data } = await supabase.from("finished_michango").select("*").order("created_at", { ascending: false })
    setFinishedList(data ?? [])
  }

  async function fetchSummary() {
    const [typeRes, contribRes, monthlyRes] = await Promise.all([
      supabase.from("michango_summary_by_type").select("*"),
      supabase.from("michango_summary_by_contributor").select("*"),
      supabase.from("michango_monthly_progress").select("*")
    ])
    setSummaryByType(typeRes.data ?? [])
    setSummaryByContributor(contribRes.data ?? [])
    setMonthlyProgress(monthlyRes.data ?? [])
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>📊 Ripoti za Michango</h2>

      <div className={styles.tabBar}>
        <button onClick={() => setActiveTab("pending")} className={activeTab === "pending" ? styles.active : styles.tab}>⏳ Pending Michango</button>
        <button onClick={() => setActiveTab("finished")} className={activeTab === "finished" ? styles.active : styles.tab}>✅ Finished Michango</button>
        <button onClick={() => setActiveTab("summary")} className={activeTab === "summary" ? styles.active : styles.tab}>📈 Summary & Charts</button>
      </div>

      <div className={styles.panel}>
        {activeTab === "pending" && (
          <div className={styles.list}>
            {pendingList.length === 0 ? <p>Hakuna michango inayosubiri</p> :
              pendingList.map(m => (
                <div key={m.id} className={styles.card}>
                  <h4>{m.majina} · {m.kiasi_bado} TZS</h4>
                  <p><strong>Aina:</strong> {m.mchango_type}</p>
                  <p><strong>Lengo:</strong> {m.target}</p>
                  <p><strong>Tarehe:</strong> {m.created_at?.split("T")[0]}</p>
                </div>
              ))}
          </div>
        )}

        {activeTab === "finished" && (
          <div className={styles.list}>
            {finishedList.length === 0 ? <p>Hakuna michango iliyokamilika</p> :
              finishedList.map(m => (
                <div key={m.id} className={styles.card}>
                  <h4>{m.majina} · {m.kiasi_pangwa} TZS</h4>
                  <p><strong>Aina:</strong> {m.mchango_type}</p>
                  <p><strong>Lengo:</strong> {m.target}</p>
                  <p><strong>Tarehe:</strong> {m.created_at?.split("T")[0]}</p>
                </div>
              ))}
          </div>
        )}

        {activeTab === "summary" && (
          <>
            <h3>📋 Michango kwa Aina</h3>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Aina</span><span>Lengo</span><span>Lipwa</span><span>Bado</span>
              </div>
              {summaryByType.map((row, i) => (
                <div key={i} className={styles.tableRow}>
                  <span>{row.mchango_type}</span>
                  <span>{row.target}</span>
                  <span>{row.jumla_lipwa} TZS</span>
                  <span>{row.jumla_bado} TZS</span>
                </div>
              ))}
            </div>

            <h3>📋 Michango kwa Mchangaji</h3>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Majina</span><span>Lipwa</span><span>Bado</span>
              </div>
              {summaryByContributor.map((row, i) => (
                <div key={i} className={styles.tableRow}>
                  <span>{row.majina}</span>
                  <span>{row.jumla_lipwa} TZS</span>
                  <span>{row.bado} TZS</span>
                </div>
              ))}
            </div>

            <h3>📊 Michango ya Mwezi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyProgress}>
                <XAxis dataKey="mwezi" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="jumla_lipwa" fill="#6a1b9a" name="Lipwa" />
                <Bar dataKey="jumla_pangwa" fill="#d1c4e9" name="Pangwa" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
