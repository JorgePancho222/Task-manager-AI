// frontend/src/pages/Tasks.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import AIAnalysisModal from '../components/AIAnalysisModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get(`${API_URL}/api/tasks`, { params });
      setTasks(response.data.data.tasks);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      loadTasks();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      alert('Error al eliminar tarea');
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
      await axios.put(`${API_URL}/api/tasks/${task._id}`, { status: newStatus });
      loadTasks();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleAIAnalysis = async (task) => {
    try {
      setIsAIModalOpen(true);
      const response = await axios.post(`${API_URL}/api/ai/analyze-task`, {
        title: task.title,
        description: task.description
      });
      setAiAnalysis(response.data.data.analysis);
    } catch (error) {
      console.error('Error al analizar con IA:', error);
      alert('Error al analizar tarea con IA');
    }
  };

  const applyAIAnalysis = async (taskId, analysis) => {
  try {
    // VALIDACIÓN: Asegurar que taskId sea válido
    if (!taskId || taskId === 'undefined') {
      alert('Error: No se puede identificar la tarea. Por favor, actualiza la página.');
      return;
    }

    await axios.put(`${API_URL}/api/tasks/${taskId}`, {
      priority: analysis.priority,
      estimatedTime: analysis.estimatedTime,
      aiSuggestions: {
        priority: analysis.priority,
        estimatedTime: analysis.estimatedTime,
        tips: analysis.tips
      },
      subtasks: analysis.subtasks.map(title => ({ title, completed: false }))
    });
    
    setIsAIModalOpen(false);
    setAiAnalysis(null);
    loadTasks();
  } catch (error) {
    console.error('Error al aplicar análisis:', error);
    alert('Error al aplicar análisis: ' + (error.response?.data?.message || 'ID de tarea inválido'));
  }
};

  const getPriorityColor = (priority) => {
    const colors = {
      baja: 'bg-green-100 text-green-800 border-green-200',
      media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      alta: 'bg-orange-100 text-orange-800 border-orange-200',
      urgente: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || colors.media;
  };

  const filteredTasks = tasks;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Tareas</h1>
            <p className="text-gray-600 mt-1">Gestiona y organiza tu trabajo</p>
          </div>
          <button
            onClick={handleCreateTask}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Nueva Tarea
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['all', 'pendiente', 'en_progreso', 'completada'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'Todas' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Lista de Tareas */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay tareas
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Crea tu primera tarea para comenzar'
                : `No tienes tareas con estado "${filter.replace('_', ' ')}"`
              }
            </p>
            <button
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Crear Tarea
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      task.status === 'completada'
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.status === 'completada' && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </button>

                  {/* Contenido de la tarea */}
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      task.status === 'completada' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    )}

                    {/* Etiquetas */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.estimatedTime > 0 && (
                        <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          ⏱ {task.estimatedTime} min
                        </span>
                      )}
                      {task.category && task.category !== 'general' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {task.category}
                        </span>
                      )}
                    </div>

                    {/* Subtareas */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {task.subtasks.slice(0, 3).map((subtask, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-4 h-4 rounded border border-gray-300"></span>
                            <span>{subtask.title}</span>
                          </div>
                        ))}
                        {task.subtasks.length > 3 && (
                          <p className="text-xs text-gray-500 ml-6">
                            +{task.subtasks.length - 3} más
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tips de IA */}
                    {task.aiSuggestions && task.aiSuggestions.tips && task.aiSuggestions.tips.length > 0 && (
                      <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1">
                          🤖 Sugerencias de IA
                        </p>
                        <ul className="text-xs text-purple-800 space-y-1">
                          {task.aiSuggestions.tips.slice(0, 2).map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAIAnalysis(task)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      title="Analizar con IA"
                    >
                      🤖
                    </button>
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear/Editar Tarea */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
            loadTasks();
          }}
        />
      )}

      {/* Modal de Análisis de IA */}
      {isAIModalOpen && aiAnalysis && (
        <AIAnalysisModal
          analysis={aiAnalysis}
          taskId={selectedTask?._id}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiAnalysis(null);
          }}
          onApply={(taskId) => applyAIAnalysis(taskId, aiAnalysis)}
        />
      )}
    </div>
  );
}
