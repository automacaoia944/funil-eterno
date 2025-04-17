import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient'; // Alias!
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'; // Importa tipos

const ProtectedRoute: React.FC = () => {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
     if (!supabase) {
         console.error("ProtectedRoute: Supabase client not available.");
         setSessionChecked(true); // Marca como checado para evitar loop, mas não estará logado
         setIsLoggedIn(false);
         return;
     };

     supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => { // Adiciona tipo explícito para session
       console.log("ProtectedRoute session check:", session);
       setIsLoggedIn(!!session);
       setSessionChecked(true);
     });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { // Adiciona tipo AuthChangeEvent
       console.log("ProtectedRoute auth state change:", session);
       setIsLoggedIn(!!session);
       // Não precisa mais de setSessionChecked aqui, pois a checagem inicial já fez
     });

    return () => {
       authListener?.subscription.unsubscribe();
     };
   }, []);


   if (!sessionChecked) {
     // Enquanto a sessão está sendo verificada, pode mostrar um loader
     return <div>Verificando autenticação...</div>;
   }

   return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
 };

export default ProtectedRoute; 