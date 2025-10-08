"use client"

import React, { useState, useEffect } from "react"
import { createClient, User } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
  id: number
  body: string
  sender_id: number
  sender_username: string
  recipient_id?: number
  recipient_branch?: string
  recipient_role?: string
  is_broadcast?: boolean
  reply_to?: number
  created_at: string
  read_by?: number[]
}

export default function MessagingApp() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox")
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchAuthUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setAuthUser(data.user)
    }

    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, branch, role, is_active")
        .eq("is_active", true)

      setUsers(data || [])
      const uniqueBranches = [...new Set(data?.map(u => u.branch).filter(Boolean))]
      setBranches(uniqueBranches)
    }

    fetchAuthUser()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!authUser) return

    const fetchMessages = async () => {
      let query = supabase.from("messages").select("*").order("created_at", { ascending: false })

      if (activeTab === "inbox") {
        query = query.contains("read_by", [Number(authUser.id)])
      } else {
        query = query.eq("sender_id", Number(authUser.id))
      }

      const { data } = await query
      setMessages(data || [])
    }

    fetchMessages()

    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "messages"
      }, payload => {
        const msg = payload.new as Message
        if (msg) setMessages(prev => [msg, ...prev.filter(m => m.id !== msg.id)])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [authUser, activeTab])

  const senderId = Number(authUser?.id)
if (!senderId || isNaN(senderId)) {
  return setError("Hakuna mtumaji aliyeingia. Tafadhali hakikisha umeingia kwenye mfumo.")


    const senderId = Number(authUser?.id)
    const senderName = users.find(u => u.id === senderId)?.full_name || "Mtumaji"
    const recipientId = selectedUserId ? Number(selectedUserId) : null

    const { error } = await supabase.from("messages").insert({
      body: newMessage,
      sender_id: senderId,
      sender_username: senderName,
      recipient_id: recipientId,
      recipient_branch: selectedBranch || null,
      recipient_role: null,
      is_broadcast: !recipientId && !selectedBranch,
      reply_to: replyToId
    })

    if (error) return setError(error.message)

    setNewMessage("")
    setSelectedUserId("")
    setSelectedBranch("")
    setReplyToId(null)
    setSuccess("✅ Ujumbe umetumwa kwa neema.")
  }

  const handleMarkAsRead = async (msgId: number) => {
    const msg = messages.find(m => m.id === msgId)
    const userId = Number(authUser?.id)
    if (!msg || msg.read_by?.includes(userId)) return

    const updatedReadBy = [...(msg.read_by || []), userId]
    await supabase.from("messages").update({ read_by: updatedReadBy }).eq("id", msgId)
  }

  const handleDelete = async (id: number) => {
    await supabase.from("messages").delete().eq("id", id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div style={wrapperStyle}>
      <h2 style={headingStyle}>📱 Ujumbe wa Kiroho</h2>

      <div style={tabStyle}>
        <button onClick={() => setActiveTab("inbox")} style={tabBtn(activeTab === "inbox")}>📥 Inbox</button>
        <button onClick={() => setActiveTab("sent")} style={tabBtn(activeTab === "sent")}>📤 Sent</button>
      </div>

      <div style={messageListStyle}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={bubbleStyle(msg.sender_id === Number(authUser?.id))}
            onClick={() => handleMarkAsRead(msg.id)}
          >
            <div style={{ fontWeight: "bold" }}>{msg.sender_username}</div>
            {msg.reply_to && (
              <p style={threadStyle}>
                🔗 Jibu la: {messages.find(m => m.id === msg.reply_to)?.body?.slice(0, 50)}...
              </p>
            )}
            <div>{msg.body}</div>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>
              {new Date(msg.created_at).toLocaleString("sw-TZ")}
              {msg.is_broadcast && <span style={badgeStyle}>📢 Tangazo</span>}
            </div>
            <button onClick={() => setReplyToId(msg.id)} style={replyBtnStyle}>↩️ Jibu</button>
            {msg.sender_id === Number(authUser?.id) && (
              <button onClick={() => handleDelete(msg.id)} style={deleteBtnStyle}>🗑️ Futa</button>
            )}
          </div>
        ))}
      </div>

      {replyToId && (
        <div style={replyPreviewStyle}>
          <strong>Unajibu ujumbe:</strong>
          <p>{messages.find(m => m.id === replyToId)?.body}</p>
          <button onClick={() => setReplyToId(null)} style={cancelReplyStyle}>❌ Futa</button>
        </div>
      )}

      <div style={composerStyle}>
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          style={inputStyle}
        >
          <option value="">👤 Chagua Mtumiaji</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name} — {user.branch || "—"} ({user.role})
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          style={inputStyle}
        >
          <option value="">🌿 Chagua Tawi</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>

        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Andika ujumbe wako hapa..."
          style={inputStyle}
        />

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <button onClick={handleSendMessage} style={btnStyle}>
          ✅ Tuma Ujumbe
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.85rem", color: "#777", marginTop: 12 }}>
        🕊️ Ujumbe huu ni sehemu ya ushuhuda wako. Tuma kwa neema, jibu kwa upendo.
      </p>
    </div>
  )
}

