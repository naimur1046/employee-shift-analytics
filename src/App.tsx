import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard'
import DataManagement from './pages/DataManagement'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-management" element={<DataManagement />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
