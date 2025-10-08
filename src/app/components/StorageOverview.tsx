"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function StorageOverview(): JSX.Element {
  const [plan, setPlan] = useState<"free" | "pro" | "custom" | null>(null)
  const [customDbLimit, setCustomDbLimit] = useState("")
  const [customStorageLimit, setCustomStorageLimit] = useState("")
  const [dbLimit, setDbLimit] = useState<number | null>(null)
  const [storageLimit, setStorageLimit] = useState<number | null>(null)
  const [dbSize, setDbSize] = useState<number | null>(null)
  const [bucketSizes, setBucketSizes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!plan) return
    if (plan === "free") {
      setDbLimit(null)
      setStorageLimit(null)
    } else if (plan === "pro") {
      setDbLimit(8 * 1024 * 1024 * 1024) // 8 GB
      setStorageLimit(500 * 1024 * 1024 * 1024) // 500 GB
    } else if (plan === "custom") {
      const db = parseInt(customDbLimit) * 1024 * 1024 * 1024
      const storage = parseInt(customStorageLimit) * 1024 * 1024 * 1024
      setDbLimit(isNaN(db) ? null : db)
      setStorageLimit(isNaN(storage) ? null : storage)
    }
  }, [plan, customDbLimit, customStorageLimit])

  useEffect(() => {
    if (plan) fetchUsage()
  }, [plan])

  const fetchUsage = async () => {
    setLoading(true)

    const { data: dbData } = await supabase.rpc("get_database_size")
    if (dbData) setDbSize(Number(dbData))

    const { data: buckets } = await supabase.storage.listBuckets()
    if (buckets) {
      const sizes: Record<string, number> = {}
      for (const bucket of buckets) {
        const { data: files } = await supabase.storage.from(bucket.id).list("", { limit: 1000 })
        if (files) {
          const total = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
          sizes[bucket.id] = total
        }
      }
      setBucketSizes(sizes)
    }

    setLoading(false)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const totalBucketUsage = Object.values(bucketSizes).reduce((a, b) => a + b, 0)

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📦 Storage Overview</h2>
      <p style={styles.subtext}>Select your Supabase plan to view usage and remaining space.</p>

      {!plan && (
        <div style={styles.planSelector}>
          <button onClick={() => setPlan("free")} style={styles.planBtn}>🆓 Free Plan</button>
          <button onClick={() => setPlan("pro")} style={styles.planBtn}>💼 Pro Plan ($25)</button>
          <button onClick={() => setPlan("custom")} style={styles.planBtn}>⚙️ Custom Plan</button>
        </div>
      )}

      {plan === "custom" && (
        <div style={styles.customInputs}>
          <label>Database Limit (GB)</label>
          <input type="number" value={customDbLimit} onChange={e => setCustomDbLimit(e.target.value)} style={styles.input} />
          <label>Storage Limit (GB)</label>
          <input type="number" value={customStorageLimit} onChange={e => setCustomStorageLimit(e.target.value)} style={styles.input} />
          <button onClick={fetchUsage} style={styles.refreshBtn}>✅ Apply Limits</button>
        </div>
      )}

      {plan && (
        <>
          <button onClick={fetchUsage} style={styles.refreshBtn}>🔄 Refresh</button>

          {loading ? (
            <p>⏳ Loading...</p>
          ) : (
            <div style={styles.card}>
              <h3 style={styles.sectionHeader}>🧠 Database</h3>
              <p><strong>Used:</strong> {dbSize !== null ? formatBytes(dbSize) : "Unavailable"}</p>
              <p><strong>Limit:</strong> {dbLimit !== null ? formatBytes(dbLimit) : "No limit"}</p>
              <p><strong>Remaining:</strong> {dbSize !== null && dbLimit !== null ? formatBytes(dbLimit - dbSize) : "Unknown"}</p>

              <h3 style={styles.sectionHeader}>🗂️ Buckets</h3>
              <p><strong>Used:</strong> {formatBytes(totalBucketUsage)}</p>
              <p><strong>Limit:</strong> {storageLimit !== null ? formatBytes(storageLimit) : "No limit"}</p>
              <p><strong>Remaining:</strong> {storageLimit !== null ? formatBytes(storageLimit - totalBucketUsage) : "Unknown"}</p>

              <ul style={{ marginTop: 12 }}>
                {Object.entries(bucketSizes).map(([bucket, size]) => (
                  <li key={bucket}><strong>{bucket}:</strong> {formatBytes(size)}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: 600,
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  header: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#4a148c",
    marginBottom: 8
  },
  subtext: {
    fontSize: "0.95rem",
    color: "#555",
    marginBottom: 16
  },
  planSelector: {
    display: "flex",
    gap: 8,
    marginBottom: 16
  },
  planBtn: {
    padding: "8px 12px",
    background: "#6a1b9a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer"
  },
  customInputs: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: "0.9rem"
  },
  refreshBtn: {
    padding: "8px 12px",
    background: "#009688",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 16
  },
  card: {
    background: "#f3e5f5",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  sectionHeader: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 8,
    color: "#6a1b9a"
  }
}
