"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserRegistration() {
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "user",
    branch: "",
    branch_custom: "",
    bio: "",
    password: "",
    profileFile: null as File | null
  })

  const [branches, setBranches] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showAssignButton, setShowAssignButton] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const loadBranchesAndUsers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("branch, full_name, email, role, profile_url")

      if (!error && data) {
        const uniqueBranches = Array.from(new Set(data.map(u => u.branch).filter(Boolean)))
        setBranches(uniqueBranches)
        setUsers(data)
      }
    }

    loadBranchesAndUsers()
  }, [])

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const generateUsername = async (base: string) => {
    let username = base.toLowerCase().replace(/\s+/g, "")
    let suffix = 1

    while (true) {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single()

      if (!data) break
      username = `${base}${suffix}`
      suffix++
    }

    return username
  }

  const uploadProfileImage = async (file: File, username: string) => {
    const filePath = `profiles/${username}-${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("profiles").upload(filePath, file)
    if (error) return null
    const { data } = supabase.storage.from("profiles").getPublicUrl(filePath)
    return data?.publicUrl || null
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage("")
    setShowAssignButton(false)

    const { full_name, email, phone, role, branch, branch_custom, bio, password, profileFile } = form
    const finalBranch = branch_custom || branch

    if (!email || !password || !full_name) {
      setMessage("❌ Tafadhali jaza jina, barua pepe na nenosiri.")
      setSaving(false)
      return
    }

    const username = await generateUsername(full_name.split(" ")[0])
    const profileUrl = profileFile ? await uploadProfileImage(profileFile, username) : null

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) {
      setMessage(`❌ Auth error: ${authError.message}`)
      setSaving(false)
      return
    }

    const { error: dbError } = await supabase
      .from("users")
      .insert([{
        username,
        full_name,
        email,
        phone,
        role,
        branch: finalBranch,
        bio,
        profile_url: profileUrl,
        is_active: true,
        metadata: { allowed_tabs: [] }
      }])

    if (dbError) {
      setMessage(`❌ DB error: ${dbError.message}`)
      setSaving(false)
      return
    }

    if (!branches.includes(finalBranch) && finalBranch) {
      setBranches(prev => [...prev, finalBranch])
    }

    setMessage(`✅ ${full_name} ameandikishwa kama ${role}.`)
    setForm({
      full_name: "",
      email: "",
      phone: "",
      role: "user",
      branch: "",
      branch_custom: "",
      bio: "",
      password: "",
      profileFile: null
    })
    setShowAssignButton(true)
    setSaving(false)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📝 Usajili wa Mtumiaji Mpya</h2>

      <div style={styles.formGroup}>
        <input style={styles.input} type="text" placeholder="🧍 Full Name" value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} />
        <input style={styles.input} type="email" placeholder="📧 Email" value={form.email} onChange={e => handleChange("email", e.target.value)} />

        <div style={{ position: "relative" }}>
          <input
            style={styles.input}
            type={showPassword ? "text" : "password"}
            placeholder="🔒 Password"
            value={form.password}
            onChange={e => handleChange("password", e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1rem",
              color: "#6a1b9a"
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <input style={styles.input} type="text" placeholder="📞 Phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
        <select style={styles.input} value={form.role} onChange={e => handleChange("role", e.target.value)}>
          <option value="user">User</option>
          <option value="usher">Usher</option>
          <option value="pastor">Pastor</option>
          <option value="media">Media</option>
          <option value="finance">Finance</option>
          <option value="admin">Admin</option>
        </select>
        <select style={styles.input} value={form.branch} onChange={e => handleChange("branch", e.target.value)}>
          <option value="">Chagua tawi</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input style={styles.input} type="text" placeholder="✍️ Au andika tawi jipya" value={form.branch_custom} onChange={e => handleChange("branch_custom", e.target.value)} />
        <input style={styles.input} type="text" placeholder="🧠 Bio" value={form.bio} onChange={e => handleChange("bio", e.target.value)} />
        <input style={styles.input} type="file" accept="image/*" onChange={e => handleChange("profileFile", e.target.files?.[0] || null)} />

        <button style={styles.button} onClick={handleSubmit} disabled={saving}>
          📥 Sajili Mtumiaji
        </button>

        {message && <div style={styles.message}>{message}</div>}

        {showAssignButton && (
          <button style={{ ...styles.button, ...styles.buttonAlt }} onClick={() => router.push("/admin-tabs")}>
            🛠️ Assign Tabs
          </button>
        )}
      </div>

      <hr style={styles.divider} />

      <h3 style={styles.subHeader}>👥 Watumiaji Waliosajiliwa</h3>
      <ul style={styles.userList}>
        {users.map(u => (
          <li key={u.email} style={styles.userItem}>
            {u.profile_url && <img src={u.profile_url} alt="profile" style={styles.avatar} />}
            {u.full_name} ({u.role}) — {u.email}
          </li>
        ))}
      </ul>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 24,
    fontFamily: "'Segoe UI', Roboto, Inter, sans-serif",
    background: "linear-gradient(to bottom right, #f3e5f5, #ede7f6)",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  header: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#6a1b9a",
    marginBottom: 8
  },
  subHeader: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#4a148c",
    marginTop: 32
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20
  },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: "1rem",
    fontWeight: 600,
    background: "#fff",
    transition: "box-shadow 0.3s ease"
  },
  button: {
    padding: "12px 18px",
    background: "#6a1b9a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    cursor: "pointer",
    transition: "transform 0.2s ease"
  },
  buttonAlt: {
    background: "#009688",
    marginTop: 12
  },
  message: {
    marginTop: 12,
    fontWeight: 700,
    color: "#2e7d32"
  },
  userList: {
    marginTop: 12,
    fontSize: "0.95rem",
    color: "#333",
    listStyle: "none",
    paddingLeft: 0
  },
  userItem: {
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f3f3f3",
    padding: "8px 12px",
    borderRadius: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #6a1b9a"
  },
  divider: {
    margin: "40px 0",
    borderColor: "#ddd"
  }
}
