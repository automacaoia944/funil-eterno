import React, { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

// Interface para o projeto (baseado no Pydantic ProjectListRead e ProjectRead)
interface Project {
  id: string;
  nome_projeto: string;
  updated_at: string; // Simplificado para string por enquanto
}

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const backendUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'; // Usa variável ou default

  // --- Carregar Usuário ---
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (isMounted && user) {
        setUser(user);
      }
      setLoadingUser(false);
    });
    return () => { isMounted = false; };
  }, []);

  // --- Carregar Projetos ---
  const fetchProjects = async () => {
    if (!user) return; // Precisa do usuário (para auth futura)
    setLoadingProjects(true);
    try {
      // ** CHAMADA À API BACKEND (Placeholder) **
      // TODO: Adicionar token de autenticação no header quando implementarmos
      const response = await fetch(`${backendUrl}/api/v1/projects/`); // Endpoint de listar

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Project[] = await response.json();
      setProjects(data);
       toast({ title: "Projetos carregados!" });
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar projetos",
        description: error.message || "Não foi possível conectar à API.",
      });
      setProjects([]); // Limpa em caso de erro
    } finally {
      setLoadingProjects(false);
    }
  };

  // Carrega projetos quando o usuário é identificado
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Dependência user

  // --- Criar Novo Projeto ---
  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !user) return;
    setIsSubmitting(true);

    try {
       // ** CHAMADA À API BACKEND (Placeholder) **
       // TODO: Adicionar token de autenticação no header
       const response = await fetch(`${backendUrl}/api/v1/projects/`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           // 'Authorization': `Bearer ${token}` // Adicionar depois
         },
         body: JSON.stringify({ nome_projeto: newProjectName }),
       });

       if (!response.ok) {
          // Tenta ler a mensagem de erro do backend se houver
          let errorDetail = "Erro desconhecido do servidor.";
          try {
             const errorData = await response.json();
             errorDetail = errorData.detail || JSON.stringify(errorData);
          } catch (jsonError) {
             errorDetail = `HTTP error! status: ${response.status}`;
          }
          throw new Error(errorDetail);
       }

       const createdProject = await response.json(); // Não usamos o retorno placeholder por enquanto
       toast({ title: "Sucesso!", description: `Projeto "${newProjectName}" criado (placeholder).` });
       setNewProjectName('');
       fetchProjects(); // Recarrega a lista após criar

    } catch (error: any) {
       console.error("Error creating project:", error);
       toast({
         variant: "destructive",
         title: "Erro ao criar projeto",
         description: error.message || "Não foi possível conectar à API.",
       });
    } finally {
       setIsSubmitting(false);
    }
  };


  // --- Renderização ---
  if (loadingUser) {
    return <div>Carregando informações do usuário...</div>;
  }

  if (!user) {
    // Teoricamente não deveria chegar aqui por causa do ProtectedRoute, mas por segurança
    return <div>Usuário não autenticado.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Principal</h1>
      <p className="text-muted-foreground">Bem-vindo, {user.email}!</p>

      {/* Formulário para Novo Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Projeto</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreateProject}>
          <CardContent>
            <Input
              placeholder="Nome do novo projeto..."
              value={newProjectName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
              disabled={isSubmitting}
              required
              minLength={3}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !newProjectName.trim()}>
              {isSubmitting ? 'Criando...' : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" /> Criar Projeto
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Lista de Projetos */}
      <Card>
         <CardHeader>
            <CardTitle>Seus Projetos</CardTitle>
         </CardHeader>
         <CardContent>
           {loadingProjects ? (
             <p>Carregando projetos...</p>
           ) : projects.length === 0 ? (
             <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
           ) : (
             <ul className="space-y-2">
               {projects.map((project) => (
                 <li key={project.id} className="border p-3 rounded hover:bg-muted">
                   {project.nome_projeto}
                   <span className="text-xs text-muted-foreground ml-2">
                     (ID: {project.id}, Atualizado: {new Date(project.updated_at).toLocaleDateString()})
                   </span>
                   {/* TODO: Adicionar link para página do projeto */}
                 </li>
               ))}
             </ul>
           )}
         </CardContent>
      </Card>

    </div>
  );
};

export default HomePage; 