# 🚀 Guía de Despliegue - TaskMaster AI

Esta guía te ayudará a desplegar TaskMaster AI en diferentes entornos.

## 📋 Prerrequisitos

- Node.js 18+ 
- MongoDB 4.4+
- Cuenta en el proveedor de IA (OpenAI/Cohere/Gemini)

## 🛠️ Desarrollo Local

### 1. Configuración Inicial

```bash
# Clonar el proyecto
git clone <tu-repositorio>
cd taskmaster-ai

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Instalar dependencias
cd backend && npm install
cd ../frontend && npm install