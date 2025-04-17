import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Importar routers
from routers import ai_tasks # Incluindo o router que acabamos de criar

# Carrega variáveis de ambiente do backend/.env
from dotenv import find_dotenv, load_dotenv
env_path = find_dotenv(filename=".env", raise_error_if_not_found=False, usecwd=True)
if env_path:
    print(f"Loading .env file from: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    print("Warning: backend/.env file not found. Relying on environment variables.")


# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("API starting up...")
    print("Necessary services initialized (placeholder).")
    yield
    print("API shutting down...")

# --- Criação da App FastAPI ---
app = FastAPI(
    title="Consultor Funil Eterno API",
    description="API para orquestrar agentes de IA (CrewAI) e gerenciar o processo do Funil Eterno.",
    version="0.1.0",
    lifespan=lifespan
)

# --- Configuração de CORS ---
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL"),
]
origins = [origin for origin in origins if origin]
if not origins:
    print("WARNING: No CORS origins specified. Allowing all origins (NOT recommended for production).")
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Inclusão de Routers ---
app.include_router(ai_tasks.router, prefix="/api/v1/tasks", tags=["AI Tasks"])

# --- Endpoint Raiz ---
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Consultor Funil Eterno API is running!"}

# --- Execução com Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Uvicorn server locally on http://127.0.0.1:{port} ...")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True) 