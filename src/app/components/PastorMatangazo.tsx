"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "./PastorMatangazo.module.css"

// ✅ Define a type for each announcement
type Announcement = {
  title: string
  description: string
  file: File | null
  scheduled_for: string
}

// ✅ Define a type for your user data
type User = {
  id: string
  full_name: string
  role: string
  branch: string
  is_active: boolean
}

// ✅ Supabase initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PastorMatangazo() {
  const [users, setUsers] = useState<User[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [branchFilter, setBranchFilter] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [role, setRole] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { title: "", description: "", file: null, scheduled_for: "" }
  ])
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [branchFilter])

  // ✅ Type-safe fetch
  async function fetchUsers() {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, role, branch, is_active")
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching users:", error)
      return
    }

    const filtered = branchFilter
      ? data?.filter((u) => u.branch === branchFilter)
      : data

    const uniqueBranches = Array.from(
      new Set(data?.map((u) => u.branch).filter(Boolean))
    ) as string[]

    setBranches(uniqueBranches)
    setUsers(filtered ?? [])
  }

  // ✅ Type-safe update function
  function updateAnnouncement<K extends keyof Announcement>(
    index: number,
    field: K,
    value: Announcement[K]
  ) {
    setAnnouncements((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function addAnnouncement() {
    setAnnouncements((prev) => [
      ...prev,
      { title: "", description: "", file: null, scheduled_for: "" }
    ])
  }

  async function submitMatangazo() {
    if (!selectedUser || announcements.length === 0) {
      setMessage("⚠️ Tafadhali chagua mtumishi na jaza angalau tangazo moja")
      return
    }

    setSubmitting(true)

    try {
      for (const ann of announcements) {
        let fileUrl: string | null = null

        if (ann.file) {
          // ✅ TypeScript-safe file handling
          const fileName = `${Date.now()}_${ann.file.name}`
          const { error: uploadError } = await supabase.storage
            .from("matangazo")
            .upload(fileName, ann.file)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from("matangazo")
            .getPublicUrl(fileName)

          fileUrl = urlData?.publicUrl ?? null
        }

        await supabase.from("pastor_announcements").insert({
          receiver_name: selectedUser,
          receiver_role: role,
          title: ann.title,
          description: ann.description,
          media_url: fileUrl,
          scheduled_for: ann.scheduled_for || null,
          status: "pending"
        })
      }

      setMessage("✅ Matangazo yametumwa kwa mafanikio")
      setAnnouncements([{ title: "", description: "", file: null, scheduled_for: "" }])
      setSelectedUser("")
      setRole("")
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu wakati wa kutuma matangazo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <h3>📣 Tuma Matangazo kwa Mtumishi</h3>

      {/* Branch Filter */}
      <div className={styles.formGroup}>
        <label>Chuja kwa Tawi</label>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">-- Tawi --</option>
          {branches.map((b, i) => (
            <option key={i} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* User Selector */}
      <div className={styles.formGroup}>
        <label>Chagua Mtumishi</label>
        <input
          type="text"
          list="userList"
          value={selectedUser}
          onChange={(e) => {
            const name = e.target.value
            setSelectedUser(name)
            const found = users.find((u) => u.full_name === name)
            setRole(found?.role ?? "")
          }}
          placeholder="Tafuta jina..."
        />
        <datalist id="userList">
          {users.map((u) => (
            <option key={u.id} value={u.full_name} />
          ))}
        </datalist>
        {role && (
          <p>
            <strong>Role:</strong> {role}
          </p>
        )}
      </div>

      {/* Announcements */}
      {announcements.map((ann, i) => (
        <div key={i} className={styles.announcementCard}>
          <label>Tangazo #{i + 1}</label>
          <input
            type="text"
            placeholder="Jina la Tangazo"
            value={ann.title}
            onChange={(e) => updateAnnouncement(i, "title", e.target.value)}
          />
          <textarea
            placeholder="Maelezo ya Tangazo"
            value={ann.description}
            onChange={(e) => updateAnnouncement(i, "description", e.target.value)}
            rows={3}
          />
          <input
            type="datetime-local"
            value={ann.scheduled_for}
            onChange={(e) =>
              updateAnnouncement(i, "scheduled_for", e.target.value)
            }
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
            onChange={(e) =>
              updateAnnouncement(i, "file", e.target.files?.[0] ?? null)
            }
          />
        </div>
      ))}

      <button onClick={addAnnouncement}>➕ Ongeza Tangazo</button>
      <button onClick={submitMatangazo} disabled={submitting}>
        📤 Tuma Matangazo
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
