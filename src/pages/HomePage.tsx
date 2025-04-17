import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
       if (isMounted && user) {
          setUser(user);
       }
       setLoading(false);
    });
    return () => { isMounted = false; }
  }, []);


  if (loading) {
    return <div>Carregando informações do usuário...</div>;
  }

  if (!user) {
     return <div>Erro ao carregar usuário ou usuário não logado.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Principal</h1>
      <p>Bem-vindo, {user.email}!</p>
      <p className="mt-4">Aqui você verá o status dos seus projetos e poderá iniciar novos módulos.</p>
      {/* Adicionar aqui a lógica para listar projetos, etc. */}
    </div>
  );
};

export default HomePage; 