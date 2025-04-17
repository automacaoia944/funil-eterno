import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient'; // Alias!
import { Button } from '@/components/ui/button'; // Alias!
import { useToast } from '@/hooks/use-toast'; // Caminho corrigido

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({ title: "Logout realizado com sucesso!" });
      navigate('/login'); // Redireciona para login após logout
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Erro no Logout",
        description: error.message || "Ocorreu um erro inesperado.",
      });
    }
  };

  // Verifica se o cliente supabase está disponível
  const isSupabaseAvailable = !!supabase;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Consultor Funil Eterno</Link>
          {isSupabaseAvailable && (
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          )}
        </div>
      </header>
      <main className="flex-grow container mx-auto p-6">
        {isSupabaseAvailable ? (
          <Outlet /> // Onde o conteúdo da rota será renderizado
        ) : (
          <div className="text-center text-red-600 font-bold mt-10">
            Erro: Cliente Supabase não inicializado. Verifique as variáveis de ambiente e a conexão.
          </div>
        )}
      </main>
      <footer className="bg-muted text-muted-foreground p-4 text-center text-sm">
        © 2024 Consultor Funil Eterno
      </footer>
    </div>
  );
};

export default Layout; 