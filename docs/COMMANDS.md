# ⚡ Comandos Útiles - TaskMaster AI

Una referencia rápida de todos los comandos necesarios para desarrollar, ejecutar y desplegar TaskMaster AI.

## 🛠️ Desarrollo

### Inicialización
```bash
# Clonar y configurar
git clone <repository-url>
cd taskmaster-ai

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install

# Configurar entorno (crear .env files)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env