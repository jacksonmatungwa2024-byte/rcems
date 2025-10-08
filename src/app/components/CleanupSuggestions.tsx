"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CleanupSuggestions(): JSX.Element {
  const { selectedBucket } = useBucket()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedBucket) fetchFiles()
  }, [selectedBucket])

  const fetchFiles = async () => {
    setLoading(true)
    const { data } = await supabase.storage.from(selectedBucket!).list("", { limit: 1000 })
    if (data) setFiles(data)
    setLoading(false)
  }

  const isLarge = (size: number) => size > 50 * 1024 * 1024
  const isOld = (modified: string) => {
    const date = new Date(modified)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return date < sixMonthsAgo
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const cleanupCandidates = files.filter(file =>
    isLarge(file.metadata?.size || 0) || isOld(file.metadata?.lastModified || "")
  )

  const deleteFile = async (name: string) => {
    const { error } = await supabase.storage.from(selectedBucket!).remove([name])
    if (!error) fetchFiles()
  }

  if (!selectedBucket) return <p>Please select a bucket first.</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🧹 Cleanup Suggestions for {selectedBucket}</h2>
      <p style={styles.subtext}>Files that are large or older than 6 months.</p>

      {loading ? (
        <p>⏳ Scanning files...</p>
      ) : cleanupCandidates.length === 0 ? (
        <p>✅ No cleanup suggestions. Your bucket is lean and clean!</p>
      ) : (
        <ul style={styles.list}>
          {cleanupCandidates.map(file => (
            <li key={file.name} style={styles.listItem}>
              <span>
                {file.name} — {formatBytes(file.metadata?.size || 0)} —{" "}
                {new Date(file.metadata?.lastModified || "").toLocaleDateString()}
              </span>
              <button onClick={() => deleteFile(file.name)} style={styles.deleteBtn}>🗑️ Delete</button>
            </li>
          ))}
        </ul>
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
  list: {
    listStyle: "none",
    paddingLeft: 0
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fce4ec",
    padding: "8px 12px",
    borderRadius: 6,
    marginBottom: 8
  },
  deleteBtn: {
    padding: "4px 8px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer"
  }
}
