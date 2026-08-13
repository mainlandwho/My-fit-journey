export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
        background: "#FFFFFF",
        color: "#1F2937",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          fontSize: 28,
        }}
      >
        📡
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
        You&apos;re offline
      </h1>
      <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 280, lineHeight: 1.5 }}>
        My Fit Journey needs a connection to load your latest meal plan, workouts, and
        progress. Reconnect and try again — anything you logged earlier is still saved.
      </p>
    </div>
  );
}
