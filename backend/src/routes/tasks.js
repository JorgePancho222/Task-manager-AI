import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// @route   GET /api/tasks
// @desc    Obtener todas las tareas del usuario
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    let filter = { userId: req.userId };
    
    // Aplicar filtros si existen
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { tasks },
      count: tasks.length
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al obtener tareas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener tareas' 
    });
  }
});

// @route   POST /api/tasks
// @desc    Crear nueva tarea
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      estimatedTime,
      category,
      subtasks
    } = req.body;

    // Validar título
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'El título es requerido (mínimo 3 caracteres)' 
      });
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'media',
      status: status || 'pendiente',
      dueDate: dueDate || null,
      estimatedTime: estimatedTime || 0,
      category: category?.trim() || 'general',
      subtasks: subtasks || [],
      userId: req.userId
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Tarea creada exitosamente',
      data: { task }
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al crear tarea:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages[0] || 'Error de validación' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al crear tarea' 
    });
  }
});

// @route   GET /api/tasks/stats/summary
// @desc    Obtener estadísticas de tareas del usuario
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const stats = await Task.aggregate([
      { 
        $match: { userId } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'completada'] }, 1, 0] 
            } 
          },
          pending: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'pendiente'] }, 1, 0] 
            } 
          },
          inProgress: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'en_progreso'] }, 1, 0] 
            } 
          },
          urgent: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'urgente'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { 
      total: 0, 
      completed: 0, 
      pending: 0, 
      inProgress: 0, 
      urgent: 0
    };

    res.json({
      success: true,
      data: { 
        stats: result
      }
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Actualizar tarea
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      dueDate,
      estimatedTime,
      category,
      subtasks,
      aiSuggestions
    } = req.body;

    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarea no encontrada' 
      });
    }

    // Actualizar campos permitidos
    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (priority !== undefined) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (estimatedTime !== undefined) updateFields.estimatedTime = estimatedTime;
    if (category !== undefined) updateFields.category = category.trim();
    if (subtasks !== undefined) updateFields.subtasks = subtasks;
    if (aiSuggestions !== undefined) updateFields.aiSuggestions = aiSuggestions;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tarea actualizada exitosamente',
      data: { task: updatedTask }
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al actualizar tarea:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages[0] || 'Error de validación' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar tarea' 
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Eliminar tarea
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarea no encontrada' 
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al eliminar tarea:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar tarea' 
    });
  }
});

// @route   PATCH /api/tasks/:id/toggle
// @desc    Alternar estado de tarea
// @access  Private
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tarea no encontrada' 
      });
    }

    const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
    task.status = newStatus;
    await task.save();

    res.json({
      success: true,
      message: `Tarea marcada como ${newStatus}`,
      data: { task }
    });
  } catch (error) {
    console.error('[TASKS ERROR] Error al alternar estado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar tarea' 
    });
  }
});

export default router;
