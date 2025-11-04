import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PRIORITY_OPTIONS = [
  { value: 'baja', label: 'Baja', color: 'text-green-600 bg-green-50' },
  { value: 'media', label: 'Media', color: 'text-yellow-600 bg-yellow-50' },
  { value: 'alta', label: 'Alta', color: 'text-orange-600 bg-orange-50' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-600 bg-red-50' }
];

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En Progreso' },
  { value: 'completada', label: 'Completada' }
];

export default function TaskModal({ task, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'pendiente',
    dueDate: '',
    estimatedTime: '',
    category: 'general',
    subtasks: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'media',
        status: task.status || 'pendiente',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedTime: task.estimatedTime || '',
        category: task.category || 'general',
        subtasks: task.subtasks || []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;

    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }]
    }));
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : 0,
        dueDate: formData.dueDate || null,
        subtasks: formData.subtasks.map(st => ({
          title: st.title,
          completed: st.completed || false
        }))
      };

      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/tasks/${task._id}`, payload);
      } else {
        response = await axios.post(`${API_URL}/tasks`, payload);
      }

      if (response.data.success) {
        onSave();
      }
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      setError(error.response?.data?.message || 'Error al guardar tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!formData.title.trim()) {
      setError('Necesitas un título para analizar con IA');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/ai/analyze-task`, {
        title: formData.title,
        description: formData.description
      });

      if (response.data.success) {
        const analysis = response.data.data.analysis;
        setFormData(prev => ({
          ...prev,
          priority: analysis.priority,
          estimatedTime: analysis.estimatedTime.toString(),
          subtasks: analysis.subtasks.map(title => ({ title, completed: false }))
        }));
      }
    } catch (error) {
      console.error('Error en análisis de IA:', error);
      setError('Error al analizar con IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="¿Qué necesitas hacer?"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Fila de Campos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tiempo Estimado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo (min)
              </label>
              <input
                type="number"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                min="0"
                max="10080"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="60"
              />
            </div>
          </div>

          {/* Fila de Campos 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="trabajo, personal, etc."
              />
            </div>
          </div>

          {/* Subtareas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtareas
            </label>
            <div className="space-y-2">
              {/* Agregar Subtarea */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Agregar subtarea..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  +
                </button>
              </div>

              {/* Lista de Subtareas */}
              {formData.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="flex-1 text-sm">{subtask.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer con Botones */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleAIAnalysis}
            disabled={loading || !formData.title.trim()}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🤖</span>
            Analizar con IA
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </div>
              ) : (
                isEditing ? 'Actualizar' : 'Crear Tarea'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}