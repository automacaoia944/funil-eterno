import os
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv
import logging

# Carrega variáveis de ambiente do .env na raiz do backend, se existir
env_path = find_dotenv(filename=".env", raise_error_if_not_found=False, usecwd=True)
if env_path:
    # Usar print aqui pode ser útil antes do logging configurar totalmente
    print(f"Loading .env file for Supabase client from: {env_path}")
    load_dotenv(dotenv_path=env_path)
else:
    print("Warning: backend/.env file not found for Supabase client. Relying on environment variables.")

# Configura logging básico se não configurado globalmente
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

supabase_admin_client: Client | None = None
supabase_url: str | None = os.getenv("SUPABASE_URL")
supabase_service_key: str | None = os.getenv("SUPABASE_SERVICE_KEY") # Usar a chave de serviço

if not supabase_url or not supabase_service_key:
    logger.error("CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables not set. Backend DB functionality will fail.")
else:
    try:
        supabase_admin_client = create_client(supabase_url, supabase_service_key)
        logger.info("Supabase admin client initialized successfully.")
        # Teste rápido de conexão - REMOVIDO por enquanto para evitar dependência de tabela específica
        # logger.info("Supabase connection test placeholder successful (no actual query run).")

    except Exception as e:
        logger.error(f"CRITICAL: Failed to initialize Supabase admin client: {e}", exc_info=True)
        supabase_admin_client = None # Garante que é None se falhar 