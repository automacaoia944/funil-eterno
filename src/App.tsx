import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout'; // Alias!
import ProtectedRoute from '@/components/ProtectedRoute'; // Alias!
import AuthPage from '@/pages/AuthPage'; // Alias!
import HomePage from '@/pages/HomePage'; // Alias!
import { Toaster } from "@/components/ui/toaster"; // Alias!

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login/Registro (Pública) */}
        <Route path="/login" element={<AuthPage />} />

        {/* Rotas Protegidas dentro do Layout Padrão */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            {/* Adicione outras rotas protegidas aqui */}
            {/* Ex: <Route path="/projeto/:id" element={<ProjectPage />} /> */}
          </Route>
        </Route>

        {/* Rota para Not Found (Opcional) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
      <Toaster /> {/* Adiciona o container para Toasts do Shadcn */}
    </BrowserRouter>
  );
}

export default App;
