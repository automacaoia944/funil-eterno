# backend/routers/ai_tasks.py
from fastapi import APIRouter, HTTPException, Body, Depends, BackgroundTasks, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid # Para gerar IDs de tarefa
from datetime import datetime # Para timestamps

# Importar o serviço da CrewAI e a função de execução
try:
    from .services import crew_service
except ImportError:
    crew_service = None
    print("Warning: crew_service not found or could not be imported.")

# TODO: Importar cliente Supabase para interagir com DB
# from lib.supabase_client import supabase_client_admin # Exemplo

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
    if not crew_service:
        raise HTTPException(status_code=501, detail="Serviço CrewAI não está disponível.")

    # TODO: Validar se project_id pertence ao user_id autenticado

    task_id = uuid.uuid4()
    task_type = "ANALYZE_NICHE"
    user_id_uuid = uuid.UUID(payload.user_id) # TODO: Pegar do token, não do payload
    project_id_uuid = uuid.UUID(payload.project_id)

    # 1. Criar registro da tarefa no Supabase (status PENDING)
    try:
        task_record = TaskRecordCreate(
            id=task_id,
            project_id=project_id_uuid,
            user_id=user_id_uuid, # Usar ID do usuário autenticado
            task_type=task_type
        )
        # TODO: Fazer insert real no Supabase
        # _, error = await supabase_client_admin.table('async_tasks').insert(task_record.model_dump()).execute()
        # if error:
        #    raise HTTPException(status_code=500, detail=f"Erro ao registrar tarefa no DB: {error}")
        print(f"Placeholder: Registrando tarefa {task_id} para projeto {payload.project_id}")

    except Exception as db_error:
         raise HTTPException(status_code=500, detail=f"Erro interno ao registrar tarefa: {db_error}")


    # 2. Adicionar a execução da Crew à fila de background tasks
    background_tasks.add_task(
        crew_service.run_niche_analysis_task,
        task_id=str(task_id),
        inputs=payload.model_dump() # Passa todos os inputs para a função background
    )

    return AsyncTaskStatus(
        task_id=str(task_id),
        status="PENDING",
        message="Tarefa de análise de nicho iniciada com sucesso."
    )

# TODO: Adicionar endpoint GET /tasks/{task_id}/status para consultar o status 