# backend/routers/ai_tasks.py
from fastapi import APIRouter, HTTPException, Body, Depends, BackgroundTasks, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid # Para gerar IDs de tarefa
from datetime import datetime, timezone
import logging # Adicionado logging

# Importar cliente Supabase Admin
try:
    from lib.supabase_client import supabase_admin_client
    # Verifica se foi inicializado corretamente
    if not supabase_admin_client:
        logging.error("Supabase admin client FAILED to initialize in ai_tasks.py.")
    else:
        logging.info("Supabase admin client successfully imported in ai_tasks.py.")
except ImportError:
    supabase_admin_client = None
    logging.error("Supabase admin client could NOT be imported in ai_tasks.py.")

# Importar serviço CrewAI
try:
    from services import crew_service
except ImportError:
    crew_service = None
    logging.warning("crew_service not found or could not be imported in ai_tasks.py.")

router = APIRouter()

# --- Modelos Pydantic para Input/Output (Exemplos) ---

class BaseTaskInput(BaseModel):
    project_id: str # ID do projeto no Supabase
    user_input: Dict[str, Any] # Inputs específicos da tarefa

class BaseTaskOutput(BaseModel):
    task_id: str # ID da tarefa assíncrona (se aplicável)
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None

class NicheAnalysisInput(BaseModel):
    project_id: str # ID do projeto no Supabase
    user_id: str # ID do usuário (virá do token JWT depois)
    passions: List[str] = Field(..., min_length=1)
    skills: List[str] = Field(..., min_length=1)
    initial_idea: Optional[str] = None

class AsyncTaskStatus(BaseModel):
    task_id: str
    status: str
    message: str

# Modelo para inserir na tabela async_tasks (simplificado)
class TaskRecordCreate(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    project_id: uuid.UUID # Convertido para UUID
    user_id: uuid.UUID # Convertido para UUID
    task_type: str
    status: str = 'PENDING'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# --- Endpoints da API (Placeholders) ---

@router.post("/analyze-niche", response_model=AsyncTaskStatus, status_code=status.HTTP_202_ACCEPTED, summary="Inicia Análise de Nicho Assíncrona")
async def start_niche_analysis_endpoint(
    payload: NicheAnalysisInput,
    background_tasks: BackgroundTasks
    # TODO: Adicionar dependência para pegar user_id do token: user_id: str = Depends(get_current_user_id)
):
    """
    Recebe paixões/habilidades do usuário, inicia a Crew de análise de nicho
    em segundo plano e retorna um ID de tarefa para consulta.
    """
    logging.info(f"Received request for /analyze-niche for project: {payload.project_id}")
    if not crew_service:
        raise HTTPException(status_code=501, detail="Serviço CrewAI não está disponível.")
    if not supabase_admin_client:
        # Log extra antes de lançar a exceção
        logging.error("Aborting /analyze-niche: Supabase admin client is not available.")
        raise HTTPException(status_code=503, detail="Conexão com banco de dados não disponível.")

    task_id = uuid.uuid4()
    task_type = "ANALYZE_NICHE"

    # Tenta converter IDs (ainda recebendo string)
    try:
        # TODO: Validar se estes IDs existem no DB e pertencem ao usuário autenticado
        user_id_uuid = uuid.UUID(payload.user_id)
        project_id_uuid = uuid.UUID(payload.project_id)
    except ValueError:
        logging.error(f"Invalid UUID format received: user_id='{payload.user_id}', project_id='{payload.project_id}'")
        raise HTTPException(status_code=400, detail="Formato inválido para project_id ou user_id.")

    # 1. Criar registro REAL da tarefa no Supabase
    try:
        task_data_to_insert = {
            "id": str(task_id), # Envia como string, o DB converte para UUID se o tipo for UUID
            "project_id": str(project_id_uuid),
            "user_id": str(user_id_uuid),
            "task_type": task_type,
            "status": 'PENDING',
            # created_at e updated_at usarão DEFAULT do DB
        }
        logging.info(f"Attempting to insert task {task_id} into Supabase...")
        response = supabase_admin_client.table('async_tasks').insert(task_data_to_insert).execute()
        logging.info(f"Supabase insert response for task {task_id}: {response}")

        # Verificação de erro mais robusta (Supabase-py v1 vs v2 pode variar)
        # Ajustei para como a biblioteca v1 geralmente se comporta (sem async/await direto aqui)
        # E checando o erro na resposta explicitamente.
        if hasattr(response, 'error') and response.error:
             logging.error(f"Supabase insert error (API Error): {response.error.message}")
             # Lança exceção para ser pega pelo bloco except externo
             raise Exception(f"Supabase insert error: {response.error.message}")
        # Verifica se 'data' existe e não está vazia (indicador de sucesso comum)
        elif not response.data:
             logging.warning(f"Supabase insert for task {task_id} returned no data. Assuming success, but verify.")
             # Poderia lançar erro aqui se 'data' for estritamente necessário

        logging.info(f"Task {task_id} registered in DB for project {payload.project_id}")

    except Exception as db_error:
         logging.error(f"Erro ao registrar tarefa {task_id} no DB: {db_error}", exc_info=True)
         # Retorna 500 Internal Server Error se falhar ao falar com o DB
         raise HTTPException(status_code=500, detail=f"Erro interno ao registrar tarefa.")

    # 2. Adicionar a execução da Crew à fila de background tasks
    background_tasks.add_task(
        crew_service.run_niche_analysis_task, # A função em crew_service é async
        task_id=str(task_id), # Passa como string
        inputs=payload.model_dump()
    )
    logging.info(f"Task {task_id} added to background queue.")

    return AsyncTaskStatus(
        task_id=str(task_id),
        status="PENDING",
        message="Tarefa de análise de nicho iniciada com sucesso."
    )

# TODO: Adicionar endpoint GET /tasks/{task_id}/status para consultar o status 