// backend/src/models/Task.js
const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    minlength: [3, 'El título debe tener al menos 3 caracteres'],
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  priority: {
    type: String,
    enum: {
      values: ['baja', 'media', 'alta', 'urgente'],
      message: '{VALUE} no es una prioridad válida'
    },
    default: 'media'
  },
  status: {
    type: String,
    enum: {
      values: ['pendiente', 'en_progreso', 'completada'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'pendiente'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // Permitir null o fechas futuras
        return !value || value >= new Date();
      },
      message: 'La fecha de vencimiento no puede ser en el pasado'
    }
  },
  estimatedTime: {
    type: Number, // en minutos
    default: 0,
    min: [0, 'El tiempo estimado no puede ser negativo'],
    max: [10080, 'El tiempo estimado no puede exceder 1 semana (10080 minutos)']
  },
  category: {
    type: String,
    default: 'general',
    trim: true,
    maxlength: [50, 'La categoría no puede exceder 50 caracteres']
  },
  subtasks: [subtaskSchema],
  aiSuggestions: {
    priority: {
      type: String,
      enum: ['baja', 'media', 'alta', 'urgente']
    },
    estimatedTime: {
      type: Number,
      min: 0
    },
    tips: [{
      type: String,
      maxlength: 500
    }],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido'],
    index: true // Índice para mejorar queries
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Middleware para actualizar completedAt cuando status cambia a completada
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'completada' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completada') {
      this.completedAt = null;
    }
  }
  next();
});

// Índices compuestos para optimizar queries frecuentes
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

// Método virtual para calcular progreso de subtareas
taskSchema.virtual('subtasksProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return 0;
  }
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Método virtual para verificar si está vencida
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completada') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Asegurar que los virtuals se incluyan en JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);