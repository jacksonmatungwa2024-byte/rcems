"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useBucket } from "./BucketContext"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FileTable(): JSX.Element {
  const { selectedBucket } = useBucket()
  const [files, setFiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isLarge = (size: number) => size > 50 * 1024 * 1024
  const isOld = (modified: string) => {
    const date = new Date(modified)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return date < sixMonthsAgo
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType =
      filterType === "all" ||
      (filterType === "image" && file.name.match(/\.(jpg|jpeg|png|gif)$/i)) ||
      (filterType === "video" && file.name.match(/\.(mp4|mov|avi)$/i)) ||
      (filterType === "doc" && file.name.match(/\.(pdf|docx|txt)$/i))
    return matchesSearch && matchesType
  })

  const downloadFile = async (name: string) => {
    const { data } = supabase.storage.from(selectedBucket!).getPublicUrl(name)
    window.open(data.publicUrl, "_blank")
  }

  const deleteFile = async (name: string) => {
    const { error } = await supabase.storage.from(selectedBucket!).remove([name])
    if (!error) fetchFiles()
  }

  if (!selectedBucket) return <p style={styles.notice}>Please select a bucket first.</p>

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📁 Files in <span style={styles.bucket}>{selectedBucket}</span></h2>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 Search files..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={styles.input}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.select}>
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="doc">Documents</option>
        </select>
      </div>

      {loading ? (
        <p style={styles.loading}>⏳ Loading files...</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => (
                <tr
                  key={file.name}
                  style={{
                    ...styles.row,
                    ...(isLarge(file.metadata?.size || 0) || isOld(file.metadata?.lastModified || "")
                      ? styles.highlightRow
                      : {})
                  }}
                >
                  <td>{file.name}</td>
                  <td>{formatBytes(file.metadata?.size || 0)}</td>
                  <td>{new Date(file.metadata?.lastModified || "").toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => downloadFile(file.name)} style={styles.actionBtn}>⬇️</button>
                    <button onClick={() => deleteFile(file.name)} style={styles.deleteBtn}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: "100%",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
    background: "#fdfcff",
    animation: "fadeIn 0.5s ease"
  },
  header: {
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#6a1b9a",
    marginBottom: 8
  },
  bucket: {
    fontWeight: 600,
    color: "#009688"
  },
  searchBar: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap"
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: "1rem"
  },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: "1rem"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem"
  },
  row: {
    transition: "background 0.3s ease"
  },
  highlightRow: {
    backgroundColor: "#fff3e0"
  },
  actionBtn: {
    marginRight: 6,
    padding: "6px 10px",
    background: "#6a1b9a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  },
  deleteBtn: {
    padding: "6px 10px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600
  },
  loading: {
    fontSize: "1rem",
    color: "#666",
    textAlign: "center",
    marginTop: 20
  },
  notice: {
    fontSize: "1rem",
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20
  }
}