const tabBtn = (active: boolean) => ({
  padding: "6px 12px",
  borderRadius: 20,
  border: "none",
  background: active ? "#0d47a1" : "#e0e0e0",
  color: active ? "#fff" : "#333",
  fontWeight: 600,
  cursor: "pointer"
})

const messageListStyle = {
  maxHeight: 300,
  overflowY: "auto",
  marginBottom: 12,
  padding: 8,
  background: "#f5f5f5",
  borderRadius: 12
}

const bubbleStyle = (isSender: boolean) => ({
  background: isSender ? "#d1c4e9" : "#fff",
  padding: 10,
  borderRadius: 12,
  marginBottom: 10,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
})

const badgeStyle = {
  background: "#ff9800",
  color: "#fff",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: "0.8rem",
  marginLeft: 8
}

const replyBtnStyle = {
  marginTop: 6,
  background: "transparent",
  border: "none",
  color: "#1976d2",
  fontSize: "0.9rem",
  cursor: "pointer"
}

const deleteBtnStyle = {
  marginTop: 6,
  background: "transparent",
  border: "none",
  color: "#d32f2f",
  fontSize: "0.9rem",
  cursor: "pointer"
}

const threadStyle = {
  fontStyle: "italic",
  fontSize: "0.9rem",
  color: "#555",
  marginBottom: 4
}

const replyPreviewStyle = {
  background: "#e3f2fd",
  padding: 8,
  borderRadius: 8,
  marginBottom: 12
}

const cancelReplyStyle = {
  background: "transparent",
  border: "none",
  color: "#d32f2f",
  fontSize: "0.9rem",
  cursor: "pointer"
}

const composerStyle = {
  background: "#fff",
  padding: 12,
  borderRadius: 12,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
}

const inputStyle = {
  width: "100%",
  padding: 10,
  fontSize: "1rem",
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 10
}

const btnStyle = {
  width: "100%",
  padding: "10px 16px",
  background: "#0d47a1",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer"
}

const errorStyle = {
  color: "#d32f2f",
  marginBottom: 8,
  fontWeight: 600,
  fontSize: "0.9rem"
}

const successStyle = {
  color: "#388e3c",
  marginBottom: 8,
  fontWeight: 600,
  fontSize: "0.9rem"
}

const wrapperStyle = {
  padding: 16,
  maxWidth: 480,
  margin: "0 auto",
  fontFamily: "Roboto, sans-serif"
}

const headingStyle = {
  color: "#0d47a1",
  fontWeight: 900,
  marginBottom: 12,
  textAlign: "center"
}

const tabStyle = {
  display: "flex",
  justifyContent: "space-around",
  marginBottom: 12
}

