function Clashes({ clashes }) {
  if (!clashes || clashes.length === 0) {
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{
          textAlign: "center", padding: "52px",
          background: "#f8fffe", border: "2px dashed #a7f3d0",
          borderRadius: "18px", color: "#7aada5",
        }}>
          <p style={{ fontSize: "48px" }}>✅</p>
          <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f2a27", marginTop: "12px" }}>No clashes!</p>
          <p style={{ fontSize: "14px", marginTop: "4px" }}>Your schedule looks clean. Keep it up.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {clashes.map((clash, index) => (
        <div key={index} style={{
          background: "#fff5f5",
          border: "1.5px solid #fca5a5",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "12px",
          boxShadow: "0 2px 12px rgba(239,68,68,0.06)",
          transition: "box-shadow 0.2s, transform 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(239,68,68,0.1)"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(239,68,68,0.06)"; e.currentTarget.style.transform = "translateY(0)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontSize: "22px" }}>🚨</span>
            <strong style={{ color: "#dc2626", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              High priority clash detected!
            </strong>
            <span style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white",
              fontSize: "10px", fontWeight: "700", padding: "3px 10px",
              borderRadius: "999px", letterSpacing: "0.05em", marginLeft: "auto",
            }}>CLASH</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{
              background: "white", border: "1px solid #fecaca", borderRadius: "10px",
              padding: "8px 14px", fontWeight: "600", fontSize: "13px", color: "#0f2a27",
            }}>📌 {clash.task1}</div>
            <div style={{
              background: "#ef4444", color: "white", borderRadius: "999px",
              padding: "4px 12px", fontSize: "11px", fontWeight: "700",
            }}>VS</div>
            <div style={{
              background: "white", border: "1px solid #fecaca", borderRadius: "10px",
              padding: "8px 14px", fontWeight: "600", fontSize: "13px", color: "#0f2a27",
            }}>📌 {clash.task2}</div>
          </div>

          <div style={{
            marginTop: "12px", fontSize: "12.5px", color: "#dc2626", fontWeight: "500",
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: "8px", padding: "6px 12px", display: "inline-block",
          }}>
            ⏰ Only {clash.days_apart} day{clash.days_apart !== 1 ? "s" : ""} apart — consider starting early.
          </div>
        </div>
      ))}
    </div>
  )
}

export default Clashes
const card = {
  background: "#ffffff",
  border: "1px solid rgba(13,148,136,0.12)",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(13,148,136,0.07)",
}
 
const sectionTitle = {
  fontSize: "16px", fontWeight: "700",
  color: "#0f2a27", fontFamily: "'Lora',serif",
}
 
const sectionSub = {
  color: "#7aada5", fontSize: "13px", marginTop: "4px",
}
 
const labelSt = {
  display: "block", marginBottom: "7px",
  fontWeight: "600", color: "#0f2a27", fontSize: "13.5px",
}
 
const inputSt = {
  width: "100%", padding: "10px 14px",
  border: "1.5px solid #c8f0ea", borderRadius: "9px",
  fontSize: "13.5px", outline: "none",
  boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  background: "#f8fffe", color: "#0f2a27",
  transition: "border-color 0.15s",
}
