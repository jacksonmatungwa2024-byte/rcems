"use client"
import type { TabType } from "../usher/page"; // ✅ import the same type from page.tsx
import React, { useEffect, useState, useRef } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { SetActiveTab } from "@/types/tabs";

interface ReportsDashboardProps {
  setActiveTab: SetActiveTab;
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type Row = { [key: string]: any }


interface Props {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}



// Existing style objects
const container: React.CSSProperties = {
  maxWidth: 1100,
  margin: "18px auto",
  padding: 16,
  fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial',
  background: "linear-gradient(180deg,#ffffff,#fbf8ff)",
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(105,30,120,0.06)",
  color: "#222"
}
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, color: "#4a148c", fontSize: 18, fontWeight: 700 }
const controls: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }
const input: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6dff2", minWidth: 140 }
const button: React.CSSProperties = { background: "#6a1b9a", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }
const subPanel: React.CSSProperties = { marginTop: 12, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #f0e7fa" }
const chartWrap: React.CSSProperties = { marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", marginTop: 12 }
const th: React.CSSProperties = { textAlign: "left", padding: "8px", borderBottom: "2px solid #f0e9f6", background: "#faf7fe", color: "#4b2a5a" }
const td: React.CSSProperties = { padding: "8px", borderBottom: "1px solid #f4eef8" }
const footerActions: React.CSSProperties = { display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }
const badge: React.CSSProperties = { display: "inline-block", fontSize: 12, padding: "4px 8px", borderRadius: 999, background: "#eee" }

// Define the missing 'card' style
const card: React.CSSProperties = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  minWidth: 120,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  color: "#4b2a5a"
}

/**
 * ReportsDashboard
 *
 * Loads data from tables with optional date filtering.
 * Supports auto-refresh, CSV/Excel export, print/PDF, and tabular views.
 */

export default function SajiliUshuhuda({ setActiveTab }: Props) {
  const [date, setDate] = useState<string>("") // empty = all-time; format: YYYY-MM-DD, YYYY-MM, YYYY
  const [loading, setLoading] = useState<boolean>(false)
  const [summary, setSummary] = useState({
    wokovu: 0,
    watu: 0,
    ushuhuda: 0,
    mafunzo: 0,
    mahadhurio: 0
  })
  const [rows, setRows] = useState<{ [k: string]: Row[] }>({
    wokovu: [],
    watu: [],
    ushuhuda: [],
    mafunzo: [],
    mahadhurio: []
  })
  const [activeGroup, setActiveGroup] = useState<keyof typeof rows>("wokovu")
  const [autoRefreshOn, setAutoRefreshOn] = useState<boolean>(true)
  const refreshTimer = useRef<number | null>(null)
  const printRef = useRef<HTMLDivElement | null>(null)

  // Load data on initial render & when date or auto-refresh toggles
  useEffect(() => {
    loadAll()
    if (autoRefreshOn) {
      startAutoRefresh()
    }
    return () => stopAutoRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, autoRefreshOn])

  function startAutoRefresh() {
    stopAutoRefresh()
    refreshTimer.current = window.setInterval(() => {
      loadAll()
    }, 2 * 60 * 1000)
  }
  function stopAutoRefresh() {
    if (refreshTimer.current) {
      window.clearInterval(refreshTimer.current)
      refreshTimer.current = null
    }
  }

  // Generate filter based on date string
  function getDateFilter(query: any, dateStr: string) {
    if (!dateStr) return query
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // exact date
      return query.eq("tarehe", dateStr)
    } else if (/^\d{4}-\d{2}$/.test(dateStr)) {
      // year-month
      return query.like("tarehe", `${dateStr}-%`)
    } else if (/^\d{4}$/.test(dateStr)) {
      // year only
      return query.like("tarehe", `${dateStr}-%`)
    }
    return query
  }

  async function loadAll() {
    setLoading(true)
    try {
      const newRows: typeof rows = { wokovu: [], watu: [], ushuhuda: [], mafunzo: [], mahadhurio: [] }

      // Wokovu
      {
        let q = supabase.from("wokovu").select("*").order("tarehe", { ascending: false }).limit(1000)
        q = getDateFilter(q, date)
        const { data, error } = await q
        if (error) throw error
        newRows.wokovu = data as Row[]
      }

      // Watu
      {
        let q = supabase.from("watu").select("*").order("created_at", { ascending: false }).limit(1000)
        q = getDateFilter(q, date)
        const { data, error } = await q
        if (error) throw error
        newRows.watu = data as Row[]
      }

      // Ushuhuda
      {
        let q = supabase.from("ushuhuda").select("*").order("tarehe", { ascending: false }).limit(2000)
        q = getDateFilter(q, date)
        const { data, error } = await q
        if (error) throw error
        newRows.ushuhuda = data as Row[]
      }

      // Mafunzo
      {
        let q = supabase.from("mafunzo").select("*").order("tarehe", { ascending: false }).limit(3000)
        q = getDateFilter(q, date)
        const { data, error } = await q
        if (error) throw error
        newRows.mafunzo = data as Row[]
      }

      // Mahadhurio
      {
        let q = supabase.from("mahadhurio").select("*").order("tarehe", { ascending: false }).limit(2000)
        q = getDateFilter(q, date)
        const { data, error } = await q
        if (error) throw error
        newRows.mahadhurio = data as Row[]
      }

      setRows(newRows)
      setSummary({
        wokovu: newRows.wokovu.length,
        watu: newRows.watu.length,
        ushuhuda: newRows.ushuhuda.length,
        mafunzo: newRows.mafunzo.length,
        mahadhurio: newRows.mahadhurio.length
      })
    } catch (err) {
      console.error("LoadAll error:", err instanceof Error ? err.message : err)
      console.error("Full error object:", err)
    } finally {
      setLoading(false)
    }
  }

  // MiniBarChart component
  function MiniBarChart({ value, max = 100 }: { value: number; max?: number }) {
    const pct = max === 0 ? 0 : Math.min(100, Math.round((value / Math.max(1, max)) * 100))
    const w = Math.max(40, Math.round((pct / 100) * 240))
    return (
      <svg width="260" height="36" style={{ display: "block" }}>
        <rect x={0} y={8} width={260} height={20} rx={10} fill="#efe9f6" />
        <rect x={0} y={8} width={w} height={20} rx={10} fill="url(#g1)" />
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#6a1b9a" />
            <stop offset="100%" stopColor="#9c27b0" />
          </linearGradient>
        </defs>
        <text x={8} y={24} fontSize={12} fill="#fff" fontWeight={700}>
          {value}
        </text>
      </svg>
    )
  }

  // CSV download function
  function downloadCSV(data: Row[], filename = "report.csv") {
    if (!data || data.length === 0) {
      alert("Hakuna data ya kupakua")
      return
    }
    const keys = Object.keys(data[0])
    const csvContent = [keys.join(",")].concat(
      data.map((row) =>
        keys
          .map((k) => {
            const v = row[k] ?? ""
            const cell = String(v).replace(/"/g, '""')
            return `"${cell}"`
          })
          .join(",")
      )
    ).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print handler
  function handlePrint() {
    if (!printRef.current) {
      window.print()
      return
    }
    const original = document.body.innerHTML
    const printContent = printRef.current.innerHTML
    document.body.innerHTML = printContent
    window.print()
    document.body.innerHTML = original
    window.location.reload()
  }

  const maxSummary = Math.max(1, summary.wokovu, summary.watu, summary.ushuhuda, summary.mafunzo, summary.mahadhurio)

  return (
    <div style={container}>
      {/* Header controls */}
      <div style={header}>
        <h3 style={titleStyle}>Reports Dashboard</h3>
        <div style={controls}>
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button style={button} onClick={() => loadAll()}>Run</button>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={autoRefreshOn}
              onChange={(e) => setAutoRefreshOn(e.target.checked)}
            />
            Auto-refresh 2m
          </label>
          <button style={{ ...button, background: "#2e7d32" }} onClick={() => downloadCSV(rows[activeGroup], `${activeGroup}-report.csv`)}>Download CSV</button>
          <button style={{ ...button, background: "#0277bd" }} onClick={() => downloadCSV(rows[activeGroup], `${activeGroup}-report.xls`)}>Download Excel</button>
          <button style={{ ...button, background: "#616161" }} onClick={handlePrint}>Print / PDF</button>
          <button style={{ ...button, background: "#9e9e9e" }} onClick={() => setActiveTab && setActiveTab("home")}>Back</button>
        </div>
      </div>

      {/* Content */}
      <div ref={printRef}>
        {/* Summary Panel */}
        <div style={subPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Summary</div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                {/* Summary Cards */}
                {[
                  { label: "Waliyookoka", value: summary.wokovu },
                  { label: "Waliosajiliwa", value: summary.watu },
                  { label: "Walioshuhudia", value: summary.ushuhuda },
                  { label: "Mafunzo", value: summary.mafunzo },
                  { label: "Mahadhurio", value: summary.mahadhurio }
                ].map((item, index) => (
                  <div key={index} style={card}>
                    <div style={{ fontSize: 13, color: "#4b2a5a", fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 22, marginTop: 6 }}>{item.value}</div>
                    <MiniBarChart value={item.value} max={maxSummary} />
                  </div>
                ))}
              </div>
            </div>
            {/* Group selector */}
            <div style={{ minWidth: 240 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Group View</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {(["wokovu", "watu", "ushuhuda", "mafunzo", "mahadhurio"] as (keyof typeof rows)[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: activeGroup === g ? "2px solid #6a1b9a" : "1px solid #e6dff2",
                      background: activeGroup === g ? "#f4eafa" : "#fff",
                      cursor: "pointer",
                      fontWeight: 700
                    }}
                  >
                    {g} <span style={badge}>{rows[g].length}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Charts & Data */}
          <div style={chartWrap}>
            {/* Top 6 */}
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontSize: 13, color: "#666" }}>Top records ({activeGroup})</div>
              <div style={{ marginTop: 8 }}>
                {rows[activeGroup].slice(0, 6).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #f1eef7" }}>
                    <div style={{ color: "#333", fontWeight: 600 }}>
                      {r.majina ?? r.muumini_namba ?? r.id ?? `#${i + 1}`}
                    </div>
                    <div style={{ color: "#666" }}>{r.tarehe ?? r.inserted_at ?? ""}</div>
                  </div>
                ))}
                {rows[activeGroup].length === 0 && <div style={{ color: "#777", padding: 8 }}>Hakuna rekodi</div>}
              </div>
            </div>
            {/* Distribution by date */}
            <div style={{ width: 340 }}>
              <div style={{ fontSize: 13, color: "#666" }}>Distribution by date (last 12)</div>
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const counts: Record<string, number> = {}
                  rows[activeGroup].forEach((r) => {
                    const d = r.tarehe ? String(r.tarehe).split("T")[0] : (r.inserted_at ? String(r.inserted_at).split("T")[0] : "unknown")
                    counts[d] = (counts[d] || 0) + 1
                  })
                  const entries = Object.entries(counts).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12)
                  const max = Math.max(1, ...entries.map((e) => e[1]))
                  return entries.length === 0 ? <div style={{ color: "#777", padding: 8 }}>Hakuna data</div> : entries.map(([d, c], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 68, fontSize: 12, color: "#444" }}>{d}</div>
                      <div style={{ flex: 1, height: 12, background: "#efe9f6", borderRadius: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.round((c / max) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#6a1b9a,#9c27b0)" }} />
                      </div>
                      <div style={{ width: 36, textAlign: "right", fontSize: 12, color: "#333" }}>{c}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Table and actions */}
        <div style={subPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4b2a5a" }}>
  {(activeGroup as string).toUpperCase()} — Table
</div>

            <div style={{ fontSize: 12, color: "#666" }}>{loading ? "Loading..." : `Rows: ${rows[activeGroup].length}`}</div>
          </div>
          {/* Data table */}
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>{renderTableHeaders(rows[activeGroup])}</tr>
              </thead>
              <tbody>
                {rows[activeGroup].map((r, i) => (
                  <tr key={i}>{renderTableRow(r)}</tr>
                ))}
                {rows[activeGroup].length === 0 && (
                  <tr>
                    <td style={td} colSpan={10}>Hakuna rekodi kuonyesha</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Footer buttons */}
          <div style={footerActions}>
            <button style={button} onClick={() => downloadCSV(rows[activeGroup], `${activeGroup}-report.csv`)}>Download CSV</button>
            <button style={{ ...button, background: "#0277bd" }} onClick={() => downloadCSV(rows[activeGroup], `${activeGroup}-report.xls`)}>Download Excel</button>
            <button style={{ ...button, background: "#616161" }} onClick={handlePrint}>Print / PDF</button>
          </div>
        </div>
      </div>
    </div>
  )

  // Helper functions for table headers, rows, and cells
  function renderTableHeaders(data: Row[]) {
    const keys = data.length > 0 ? Object.keys(data[0]) : ["id", "majina", "muumini_namba", "tarehe"]
    return keys.map((k) => <th key={k} style={th}>{k}</th>)
  }

  function renderTableRow(row: Row) {
    const keys = Object.keys(row)
    return keys.map((k) => <td key={k} style={td}>{renderCell(row[k])}</td>)
  }

  function renderCell(val: any) {
    if (val === null || typeof val === "undefined") return ""
    if (typeof val === "object") return JSON.stringify(val)
    return String(val)
  }
}