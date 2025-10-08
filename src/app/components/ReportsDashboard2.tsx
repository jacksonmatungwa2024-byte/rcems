"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "./ReportsDashboard2.module.css"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReportsDashboard2(): JSX.Element {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [watu, setWatu] = useState<any[]>([])
  const [mahadhurio, setMahadhurio] = useState<any[]>([])
  const [wokovu, setWokovu] = useState<any[]>([])

  useEffect(() => {
    fetchAll()
  }, [startDate, endDate])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const start = `${startDate}T00:00:00.000Z`
      const end = `${endDate}T23:59:59.999Z`

      const [watuRes, mhRes, wokovuRes] = await Promise.all([
        supabase.from("watu").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
        supabase.from("mahadhurio").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
        supabase.from("wokovu").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      ])

      if (watuRes.error || mhRes.error || wokovuRes.error) {
        throw watuRes.error || mhRes.error || wokovuRes.error
      }

      setWatu(watuRes.data ?? [])
      setMahadhurio(mhRes.data ?? [])
      setWokovu(wokovuRes.data ?? [])
    } catch (err: any) {
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: ["Waliosajiliwa", "Mahadhurio", "Waliokoka"],
    datasets: [
      {
        label: `Records (${startDate} to ${endDate})`,
        data: [watu.length, mahadhurio.length, wokovu.length],
        backgroundColor: ["#6a1b9a", "#9c27b0", "#ab47bc"],
        borderRadius: 6,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Live Ministry Data" }
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>📊 Reports Dashboard</h2>
        <div className={styles.filters}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
          <button onClick={fetchAll} className={styles.refresh}>Refresh</button>
        </div>
      </header>

      {error && <div className={styles.error}>Error: {error}</div>}

      <section className={styles.chartSection}>
        <Bar data={chartData} options={chartOptions} />
      </section>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h3>Waliosajiliwa</h3>
          <p>{watu.length} records</p>
        </div>
        <div className={styles.card}>
          <h3>Mahadhurio</h3>
          <p>{mahadhurio.length} records</p>
        </div>
        <div className={styles.card}>
          <h3>Waliokoka</h3>
          <p>{wokovu.length} records</p>
        </div>
      </section>

      <section className={styles.tables}>
        {/* Table: Waliosajiliwa */}
        <div className={styles.tableWrap}>
          <h4>Waliosajiliwa</h4>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Majina</th><th>Simu</th><th>Jinsi</th><th>Bahasha</th><th>Created</th></tr>
            </thead>
            <tbody>
              {watu.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina}</td>
                  <td>{r.simu ?? "—"}</td>
                  <td>{r.jinsi}</td>
                  <td>{r.bahasha ?? "—"}</td>
                  <td>{r.created_at?.split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table: Mahadhurio */}
        <div className={styles.tableWrap}>
          <h4>Mahadhurio</h4>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Majina</th><th>Aina</th><th>Ibada</th><th>Tarehe</th></tr>
            </thead>
            <tbody>
              {mahadhurio.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina ?? "—"}</td>
                  <td>{r.aina ?? "—"}</td>
                  <td>{r.ibada ?? "—"}</td>
                  <td>{r.tarehe ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table: Waliokoka */}
        <div className={styles.tableWrap}>
          <h4>Waliokoka</h4>
          <table className={styles.table}>
            <thead>
              <tr><th>#</th><th>Majina</th><th>Tarehe</th><th>Ushuhuda</th></tr>
            </thead>
            <tbody>
              {wokovu.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.majina ?? "—"}</td>
                  <td>{r.tarehe ?? "—"}</td>
                  <td>{r.ushuhuda ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
