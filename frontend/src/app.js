import { useEffect, useState } from "react"
import axios from "axios"

function App() {
  const [data, setData] = useState([])

  useEffect(() => {
    setInterval(() => {
      axios.get("http://localhost:5000/data")
        .then(res => setData(res.data))
    }, 2000)
  }, [])

  const latest = data[0]

  return (
    <div style={{ background:"#111", color:"#fff", minHeight:"100vh", padding:"20px" }}>
      <h1>Motor Digital Twin</h1>

      {latest && (
        <>
          <p>Temperature: {latest.temperature} °C</p>
          <p>Vibration: {latest.vibration}</p>
          <p>Status: {latest.status}</p>
        </>
      )}
    </div>
  )
}

export default App