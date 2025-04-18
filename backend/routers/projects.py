from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict # Adicionado Dict
# Importar Supabase client ou dependência de usuário autenticado (faremos depois)
# from dependencies import get_current_user, get_supabase_client

router = APIRouter()

# --- Modelos Pydantic (Schemas) ---
class ProjectBase(BaseModel):
    nome_projeto: str = Field(..., min_length=3, max_length=255)

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: str
    user_id: str
    estado_progresso: Optional[Dict[str, Any]] = {}
    created_at: Any # Usar datetime no futuro
    updated_at: Any # Usar datetime no futuro

    class Config:
        from_attributes = True # Permite mapear de objetos ORM/DB

class ProjectListRead(BaseModel):
    id: str
    nome_projeto: str
    updated_at: Any

    class Config:
        from_attributes = True

# --- Endpoints (Placeholders - Sem lógica DB ainda) ---

@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED, summary="Criar Novo Projeto")
async def create_project(project_data: ProjectCreate):
    # Lógica placeholder
    print(f"Recebido pedido para criar projeto: {project_data.nome_projeto}")
    dummy_user_id = "dummy-user-uuid" # Pegar do token JWT depois
    dummy_id = "dummy-project-uuid"
    return ProjectRead(
        id=dummy_id,
        user_id=dummy_user_id,
        nome_projeto=project_data.nome_projeto,
        estado_progresso={"nicho_persona": None},
        created_at="2024-01-01T10:00:00Z",
        updated_at="2024-01-01T10:00:00Z"
    )

@router.get("/", response_model=List[ProjectListRead], summary="Listar Projetos do Usuário")
async def list_projects():
    # Lógica placeholder
    print("Recebido pedido para listar projetos")
    return [
        ProjectListRead(id="proj1", nome_projeto="Meu Primeiro Funil", updated_at="2024-01-02T11:00:00Z"),
        ProjectListRead(id="proj2", nome_projeto="Projeto Teste CFE", updated_at="2024-01-03T12:00:00Z"),
    ] 