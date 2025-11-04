import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Verificar variables de entorno críticas
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI no está definida');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET no está definida');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection (simplificada para MongoDB Driver v4+)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => {
  console.error('❌ Error de MongoDB:', err);
  process.exit(1);
});

// Manejo de eventos de conexión de MongoDB
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose conectado a la base de datos');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

// Importar rutas con import
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import aiRoutes from './routes/ai.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Health check mejorado
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(health);
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'TaskMaster AI Backend API',
    version: '1.0.0',
    status: 'operational'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error global:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Recibido SIGINT. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Recibido SIGTERM. Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});