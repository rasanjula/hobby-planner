import { useEffect, useState } from "react";
import { api } from "./api/http";

export default function App() {
  const [status, setStatus] = useState<string>("loading...");
  useEffect(() => {
    api<{ ok: boolean; time: string }>("/api/health")
      .then(d => setStatus(`OK @ ${d.time}`))
      .catch(e => setStatus(`Error: ${e.message}`));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Hobby Planner</h1>
      <p>Backend status: {status}</p>
    </div>
  );
}
