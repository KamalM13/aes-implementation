import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import History from './pages/History'
import NotFound from './not-found'

function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
  )
}

export default App
