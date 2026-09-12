import { HashRouter, Outlet, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AppProvider } from './context/AppContext'
import { AddRecord } from './pages/AddRecord'
import { Challenges } from './pages/Challenges'
import { Collection } from './pages/Collection'
import { DigDna } from './pages/DigDna'
import { DigIn } from './pages/DigIn'
import { Discover } from './pages/Discover'
import { Home } from './pages/Home'
import { JacketScan } from './pages/JacketScan'
import { MyDigLog } from './pages/MyDigLog'
import { Profile } from './pages/Profile'
import { RecordDetail } from './pages/RecordDetail'
import { ScanHistory } from './pages/ScanHistory'
import { Wantlist } from './pages/Wantlist'

function AppShell() {
  return (
    <div className="mx-auto max-w-[430px] border-x border-white/5">
      <Outlet />
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/collection/add" element={<AddRecord />} />
            <Route path="/collection/:id" element={<RecordDetail />} />
            <Route path="/dna" element={<DigDna />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/want" element={<Wantlist />} />
            <Route path="/log" element={<MyDigLog />} />
            <Route path="/log/new" element={<DigIn />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/scan-history" element={<ScanHistory />} />
          </Route>
          <Route path="/jacket-scan" element={<JacketScan />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}

export default App
