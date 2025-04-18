import React, { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Alias
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button'; // Alias
import { Input } from '@/components/ui/input'; // Alias
import { Textarea } from '@/components/ui/textarea'; // Alias
import { Label } from '@/components/ui/label'; // Alias
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Alias
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Alias
import { useToast } from '@/hooks/use-toast'; // Alias (caminho corrigido)
import { PlusCircle, BrainCircuit, Loader2 } from 'lucide-react';

// Interfaces
interface Project { id: string; nome_projeto: string; updated_at: string; }
interface NicheTaskInput { project_id: string; user_id: string; passions: string[]; skills: string[]; initial_idea?: string;}
interface NicheTaskStatus { task_id: string; status: string; message: string;}

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isNicheModalOpen, setIsNicheModalOpen] = useState(false);
  const [nichePassions, setNichePassions] = useState('');
  const [nicheSkills, setNicheSkills] = useState('');
  const [nicheInitialIdea, setNicheInitialIdea] = useState('');
  const [isSubmittingNiche, setIsSubmittingNiche] = useState(false);
  const [runningNicheTaskId, setRunningNicheTaskId] = useState<string | null>(null);

  const { toast } = useToast();
  const backendUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

  // Carregar Usuário
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted && user) setUser(user);
      setLoadingUser(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Carregar Projetos
  const fetchProjects = async () => {
    if (!user) return;
    setLoadingProjects(true);
    console.log(`Fetching projects from: ${backendUrl}/api/v1/projects/`); // Log para debug
    try {
      // Adicionando timeout e verificando se backendUrl é válido
       if (!backendUrl || !backendUrl.startsWith('http')) {
           throw new Error(`URL inválida para o backend: ${backendUrl}`);
       }
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout de 15 segundos

       const response = await fetch(`${backendUrl}/api/v1/projects/`, { signal: controller.signal });
       clearTimeout(timeoutId); // Limpa o timeout se a resposta chegar

       console.log("Fetch response status:", response.status); // Log para debug

       if (!response.ok) {
         let errorBody = await response.text(); // Ler o corpo como texto
         console.error("Fetch error response body:", errorBody); // Log para debug
         throw new Error(`HTTP error! status: ${response.status} - ${errorBody.substring(0, 100)}`);
       }

       const data: Project[] = await response.json();
       console.log("Projects data received:", data); // Log para debug
       setProjects(data);
       // toast({ title: "Projetos carregados!" });

    } catch (error: any) {
       console.error("Error fetching projects:", error);
       // Verifica se o erro é de AbortError (timeout)
       if (error.name === 'AbortError') {
           toast({ variant: "destructive", title: "Erro ao buscar projetos", description: "A requisição demorou muito (timeout)." });
       } else {
           toast({ variant: "destructive", title: "Erro ao buscar projetos", description: error.message || "Não foi possível conectar à API." });
       }
       setProjects([]);
    } finally {
       setLoadingProjects(false);
    }
  };
  useEffect(() => { if (user) { fetchProjects(); } }, [user]);

  // Criar Novo Projeto
  const handleCreateProject = async (e: FormEvent) => {
     e.preventDefault();
     if (!newProjectName.trim() || !user) return;
     setIsSubmittingProject(true);
     console.log(`Creating project '${newProjectName}' at: ${backendUrl}/api/v1/projects/`); // Log
     try {
       const response = await fetch(`${backendUrl}/api/v1/projects/`, {
         method: 'POST', headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ nome_projeto: newProjectName }),
       });
       console.log("Create project response status:", response.status); // Log
       if (!response.ok) {
         let errorDetail = `HTTP error! status: ${response.status}`;
         try { errorDetail = (await response.json()).detail || errorDetail; } catch (jsonError) {}
         throw new Error(errorDetail);
       }
       toast({ title: "Sucesso!", description: `Projeto "${newProjectName}" criado (placeholder).` });
       setNewProjectName('');
       fetchProjects();
     } catch (error: any) {
       console.error("Error creating project:", error);
       toast({ variant: "destructive", title: "Erro ao criar projeto", description: error.message });
     } finally {
       setIsSubmittingProject(false);
     }
  };

  // Iniciar Análise de Nicho
  const handleStartNicheAnalysis = async (e: FormEvent) => {
     e.preventDefault();
     const currentProjectId = projects.length > 0 ? projects[0].id : null;
     if (!user || !currentProjectId) {
        toast({ variant: "destructive", title: "Erro", description: "Faça login e crie um projeto primeiro." });
        return;
     }
     if (!nichePassions.trim() || !nicheSkills.trim()) {
         toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Paixões e Habilidades são necessárias." });
         return;
     }
     setIsSubmittingNiche(true); setRunningNicheTaskId(null);
     const passionsList = nichePassions.split(',').map(p => p.trim()).filter(Boolean);
     const skillsList = nicheSkills.split(',').map(s => s.trim()).filter(Boolean);
     const payload: NicheTaskInput = {
         project_id: currentProjectId, user_id: user.id, passions: passionsList, skills: skillsList,
         initial_idea: nicheInitialIdea.trim() || undefined,
     };
     console.log(`Starting niche analysis for project ${currentProjectId} at: ${backendUrl}/api/v1/tasks/analyze-niche`); // Log
     try {
         const response = await fetch(`${backendUrl}/api/v1/tasks/analyze-niche`, {
             method: 'POST', headers: { 'Content-Type': 'application/json', /* TODO: Add Auth */ },
             body: JSON.stringify(payload),
         });
         console.log("Start niche analysis response status:", response.status); // Log
         if (response.status === 202) {
             const data: NicheTaskStatus = await response.json();
             setRunningNicheTaskId(data.task_id);
             toast({ title: "Análise Iniciada!", description: `Tarefa ${data.task_id.substring(0,8)}... em andamento.` });
             setIsNicheModalOpen(false);
         } else {
             let errorDetail = `Erro inesperado: ${response.status}`;
             try { errorDetail = (await response.json()).detail || errorDetail; } catch (jsonError) {}
             throw new Error(errorDetail);
         }
     } catch (error: any) {
         console.error("Error starting niche analysis:", error);
         toast({ variant: "destructive", title: "Erro ao iniciar análise", description: error.message });
         setRunningNicheTaskId(null);
     } finally {
         setIsSubmittingNiche(false);
     }
  };

  // Renderização
  if (loadingUser) return <div>Carregando informações do usuário...</div>;
  if (!user) return <div>Usuário não autenticado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold">Dashboard Principal</h1>
         <p className="text-sm text-muted-foreground">Bem-vindo, {user.email}!</p>
      </div>
      {/* Card para Iniciar Módulo 1 (Nicho) */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader> <CardTitle className="flex items-center gap-2"><BrainCircuit className="w-6 h-6 text-blue-600"/> Módulo 1: Nicho e Persona</CardTitle> <CardDescription>Comece a definir a base do seu negócio digital.</CardDescription> </CardHeader>
        <CardContent>
          {runningNicheTaskId ? (<div className="flex items-center gap-2 text-amber-600"><Loader2 className="h-5 w-5 animate-spin" /><span>Análise de nicho em andamento (Tarefa: {runningNicheTaskId.substring(0, 8)}...). Aguarde.</span></div>) : (
             <Dialog open={isNicheModalOpen} onOpenChange={setIsNicheModalOpen}>
               <DialogTrigger asChild><Button disabled={projects.length === 0 || loadingProjects}> Iniciar Análise de Nicho {projects.length === 0 && !loadingProjects && <span className="text-xs ml-2">(Crie um projeto primeiro)</span>}</Button></DialogTrigger>
               <DialogContent className="sm:max-w-[525px]">
                 <form onSubmit={handleStartNicheAnalysis}>
                   <DialogHeader><DialogTitle>Análise de Nicho</DialogTitle><DialogDescription>Forneça suas paixões e habilidades (separadas por vírgula) para a IA.</DialogDescription></DialogHeader>
                   <div className="grid gap-4 py-4">
                     <div className="space-y-1"><Label htmlFor="passions">Paixões / Interesses *</Label><Input id="passions" placeholder="Ex: culinária, produtividade" value={nichePassions} onChange={(e) => setNichePassions(e.target.value)} required disabled={isSubmittingNiche}/></div>
                     <div className="space-y-1"><Label htmlFor="skills">Habilidades / Conhecimentos *</Label><Input id="skills" placeholder="Ex: cozinhar, organizar" value={nicheSkills} onChange={(e) => setNicheSkills(e.target.value)} required disabled={isSubmittingNiche}/></div>
                     <div className="space-y-1"><Label htmlFor="initialIdea">Ideia Inicial (Opcional)</Label><Textarea id="initialIdea" placeholder="Ex: Ajudar mães ocupadas..." value={nicheInitialIdea} onChange={(e) => setNicheInitialIdea(e.target.value)} rows={2} disabled={isSubmittingNiche}/></div>
                   </div>
                   <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingNiche}>Cancelar</Button></DialogClose>
                     <Button type="submit" disabled={isSubmittingNiche || !nichePassions.trim() || !nicheSkills.trim()}>{isSubmittingNiche ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...</> : "Iniciar Análise com IA"}</Button>
                   </DialogFooter>
                 </form>
               </DialogContent>
             </Dialog>
           )}
        </CardContent>
      </Card>
      {/* Criar Novo Projeto */}
      <Card>
        <CardHeader><CardTitle>Criar Novo Projeto</CardTitle></CardHeader>
        <form onSubmit={handleCreateProject}>
          <CardContent><Input placeholder="Nome do novo projeto..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} disabled={isSubmittingProject} required minLength={3}/></CardContent>
          <CardFooter><Button type="submit" variant="secondary" disabled={isSubmittingProject || !newProjectName.trim()}>{isSubmittingProject ? 'Criando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Criar Projeto</>}</Button></CardFooter>
        </form>
      </Card>
      {/* Lista de Projetos */}
      <Card>
         <CardHeader><CardTitle>Seus Projetos</CardTitle></CardHeader>
         <CardContent>
           {loadingProjects ? <p>Carregando projetos...</p> : projects.length === 0 ? <p className="text-muted-foreground">Nenhum projeto encontrado.</p> : (
             <ul className="space-y-2">
               {projects.map((project) => ( <li key={project.id} className="border p-3 rounded hover:bg-muted">{project.nome_projeto}<span className="text-xs text-muted-foreground ml-2">(ID: {project.id}, Atualizado: {new Date(project.updated_at).toLocaleDateString()})</span></li> ))}
             </ul>
           )}
         </CardContent>
      </Card>
    </div>
  );
};
export default HomePage;