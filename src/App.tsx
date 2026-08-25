import { HashRouter, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AppProvider } from './context/AppContext'
import { AddRecord } from './pages/AddRecord'
import { Challenges } from './pages/Challenges'
import { Collection } from './pages/Collection'
import { DigDna } from './pages/DigDna'
import { DigIn } from './pages/DigIn'
import { Discover } from './pages/Discover'
import { Home } from './pages/Home'
import { MyDigLog } from './pages/MyDigLog'
import { Profile } from './pages/Profile'
import { RecordDetail } from './pages/RecordDetail'
import { Wantlist } from './pages/Wantlist'

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="mx-auto max-w-[430px] border-x border-white/5">
          <Routes>
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
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </AppProvider>
  )
}

export default App
