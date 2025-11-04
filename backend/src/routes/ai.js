// backend/src/routes/ai.js
import express from 'express';
import aiService from '../services/aiService.js';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// @route   POST /api/ai/analyze-task
// @desc    Analizar tarea con IA y obtener recomendaciones
// @access  Private
router.post('/analyze-task', async (req, res) => {
  try {
    const { title, description, taskId } = req.body;

    // Validar título
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'El título de la tarea es requerido (mínimo 3 caracteres)' 
      });
    }

    console.log(`[AI] Usuario ${req.userId} solicitó análisis para: "${title}"`);

    // Realizar análisis con IA
    const analysis = await aiService.analyzeTask(title, description || '');

    // Si se proporcionó taskId, actualizar la tarea con las sugerencias
    if (taskId) {
      try {
        await Task.findOneAndUpdate(
          { _id: taskId, userId: req.userId },
          { 
            aiSuggestions: {
              priority: analysis.priority,
              estimatedTime: analysis.estimatedTime,
              tips: analysis.tips,
              generatedAt: new Date()
            }
          }
        );
        console.log(`[AI] Sugerencias guardadas en tarea ${taskId}`);
      } catch (error) {
        console.error('[AI] Error al actualizar tarea con sugerencias:', error);
        // No fallar la petición si solo falla la actualización
      }
    }

    res.json({
      success: true,
      message: 'Análisis completado exitosamente',
      data: { analysis }
    });
  } catch (error) {
    console.error('[AI ERROR] Error en análisis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al analizar tarea. Por favor intenta nuevamente.' 
    });
  }
});

// @route   GET /api/ai/insights
// @desc    Obtener insights de productividad del usuario
// @access  Private
router.get('/insights', async (req, res) => {
  try {
    console.log(`[AI] Usuario ${req.userId} solicitó insights de productividad`);

    // Obtener todas las tareas del usuario
    const tasks = await Task.find({ userId: req.userId });

    // Generar insights
    const insights = await aiService.generateProductivityInsights(tasks);

    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    console.error('[AI ERROR] Error al generar insights:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar insights de productividad' 
    });
  }
});

// @route   POST /api/ai/suggest-priority
// @desc    Sugerir prioridad para múltiples tareas
// @access  Private
router.post('/suggest-priority', async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de IDs de tareas' 
      });
    }

    // Obtener tareas
    const tasks = await Task.find({
      _id: { $in: taskIds },
      userId: req.userId
    });

    // Analizar cada tarea
    const suggestions = await Promise.all(
      tasks.map(async (task) => {
        try {
          const analysis = await aiService.analyzeTask(task.title, task.description);
          return {
            taskId: task._id,
            title: task.title,
            currentPriority: task.priority,
            suggestedPriority: analysis.priority,
            estimatedTime: analysis.estimatedTime
          };
        } catch (error) {
          console.error(`[AI] Error analizando tarea ${task._id}:`, error);
          return {
            taskId: task._id,
            title: task.title,
            error: 'No se pudo analizar'
          };
        }
      })
    );

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('[AI ERROR] Error al sugerir prioridades:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al sugerir prioridades' 
    });
  }
});

// @route   POST /api/ai/batch-analyze
// @desc    Analizar múltiples tareas en lote
// @access  Private
router.post('/batch-analyze', async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de tareas' 
      });
    }

    if (tasks.length > 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Máximo 10 tareas por lote' 
      });
    }

    const analyses = await Promise.all(
      tasks.map(async (task) => {
        try {
          const analysis = await aiService.analyzeTask(task.title, task.description);
          return {
            title: task.title,
            ...analysis
          };
        } catch (error) {
          return {
            title: task.title,
            error: 'Error en análisis'
          };
        }
      })
    );

    res.json({
      success: true,
      data: { analyses }
    });
  } catch (error) {
    console.error('[AI ERROR] Error en análisis por lotes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al analizar tareas' 
    });
  }
});

// @route   GET /api/ai/health
// @desc    Verificar estado del servicio de IA
// @access  Private
router.get('/health', async (req, res) => {
  try {
    const provider = process.env.AI_PROVIDER || 'fallback';
    const isConfigured = !!(
      process.env.OPENAI_API_KEY || 
      process.env.COHERE_API_KEY || 
      process.env.GEMINI_API_KEY
    );

    res.json({
      success: true,
      data: {
        provider,
        configured: isConfigured,
        status: isConfigured ? 'operational' : 'fallback mode',
        message: isConfigured 
          ? `Servicio de IA funcionando con ${provider}`
          : 'Sin API key configurada, usando análisis básico'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar servicio de IA' 
    });
  }
});

// CAMBIO IMPORTANTE: Usar export default en lugar de module.exports
export default router;