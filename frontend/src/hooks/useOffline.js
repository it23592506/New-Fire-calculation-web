import { useEffect, useState } from "react";

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOffline;
}

export function OfflineBanner({ isOffline }) {
  if (!isOffline) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "#1f2937",
      color: "#fca5a5",
      padding: "12px 20px",
      textAlign: "center",
      fontSize: "14px",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontWeight: "600"
    }}>
      📡 You are offline - using cached data
    </div>
  );
}
