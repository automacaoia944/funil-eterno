import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient'; // Alias!
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Alias!
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'; // Importa tipos

const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) return; // Não faz nada se o cliente não estiver pronto

    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        console.log("User session found, navigating to home.");
        navigate('/'); // Redireciona para a home se logado
      } else {
        console.log("No user session, staying on auth page.");
      }
    });

    // Verifica a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
         console.log("Initial session check: User logged in, navigating.");
         navigate('/');
      } else {
         console.log("Initial session check: No user session.");
      }
    });


    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]); // Dependência navigate

  if (!supabase) {
    return (
       <div className="flex justify-center items-center min-h-screen">
         <p className="text-red-500">Erro: Cliente Supabase não está configurado corretamente.</p>
       </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen -mt-20"> {/* Ajuste de margem para compensar header/footer */}
      <Card className="w-full max-w-md mx-4">
         <CardHeader>
            <CardTitle className="text-center">Bem-vindo!</CardTitle>
            <CardDescription className="text-center">
               Acesse sua conta ou crie uma nova para começar.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Auth
               supabaseClient={supabase}
               appearance={{ theme: ThemeSupa }}
               providers={['google', 'github']} // Adicione outros providers se quiser
               theme="light" // ou "dark"
               localization={{
                  variables: {
                     sign_in: { email_label: 'Seu email', password_label: 'Sua senha', button_label: "Entrar", link_text: "Já tem uma conta? Entre" },
                     sign_up: { email_label: 'Seu email', password_label: 'Crie uma senha', button_label: "Criar Conta", link_text: "Não tem conta? Crie uma" },
                     forgotten_password: { email_label: "Seu email", password_label: "Sua Senha", button_label: "Enviar instruções", link_text: "Esqueceu sua senha?" },
                  }
               }}
            />
         </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage; 