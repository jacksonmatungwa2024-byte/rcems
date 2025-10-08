"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BucketExplorer() {
  const { setSelectedBucket } = useBucket()
  const [buckets, setBuckets] = useState<{ id: string }[]>([])
  const [bucketSizes, setBucketSizes] = useState<Record<string, number>>({})
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null)
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBuckets()
  }, [])

  const fetchBuckets = async () => {
    setLoading(true)
    const { data: bucketList } = await supabase.storage.listBuckets()
    if (bucketList) {
      setBuckets(bucketList)
      const sizes: Record<string, number> = {}
      for (const bucket of bucketList) {
        const { data: fileList } = await supabase.storage.from(bucket.id).list("", { limit: 1000 })
        if (fileList) {
          const total = fileList.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
          sizes[bucket.id] = total
        }
      }
      setBucketSizes(sizes)
    }
    setLoading(false)
  }

  const loadFiles = async (bucketId: string) => {
    setExpandedBucket(bucketId)
    const { data: fileList } = await supabase.storage.from(bucketId).list("", { limit: 1000 })
    if (fileList) setFiles(fileList)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🗂️ Bucket Explorer</h2>
      <p style={styles.subtext}>Click a bucket to view its files and select it for other tabs.</p>

      <button onClick={fetchBuckets} style={styles.refreshBtn}>🔄 Refresh Buckets</button>

      {loading ? (
        <p>⏳ Loading buckets...</p>
      ) : (
        <div style={styles.bucketList}>
          {buckets.map(bucket => (
            <div key={bucket.id} style={styles.bucketCard}>
              <div style={styles.bucketHeader} onClick={() => loadFiles(bucket.id)}>
                <strong>{bucket.id}</strong>
                <span>{formatBytes(bucketSizes[bucket.id] || 0)}</span>
              </div>

              <button onClick={() => setSelectedBucket(bucket.id)} style={styles.selectBtn}>
                ✅ Select
              </button>

              {expandedBucket === bucket.id && (
                <div style={styles.fileList}>
                  {files.length === 0 ? (
                    <p>No files found.</p>
                  ) : (
                    <ul>
                      {files.map(file => (
                        <li key={file.name}>
                          {file.name} — {formatBytes(file.metadata?.size || 0)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: 700,
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  header: {
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#4a148c",
    marginBottom: 8
  },
  subtext: {
    fontSize: "0.95rem",
    color: "#555",
    marginBottom: 16
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
  bucketList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  bucketCard: {
    background: "#f3e5f5",
    padding: 12,
    borderRadius: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  bucketHeader: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "1rem",
    marginBottom: 8
  },
  fileList: {
    paddingLeft: 12,
    fontSize: "0.9rem"
  },
  selectBtn: {
    marginTop: 8,
    padding: "6px 10px",
    background: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  }
}
