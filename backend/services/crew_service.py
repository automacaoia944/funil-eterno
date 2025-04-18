import os
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI # Ou seu LLM preferido
from dotenv import load_dotenv
import logging
from typing import Dict, Any, Optional, List
# Importar ferramentas (Ex: Busca Web, RagTool se necessário depois)
# from crewai_tools import SerperDevTool, RagTool

# Configura logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Carrega variáveis de ambiente (essencial para API Keys)
# dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env') # Caminho relativo
from dotenv import find_dotenv
env_path = find_dotenv(filename=".env", raise_error_if_not_found=False, usecwd=True) # Procura no dir atual (backend)
if env_path:
    logging.info(f"Crew Service: Loading .env file from: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    logging.warning("Crew Service: backend/.env file not found.")


# --- Configuração LLM (Centralizada) ---
# Cache simples para evitar reinicializar LLM toda hora
_crew_llm = None
def get_crew_llm():
    global _crew_llm
    if _crew_llm is None:
        logging.info("Initializing LLM for CrewAI...")
        try:
            api_key = os.getenv("OPENAI_API_KEY") # Adapte se usar outro LLM/key name
            if not api_key:
                raise ValueError("API Key for CrewAI LLM (e.g., OPENAI_API_KEY) not found in environment variables.")
            _crew_llm = ChatOpenAI(
                # model=os.getenv("CREWAI_LLM_MODEL", "gpt-4o"), # Usar modelo mais potente se tiver
                model=os.getenv("CREWAI_LLM_MODEL", "gpt-3.5-turbo"), # Começar com gpt-3.5 para testes
                temperature=float(os.getenv("CREWAI_LLM_TEMPERATURE", 0.3))
            )
            logging.info("CrewAI LLM initialized successfully.")
        except ValueError as ve:
            logging.error(ve)
            _crew_llm = None # Garante que não será usado se falhar
        except Exception as e:
            logging.error(f"Unexpected error initializing CrewAI LLM: {e}", exc_info=True)
            _crew_llm = None
    return _crew_llm

# --- Definição: Niche Analysis Crew ---
def create_niche_analysis_crew(passions: List[str], skills: List[str], initial_idea: Optional[str] = None):
    llm = get_crew_llm()
    if not llm:
        raise RuntimeError("LLM for CrewAI could not be initialized.")

    # TODO: Adicionar ferramentas como SerperDevTool ou RagTool se precisar de pesquisa web/docs
    # search_tool = SerperDevTool(api_key=os.getenv("SERPER_API_KEY"))

    researcher = Agent(
      role='Analista de Mercado Digital Experiente',
      goal=f"""Analisar profundamente nichos de mercado potenciais baseados nas paixões {passions} e habilidades {skills} do usuário.
               Considerar a ideia inicial '{initial_idea}' se fornecida.
               Identificar tendências, tamanho do mercado (potencial), e concorrência inicial.""",
      backstory="""Você é um analista meticuloso com vasta experiência em identificar oportunidades em mercados digitais,
                   especializado em produtos de informação (cursos, e-books, mentorias). Você sabe como cruzar paixões
                   e habilidades com demandas reais do mercado.""",
      verbose=True,
      allow_delegation=False,
      llm=llm,
      # tools=[search_tool] # Adicionar ferramentas aqui
    )

    validator = Agent(
      role='Validador de Demanda e Potencial Financeiro',
      goal=f"""Avaliar o potencial de monetização e a demanda de mercado para os nichos identificados pelo pesquisador,
               considerando o público-alvo de empreendedores digitais iniciantes. Fornecer um score ou ranking de viabilidade.""",
      backstory="""Você tem um olhar crítico para negócios digitais e entende o que vende online, especialmente
                   para o público que está começando. Você consegue estimar se um nicho tem "dinheiro na mesa"
                   e se a concorrência é administrável para um iniciante.""",
      verbose=True,
      allow_delegation=False,
      llm=llm,
      # tools=[] # Pode precisar de ferramentas específicas de análise financeira/demanda no futuro
    )

    # --- Tarefas ---
    # Tarefa 1: Pesquisa de Nicho
    task_research = Task(
      description=f"""1. Baseado nas paixões {passions} e habilidades {skills}, liste 5-7 nichos de mercado potenciais
                         para produtos digitais (cursos, ebooks, mentorias).
                      2. Se uma ideia inicial '{initial_idea}' foi dada, inclua-a e analise sua viabilidade também.
                      3. Para cada nicho, pesquise brevemente:
                         - Tendências atuais (está crescendo, estável, diminuindo?).
                         - Quem é o público principal?
                         - Quais são os principais problemas/desejos desse público relacionados ao nicho?
                         - Quem são 1-2 concorrentes notáveis (se houver)?
                      4. Formate a saída de forma clara e concisa.""",
      expected_output="""Uma lista de 5-7 nichos potenciais, cada um com:
                         - Nome do Nicho
                         - Breve descrição da tendência
                         - Público Principal
                         - Problemas/Desejos Chave
                         - 1-2 Concorrentes Notáveis (ou 'Pouca concorrência aparente')""",
      agent=researcher,
    )

    # Tarefa 2: Validação e Ranking
    task_validation = Task(
      description=f"""1. Analise a lista de nichos fornecida pelo pesquisador (no contexto).
                      2. Para cada nicho, avalie o potencial de demanda e monetização especificamente para
                         um empreendedor digital iniciante criar produtos. Considere a facilidade de entrada
                         e a intensidade da concorrência.
                      3. Atribua um score de viabilidade (0-100) para cada nicho, onde 100 é o mais promissor.
                      4. Forneça uma breve justificativa (1-2 frases) para o score de cada nicho.
                      5. Ordene a lista final do nicho mais promissor para o menos promissor.""",
      expected_output="""Uma lista ordenada de nichos (do maior score para o menor), cada um com:
                         - Nome do Nicho
                         - Score de Viabilidade (0-100)
                         - Justificativa do Score (1-2 frases)""",
      agent=validator,
      context=[task_research] # Depende do resultado da tarefa anterior
    )

    # --- Montagem da Crew ---
    niche_crew = Crew(
      agents=[researcher, validator],
      tasks=[task_research, task_validation],
      process=Process.sequential,
      verbose=1 # 0=silencioso, 1=processo, 2=debug
      # memory=True # Ativar memória se necessário para conversas mais longas
    )
    return niche_crew

# --- Função para Executar a Crew ---
# Esta função será chamada em background pela API
def run_niche_analysis_task(task_id: str, inputs: Dict[str, Any]):
    logging.info(f"Starting niche analysis task {task_id} with inputs: {inputs}")
    # TODO: Atualizar status da tarefa no Supabase para 'PROCESSING'
    # supabase.table('async_tasks').update({'status': 'PROCESSING'}).eq('id', task_id).execute()

    try:
        passions = inputs.get("passions", [])
        skills = inputs.get("skills", [])
        initial_idea = inputs.get("initial_idea")

        if not passions or not skills:
            raise ValueError("Paixões e Habilidades são necessárias para a análise de nicho.")

        crew = create_niche_analysis_crew(passions, skills, initial_idea)
        result = crew.kickoff(inputs=inputs) # Passa inputs se tarefas os usarem diretamente

        logging.info(f"Niche analysis task {task_id} completed. Result: {result}")
        # TODO: Atualizar status e resultado da tarefa no Supabase para 'COMPLETED'
        # final_result = {"analysis": result} # Estruture como quiser
        # supabase.table('async_tasks').update({'status': 'COMPLETED', 'result': final_result}).eq('id', task_id).execute()

    except Exception as e:
        logging.error(f"Error running niche analysis task {task_id}: {e}", exc_info=True)
        # TODO: Atualizar status e erro da tarefa no Supabase para 'FAILED'
        # supabase.table('async_tasks').update({'status': 'FAILED', 'error_message': str(e)}).eq('id', task_id).execute()
