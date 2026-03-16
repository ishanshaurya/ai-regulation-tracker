import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Debugger from './pages/Debugger'
import Loopholes from './pages/Loopholes'
import Audit from './pages/Audit'
import Regulations from './pages/Regulations'
import DeployCheck from './pages/DeployCheck'
import StressTest from './pages/StressTest'

function Placeholder({ title, emoji, phase }) {
  return (
    <div style={{ padding: '40px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>{title}</h1>
      <p style={{ fontSize: 13, color: '#475569' }}>{phase} — Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Placeholder title="Dashboard" emoji="📊" phase="Phase 1" />} />
          <Route path="/debugger" element={<Debugger />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/regulations" element={<Regulations />} />
          <Route path="/loopholes" element={<Loopholes />} />
          <Route path="/deploy-check" element={<DeployCheck />} />
          <Route path="/stress-test" element={<StressTest />} />
        </Route>
        <Route path="/login" element={<Placeholder title="Login" emoji="🔐" phase="Phase 1" />} />
        <Route path="*" element={<div style={{ padding: 60, textAlign: 'center' }}><h1 style={{ color: '#f1f5f9' }}>404</h1></div>} />
      </Routes>
    </BrowserRouter>
  )
}
