import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import LeftSidebar from './components/LeftSidebar'
import Analysis from './pages/Analysis'
import BreakdownStreak from './pages/BreakdownStreak'
import Dashboard from './pages/Dashboard'
import DataManagement from './pages/data-management/DataManagement'
import Insight from './pages/Insight'
import Visualization from './pages/Visualization'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/breakdown-streak" element={<BreakdownStreak />} />
            <Route path="/insight" element={<Insight />} />
            <Route path="/visualization" element={<Visualization />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
