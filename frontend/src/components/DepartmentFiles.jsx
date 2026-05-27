// src/components/DepartmentFiles.jsx
// Department File Share Feature

import { useEffect, useState, useRef } from 'react'
import API from '../api'

function DepartmentFiles() {
  const [fileData,    setFileData]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const [message,     setMessage]     = useState("")
  const [showForm,    setShowForm]    = useState(false)
  const [form,        setForm]        = useState({
    title:       "",
    description: "",
    file_type:   "assignment",
    file:        null,
  })
  const fileInputRef = useRef(null)

  const fetchFiles = async () => {
    try {
      const res = await API.get("department/files/")
      setFileData(res.data)
    } catch (err) {
      console.error("Files fetch error:", err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchFiles() }, [])

  const handleUpload = async () => {
    if (!form.title.trim()) {
      setMessage("⚠️ Title is required.")
      return
    }
    if (!form.file) {
      setMessage("⚠️ Please select a file.")
      return
    }

    setUploading(true)
    setMessage("")

    const formData = new FormData()
    formData.append('title',       form.title)
    formData.append('description', form.description)
    formData.append('file_type',   form.file_type)
    formData.append('file',        form.file)

    try {
      await API.post("department/files/", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMessage("✅ File uploaded successfully!")
      setForm({ title: "", description: "", file_type: "assignment", file: null })
      setShowForm(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchFiles()
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Upload failed.")
    }
    setUploading(false)
  }

  const handleDelete = async (fileId) => {
    if (deleting !== fileId) {
      setDeleting(fileId)
      return
    }
    try {
      await API.delete(`department/files/${fileId}/`)
      setMessage("✅ File deleted.")
      setDeleting(null)
      fetchFiles()
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Could not delete.")
      setDeleting(null)
    }
  }

  const fileTypeConfig = {
    assignment: { icon: "📝", color: "#6366f1", bg: "#eef2ff", label: "Assignment" },
    lab:        { icon: "🔬", color: "#0891b2", bg: "#e0f9ff", label: "Lab Copy"   },
    notes:      { icon: "📒", color: "#0d9488", bg: "#f0fdfa", label: "Notes"      },
    other:      { icon: "📎", color: "#7aada5", bg: "#f8fffe", label: "Other"      },
  }

  if (loading) {
    return (
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "80px",
        color:          "#7aada5",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
        <div style={{ fontSize: "14px" }}>Loading department files...</div>
      </div>
    )
  }

  if (!fileData) {
    return (
      <div style={{
        textAlign:    "center",
        padding:      "60px",
        background:   "#f8fffe",
        border:       "2px dashed #a7f3d0",
        borderRadius: "18px",
        color:        "#7aada5",
      }}>
        <p style={{ fontSize: "52px" }}>🏫</p>
        <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f2a27" }}>
          No department found
        </p>
      </div>
    )
  }

  const files = fileData.files || []

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{
        display:         "flex",
        alignItems:      "flex-start",
        justifyContent:  "space-between",
        marginBottom:    "28px",
        flexWrap:        "wrap",
        gap:             "16px",
      }}>
        <div>
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        "12px",
            marginBottom: "6px",
          }}>
            <div style={{
              width:          "42px",
              height:         "42px",
              borderRadius:   "12px",
              background:     "linear-gradient(135deg, #0d9488, #14b8a6)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       "22px",
              boxShadow:      "0 4px 14px rgba(13,148,136,0.3)",
            }}>
              📁
            </div>
            <div>
              <h2 style={{
                margin:     0,
                fontSize:   "22px",
                fontWeight: "700",
                fontFamily: "'Lora', serif",
                color:      "#0f2a27",
              }}>
                Department Files
              </h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#7aada5" }}>
                {fileData.dept_name} · {fileData.dept_code} ·{" "}
                {files.length} file{files.length !== 1 ? "s" : ""} shared
              </p>
            </div>
          </div>
          <div style={{
            height:       "2px",
            width:        "80px",
            background:   "linear-gradient(90deg, #0d9488, transparent)",
            borderRadius: "99px",
            marginTop:    "10px",
          }} />
        </div>

        {/* Upload button */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "8px",
            padding:      "11px 20px",
            background:   showForm
              ? "white"
              : "linear-gradient(135deg, #0d9488, #14b8a6)",
            border:       showForm
              ? "2px solid #99f6e4"
              : "none",
            borderRadius: "12px",
            color:        showForm ? "#0d9488" : "white",
            fontSize:     "13.5px",
            fontWeight:   "700",
            cursor:       "pointer",
            boxShadow:    showForm
              ? "none"
              : "0 4px 16px rgba(13,148,136,0.35)",
            transition:   "all 0.2s",
          }}
        >
          <span style={{ fontSize: "16px" }}>
            {showForm ? "✕" : "📤"}
          </span>
          {showForm ? "Cancel" : "Upload File"}
        </button>
      </div>

      {/* ── Message ── */}
      {message && (
        <div style={{
          marginBottom: "18px",
          padding:      "12px 16px",
          background:   message.startsWith("❌") || message.startsWith("⚠️")
            ? "#fef2f2" : "#f0fdfa",
          color:        message.startsWith("❌") || message.startsWith("⚠️")
            ? "#dc2626" : "#0d9488",
          border:       `1px solid ${
            message.startsWith("❌") || message.startsWith("⚠️")
              ? "#fecaca" : "#99f6e4"
          }`,
          borderRadius: "10px",
          fontSize:     "13.5px",
          fontWeight:   "500",
        }}>
          {message}
          <button
            onClick={() => setMessage("")}
            style={{
              float:      "right",
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "inherit",
              fontWeight: "700",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Upload Form ── */}
      {showForm && (
        <div style={{
          background:   "linear-gradient(135deg, #f0fdfa, #e6faf6)",
          border:       "1px solid rgba(13,148,136,0.2)",
          borderRadius: "16px",
          padding:      "22px",
          marginBottom: "22px",
        }}>
          <h3 style={{
            margin:     "0 0 16px",
            fontSize:   "15px",
            fontWeight: "700",
            color:      "#0f2a27",
            fontFamily: "'Lora', serif",
          }}>
            📤 Upload File to Department
          </h3>

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              display:     "block",
              marginBottom: "6px",
              fontWeight:  "600",
              fontSize:    "13px",
              color:       "#0f2a27",
            }}>
              Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Lab Copy Week 5, Assignment 3 Solution..."
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{
                width:        "100%",
                padding:      "10px 14px",
                border:       "1.5px solid #c8f0ea",
                borderRadius: "9px",
                fontSize:     "13.5px",
                outline:      "none",
                boxSizing:    "border-box",
                background:   "white",
                color:        "#0f2a27",
                fontFamily:   "inherit",
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              display:     "block",
              marginBottom: "6px",
              fontWeight:  "600",
              fontSize:    "13px",
              color:       "#0f2a27",
            }}>
              Description <span style={{ color: "#7aada5", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the file..."
              value={form.description}
              onChange={e => setForm(p => ({
                ...p, description: e.target.value
              }))}
              style={{
                width:        "100%",
                padding:      "10px 14px",
                border:       "1.5px solid #c8f0ea",
                borderRadius: "9px",
                fontSize:     "13px",
                outline:      "none",
                boxSizing:    "border-box",
                resize:       "none",
                background:   "white",
                color:        "#0f2a27",
                fontFamily:   "inherit",
              }}
            />
          </div>

          {/* File type */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{
              display:     "block",
              marginBottom: "8px",
              fontWeight:  "600",
              fontSize:    "13px",
              color:       "#0f2a27",
            }}>
              File Type
            </label>
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap:                 "8px",
            }}>
              {Object.entries(fileTypeConfig).map(([key, cfg]) => (
                <div
                  key={key}
                  onClick={() => setForm(p => ({ ...p, file_type: key }))}
                  style={{
                    padding:      "8px",
                    border:       `2px solid ${
                      form.file_type === key ? cfg.color : "#c8f0ea"
                    }`,
                    borderRadius: "10px",
                    cursor:       "pointer",
                    background:   form.file_type === key ? cfg.bg : "white",
                    textAlign:    "center",
                    transition:   "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "20px" }}>{cfg.icon}</div>
                  <div style={{
                    fontSize:   "11px",
                    fontWeight: "600",
                    color:      form.file_type === key ? cfg.color : "#7aada5",
                    marginTop:  "3px",
                  }}>
                    {cfg.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File picker */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display:     "block",
              marginBottom: "6px",
              fontWeight:  "600",
              fontSize:    "13px",
              color:       "#0f2a27",
            }}>
              Select File * <span style={{ color: "#7aada5", fontWeight: 400 }}>
                (max 20MB)
              </span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg"
              onChange={e => setForm(p => ({
                ...p, file: e.target.files[0] || null
              }))}
              style={{
                width:        "100%",
                padding:      "10px 14px",
                border:       "1.5px solid #c8f0ea",
                borderRadius: "9px",
                fontSize:     "13px",
                outline:      "none",
                boxSizing:    "border-box",
                background:   "white",
                cursor:       "pointer",
              }}
            />
            {form.file && (
              <div style={{
                marginTop:  "6px",
                fontSize:   "12px",
                color:      "#0d9488",
                fontWeight: "500",
              }}>
                ✅ {form.file.name} ({
                  form.file.size > 1024 * 1024
                    ? `${(form.file.size / (1024*1024)).toFixed(1)} MB`
                    : `${Math.round(form.file.size / 1024)} KB`
                })
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              width:        "100%",
              padding:      "12px",
              background:   uploading
                ? "#a7f3d0"
                : "linear-gradient(135deg, #0d9488, #14b8a6)",
              border:       "none",
              borderRadius: "10px",
              color:        "white",
              fontSize:     "14px",
              fontWeight:   "700",
              cursor:       uploading ? "not-allowed" : "pointer",
              boxShadow:    "0 4px 16px rgba(13,148,136,0.3)",
              transition:   "all 0.2s",
            }}
          >
            {uploading ? "⏳ Uploading..." : "📤 Upload to Department"}
          </button>
        </div>
      )}

      {/* ── Files Grid ── */}
      {files.length === 0 ? (
        <div style={{
          textAlign:    "center",
          padding:      "60px",
          background:   "#f8fffe",
          border:       "2px dashed #a7f3d0",
          borderRadius: "18px",
          color:        "#7aada5",
        }}>
          <p style={{ fontSize: "48px" }}>📭</p>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f2a27", marginTop: "12px" }}>
            No files yet
          </p>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>
            Upload assignments, lab copies or notes for your department.
          </p>
        </div>
      ) : (
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap:                 "16px",
        }}>
          {files.map(file => {
            const ftc        = fileTypeConfig[file.file_type] || fileTypeConfig.other
            const isDeleting = deleting === file.id

            return (
              <div key={file.id} style={{
                background:   "white",
                borderRadius: "16px",
                padding:      "20px",
                border:       "1px solid rgba(13,148,136,0.1)",
                boxShadow:    "0 2px 14px rgba(13,148,136,0.06)",
                transition:   "transform 0.2s, box-shadow 0.2s",
                display:      "flex",
                flexDirection: "column",
                gap:          "12px",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(13,148,136,0.12)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 14px rgba(13,148,136,0.06)"
                }}
              >
                {/* File type icon + title */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{
                    width:           "44px",
                    height:          "44px",
                    borderRadius:    "12px",
                    background:      ftc.bg,
                    border:          `1px solid ${ftc.color}33`,
                    display:         "flex",
                    alignItems:      "center",
                    justifyContent:  "center",
                    fontSize:        "22px",
                    flexShrink:      0,
                  }}>
                    {ftc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize:     "14px",
                      fontWeight:   "700",
                      color:        "#0f2a27",
                      whiteSpace:   "nowrap",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: "3px",
                    }}>
                      {file.title}
                    </div>
                    <span style={{
                      fontSize:     "10px",
                      fontWeight:   "700",
                      padding:      "2px 8px",
                      borderRadius: "999px",
                      background:   ftc.bg,
                      color:        ftc.color,
                    }}>
                      {ftc.label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {file.description && (
                  <p style={{
                    margin:     0,
                    fontSize:   "12.5px",
                    color:      "#7aada5",
                    lineHeight: 1.6,
                  }}>
                    {file.description}
                  </p>
                )}

                {/* Meta */}
                <div style={{
                  fontSize:  "11.5px",
                  color:     "#7aada5",
                  display:   "flex",
                  flexWrap:  "wrap",
                  gap:       "8px",
                }}>
                  <span>👤 {file.uploaded_by}</span>
                  <span>📦 {file.file_size}</span>
                  <span>🕐 {file.uploaded_at}</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {/* Download */}
                  <a
                    href={file.file_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex:         1,
                      padding:      "8px",
                      background:   "linear-gradient(135deg, #0d9488, #14b8a6)",
                      borderRadius: "9px",
                      color:        "white",
                      fontSize:     "12.5px",
                      fontWeight:   "700",
                      textAlign:    "center",
                      textDecoration: "none",
                      boxShadow:    "0 2px 8px rgba(13,148,136,0.3)",
                      transition:   "all 0.15s",
                    }}
                  >
                    ⬇️ Download
                  </a>

                  {/* Delete (owner only) */}
                  {file.is_owner && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      style={{
                        padding:      "8px 12px",
                        background:   isDeleting ? "#ef4444" : "#fef2f2",
                        color:        isDeleting ? "white"   : "#dc2626",
                        border:       "1px solid #fecaca",
                        borderRadius: "9px",
                        cursor:       "pointer",
                        fontSize:     "12px",
                        fontWeight:   "700",
                        transition:   "all 0.15s",
                        whiteSpace:   "nowrap",
                      }}
                    >
                      {isDeleting ? "⚠️ Sure?" : "🗑️"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DepartmentFiles