"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/StoragePanel.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type FileMeta = {
  id: number
  name: string
  event_name: string
  event_type: string
  subtype?: string
  url: string
  created_at?: string
  is_archived?: boolean
  is_deleted?: boolean
}

export default function StoragePanel(){
  const [tab, setTab] = useState<"upload" | "gallery">("upload")
  const [eventName, setEventName] = useState("")
  const [eventType, setEventType] = useState("")
  const [subType, setSubType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [groupedGallery, setGroupedGallery] = useState<Record<string, FileMeta[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tab === "gallery") fetchGallery()
  }, [tab])

  async function handleUpload() {
    if (!file || !eventName || !eventType) return
    setLoading(true)

    const filePath = `${eventType}/${eventName}-${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from("media")
      .upload(filePath, file)

    if (error) {
      console.error("Upload error:", error)
      setLoading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filePath)

    await supabase.from("media_metadata").insert({
      name: file.name,
      event_name: eventName,
      event_type: eventType,
      subtype: subType,
      url: urlData.publicUrl
    })

    setFile(null)
    setEventName("")
    setEventType("")
    setSubType("")
    setLoading(false)
    alert("✅ Umefanikiwa kupakia picha")
  }

  async function fetchGallery() {
    const { data, error } = await supabase
      .from("media_metadata")
      .select("*")
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Gallery error:", error)
      return
    }

    const grouped = (data ?? []).reduce((acc, item) => {
      acc[item.event_type] = acc[item.event_type] || []
      acc[item.event_type].push(item)
      return acc
    }, {} as Record<string, FileMeta[]>)

    setGroupedGallery(grouped)
  }

  async function archiveFile(id: number) {
    await supabase.from("media_metadata").update({ is_archived: true }).eq("id", id)
    fetchGallery()
  }

  async function deleteFile(id: number) {
    await supabase.from("media_metadata").update({ is_deleted: true }).eq("id", id)
    fetchGallery()
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        <button className={tab === "upload" ? styles.activeTab : styles.tab} onClick={() => setTab("upload")}>📤 Upload</button>
        <button className={tab === "gallery" ? styles.activeTab : styles.tab} onClick={() => setTab("gallery")}>🖼️ Gallery</button>
      </div>

      {tab === "upload" && (
        <div className={styles.form}>
          <label>Tukio:</label>
          <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Jina la tukio" />

          <label>Aina ya Tukio:</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="">-- Chagua --</option>
            <option value="sherehe">Sherehe</option>
            <option value="ibada">Ibada</option>
            <option value="kongamano">Kongamano</option>
            <option value="dharura">Dharura</option>
            <option value="ujenzi">Ujenzi</option>
            <option value="ladies">Ladies of Destiny</option>
          </select>

          {eventType === "ibada" && (
            <select value={subType} onChange={(e) => setSubType(e.target.value)}>
              <option value="">-- Ibada --</option>
              <option value="alhamisi">Ibada ya Alhamisi</option>
              <option value="jumapili1">Jumapili ya Kwanza</option>
              <option value="jumapili2">Jumapili ya Pili</option>
            </select>
          )}

          {(eventType === "kongamano" || eventType === "dharura") && (
            <input value={subType} onChange={(e) => setSubType(e.target.value)} placeholder="Jina la kongamano au dharura" />
          )}

          <label>Picha:</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Inapakia..." : "📤 Pakia"}
          </button>
        </div>
      )}

      {tab === "gallery" && (
        <div className={styles.gallery}>
          {Object.entries(groupedGallery).map(([type, files]) => (
            <div key={type}>
              <h3>{type.toUpperCase()}</h3>
              <div className={styles.grid}>
                {files.map((item) => (
                  <div key={item.id} className={styles.thumb}>
                    <img src={item.url} alt={item.name} />
                    <div className={styles.meta}>
                      <strong>{item.event_name}</strong>
                      <span>{item.subtype}</span>
                      <a href={item.url} download>⬇️ Pakua</a>
                      <button onClick={() => archiveFile(item.id)}>📦</button>
                      <button onClick={() => deleteFile(item.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
