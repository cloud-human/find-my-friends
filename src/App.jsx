import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlobalView from './pages/GlobalView';
import AdminPanel from './pages/AdminPanel';
import ClientAdmin from './pages/ClientAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GlobalView />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/:slug" element={<ClientAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}
