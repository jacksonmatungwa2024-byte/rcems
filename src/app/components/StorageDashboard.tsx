"use client"

import React, { useState } from "react"
import StorageOverview from "../components/StorageOverview"
import BucketExplorer from "../components/BucketExplorer"
import FileTable from "../components/FileTable"
import CleanupSuggestions from "../components/CleanupSuggestions"
import { useBucket } from "../components/BucketContext"

export default function StorageDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const { selectedBucket } = useBucket()

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "buckets", label: "🗂️ Buckets" },
    { key: "files", label: "📁 Files" },
    { key: "cleanup", label: "🧹 Cleanup" }
  ]

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🧭 Supabase Storage Dashboard</h1>
      <p style={styles.subtext}>Manage your database and bucket usage with clarity and legacy stewardship.</p>

      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabBtn,
              background: activeTab === tab.key ? "#6a1b9a" : "#ede7f6",
              color: activeTab === tab.key ? "#fff" : "#333"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedBucket && (
        <p style={styles.selectedNotice}>
          ✅ Selected bucket: <strong>{selectedBucket}</strong>
        </p>
      )}

      <div style={styles.panel}>
        {activeTab === "overview" && <StorageOverview />}
        {activeTab === "buckets" && <BucketExplorer />}
        {activeTab === "files" && selectedBucket ? (
          <FileTable />
        ) : activeTab === "files" ? (
          <p style={styles.notice}>Please select a bucket from the Buckets tab first.</p>
        ) : null}
        {activeTab === "cleanup" && selectedBucket ? (
          <CleanupSuggestions />
        ) : activeTab === "cleanup" ? (
          <p style={styles.notice}>Please select a bucket from the Buckets tab first.</p>
        ) : null}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  header: {
    fontSize: "1.8rem",
    fontWeight: 900,
    color: "#4a148c",
    marginBottom: 8
  },
  subtext: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: 16
  },
  tabBar: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap"
  },
  tabBtn: {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.95rem"
  },
  selectedNotice: {
    fontSize: "0.95rem",
    color: "#4a148c",
    fontStyle: "italic",
    marginBottom: 8
  },
  panel: {
    background: "#f9f6ff",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
  },
  notice: {
    fontSize: "0.95rem",
    color: "#999",
    fontStyle: "italic"
  }
}
