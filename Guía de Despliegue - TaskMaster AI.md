🚀 Despliegue Completo en 3 Pasos

Esta guía te ayudará a desplegar tu propia instancia de TaskMaster AI en producción.
📋 Prerrequisitos

    Cuenta en GitHub

    Cuenta en Vercel (para frontend)

    Cuenta en Render (para backend)

    Cuenta en MongoDB Atlas (para base de datos)

    Node.js 18+ instalado localmente

🔧 Paso 1: Configurar la Base de Datos (MongoDB Atlas)
1.1 Crear Cluster en MongoDB Atlas

    Ve a MongoDB Atlas

    Crea un nuevo cluster (gratuito)

    Configura red: Allow access from anywhere (0.0.0.0/0)

    Crea usuario de base de datos

1.2 Obtener Connection String
mongodb+srv://usuario:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority

⚙️ Paso 2: Desplegar Backend (Render)
2.1 Preparar el Backend
# Clonar repositorio
git clone https://github.com/JorgePancho222/Task-manager-AI.git
cd Task-manager-AI/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

2.2 Variables de Entorno para Backend
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura_aqui
PORT=10000
NODE_ENV=production

2.3 Desplegar en Render

    Ve a render.com

    New + → Web Service

    Conecta tu repositorio de GitHub

    Configuración:

        Name: taskmaster-backend

        Environment: Node

        Region: Oregon (US West)

        Branch: master

        Root Directory: backend

        Build Command: npm install

        Start Command: node src/server.js

    Add Environment Variables:

        Agrega todas las variables del paso 2.2

    Create Web Service

2.4 Verificar Backend
# Probar health check
curl https://tu-backend.onrender.com/api/health

🎨 Paso 3: Desplegar Frontend (Vercel)
3.1 Preparar el Frontend
cd ../frontend
npm install
3.3 Desplegar en Vercel

    Ve a vercel.com

    Add New Project

    Conecta tu repositorio de GitHub

    Configuración:

        Framework Preset: Vite

        Root Directory: frontend

        Build Command: npm run build

        Output Directory: dist

    Environment Variables:

        VITE_API_URL: https://tu-backend.onrender.com

    Deploy

3.4 Configurar Rutas SPA (Opcional)

Crea vercel.json en la raíz del frontend:
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}

✅ Paso 4: Verificar Despliegue Completo
4.1 Probar Endpoints
# Backend
https://tu-backend.onrender.com/api/health

# Frontend  
https://tu-frontend.vercel.app

# Base de datos (desde backend)
https://tu-backend.onrender.com/api/auth/register

4.2 Probar Funcionalidades

    Registrar usuario en la aplicación

    Crear tareas y verificar persistencia

    Probar análisis de IA

    Verificar dashboard con estadísticas

🐛 Solución de Problemas Comunes
Error: CORS
// En backend/src/server.js
app.use(cors({
  origin: ['https://tu-frontend.vercel.app'],
  credentials: true
}));

Error: Rutas 404 en Frontend

    Verificar vercel.json para SPA

    Confirmar que todas las rutas usen /api/

Error: Conexión a Base de Datos

    Verificar MONGODB_URI en Render

    Confirmar IP whitelist en MongoDB Atlas

Error: Variables de Entorno

    Reiniciar servicio después de cambiar variables

    Verificar nombres exactos (case sensitive)

🔒 Configuración de Seguridad
Variables Sensibles

    JWT_SECRET: Mínimo 32 caracteres

    MONGODB_URI: No compartir públicamente

    No commitear .env files

Configuración MongoDB

    Usar autenticación

    Limitar IPs de acceso

    Habilitar encriptación

📊 Monitoreo y Mantenimiento
Render Dashboard

    Monitorear logs en tiempo real

    Verificar uso de recursos

    Configurar alertas

Vercel Analytics

    Métricas de performance

    Análisis de usuarios

    Errores en producción

MongoDB Atlas

    Monitoreo de conexiones

    Uso de almacenamiento

    Performance queries

🚀 Comandos Útiles
Despliegue Rápido
# Backend
git add . && git commit -m "deploy: backend updates"
git push origin master

# Frontend  
git add . && git commit -m "deploy: frontend updates" 
git push origin master

Logs y Debug
# Ver logs de Render
# Ir a dashboard de Render → tu servicio → Logs

# Ver logs de Vercel
# Ir a dashboard de Vercel → tu proyecto → Deployments → Logs

🎉 ¡Despliegue Completado!

Tu aplicación TaskMaster AI debería estar funcionando en:

    Frontend: https://tu-frontend.vercel.app

    Backend: https://tu-backend.onrender.com

    Base de datos: MongoDB Atlas Cloud

¡Felicidades! 🎊 Tu aplicación está en producción.
📞 Soporte

Si encuentras problemas:

    Revisa los logs en Render/Vercel

    Verifica las variables de entorno

    Confirma la conexión a la base de datos

    Abre un issue en el repositorio de GitHub

¡Happy coding! 🚀

