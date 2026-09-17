import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShareLogin from './pages/ShareLogin';
import AdminPanel from './pages/AdminPanel';
import ClientAdmin from './pages/ClientAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShareLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/:slug" element={<ClientAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}
