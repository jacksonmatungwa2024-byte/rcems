"use client"

import React, { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { Chart as ChartJS, ArcElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js"
import { Pie, Line } from "react-chartjs-2"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import styles from "../components/UsagePanel.module.css"

ChartJS.register(ArcElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024 // 5 GB

export default function UsagePanel() {
  const [usedBytes, setUsedBytes] = useState(0)
  const [eventUsage, setEventUsage] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<{ date: string; total: number }[]>([])
  const [alert, setAlert] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUsage()

    const subscription = supabase
      .channel("media-usage")
      .on("postgres_changes", { event: "*", schema: "public", table: "media_metadata" }, () => {
        fetchUsage()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  async function fetchUsage() {
    const { data, error } = await supabase
      .from("media_metadata")
      .select("event_type, size, created_at")
      .eq("is_deleted", false)

    if (error || !data) return

    const total = data.reduce((sum, item) => sum + (item.size ?? 0), 0)
    setUsedBytes(total)

    const grouped = data.reduce((acc, item) => {
      const type = item.event_type ?? "other"
      acc[type] = acc[type] || 0
      acc[type] += item.size ?? 0
      return acc
    }, {} as Record<string, number>)
    setEventUsage(grouped)

    const byDate = data.reduce((acc, item) => {
      const date = item.created_at?.split("T")[0] ?? "unknown"
      acc[date] = acc[date] || 0
      acc[date] += item.size ?? 0
      return acc
    }, {} as Record<string, number>)

    const historyData = Object.entries(byDate).map(([date, total]) => ({ date, total }))
    setHistory(historyData)

    setAlert(total > STORAGE_QUOTA * 0.8)
  }

  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2)
  const remainingGB = ((STORAGE_QUOTA - usedBytes) / (1024 * 1024 * 1024)).toFixed(2)
  const percentUsed = Math.min((usedBytes / STORAGE_QUOTA) * 100, 100).toFixed(1)

  const pieData = {
    labels: Object.keys(eventUsage),
    datasets: [
      {
        data: Object.values(eventUsage).map(b => (b / (1024 * 1024)).toFixed(2)),
        backgroundColor: ["#6a1b9a", "#9c27b0", "#ab47bc", "#ce93d8", "#f3e5f5", "#8e24aa"]
      }
    ]
  }

  const lineData = {
    labels: history.map(h => h.date),
    datasets: [
      {
        label: "Matumizi ya Hifadhi (MB)",
        data: history.map(h => (h.total / (1024 * 1024)).toFixed(2)),
        borderColor: "#6a1b9a",
        backgroundColor: "#ce93d8",
        fill: false
      }
    ]
  }

  async function exportPDF() {
    if (!panelRef.current) return
    const canvas = await html2canvas(panelRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF()
    pdf.text("Ripoti ya Matumizi ya Hifadhi", 14, 16)
    pdf.addImage(imgData, "PNG", 10, 20, 190, 0)
    pdf.save("matumizi-hifadhi.pdf")
  }

  return (
    <div className={styles.container} ref={panelRef}>
      <div className={styles.heading}>📊 Matumizi ya Hifadhi</div>

      {alert && <div className={styles.alert}>⚠️ Zaidi ya 80% ya hifadhi imetumika!</div>}

      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${percentUsed}%` }} />
      </div>
      <div className={styles.paragraph}><strong>{usedGB} GB</strong> zimetumika · <strong>{remainingGB} GB</strong> zimebaki</div>
      <div className={styles.paragraph}>{percentUsed}% ya hifadhi imetumika</div>

      <div className={styles.subheading}>📁 Matumizi kwa Tukio</div>
      <Pie data={pieData} />

      <div className={styles.subheading}>📈 Historia ya Matumizi</div>
      <Line data={lineData} />

      <button className={styles.exportBtn} onClick={exportPDF}>📄 Pakua PDF</button>
    </div>
  )
}
