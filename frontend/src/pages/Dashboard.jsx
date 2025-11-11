import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    urgent: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas
      const statsResponse = await axios.get(`${API_URL}/api/tasks/stats/summary`);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.stats);
      }

      // Cargar tareas recientes
      const tasksResponse = await axios.get(`${API_URL}/api/tasks?status=all`);
      if (tasksResponse.data.success) {
        setRecentTasks(tasksResponse.data.data.tasks.slice(0, 5));
      }

      // Cargar insights de IA
      const insightsResponse = await axios.get(`${API_URL}/api/ai/insights`);
      if (insightsResponse.data.success) {
        setInsights(insightsResponse.data.data.insights);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.media;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: '⏳',
      en_progreso: '🔄',
      completada: '✅'
    };
    return icons[status] || '📝';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de Bienvenida */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Aquí tienes un resumen de tu productividad
          </p>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tareas */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl text-blue-600">📋</span>
              </div>
            </div>
          </div>

          {/* Completadas */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl text-green-600">✅</span>
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl text-orange-600">⏳</span>
              </div>
            </div>
          </div>

          {/* Urgentes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.urgent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-xl text-red-600">🚨</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda - Progreso e Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Barra de Progreso */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Progreso General</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Tasa de Finalización</span>
                    <span>{getCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                    <p className="text-xs text-blue-600">Hechas</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                    <p className="text-xs text-orange-600">Pendientes</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
                    <p className="text-xs text-purple-600">En Progreso</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights de IA */}
            {insights && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Insights de IA</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <p className="text-purple-800 text-sm leading-relaxed">
                      {insights.recommendation}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                      <p className="text-2xl font-bold text-purple-600">{insights.completionRate}%</p>
                      <p className="text-purple-700">Tasa de Finalización</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-purple-100">
                      <p className="text-2xl font-bold text-purple-600">{insights.averageTaskTime}</p>
                      <p className="text-purple-700">Promedio (min)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha - Tareas Recientes y Acciones Rápidas */}
          <div className="space-y-8">
            {/* Tareas Recientes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Tareas Recientes</h2>
                <Link
                  to="/tasks"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todas
                </Link>
              </div>

              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📝</span>
                  <p className="text-gray-600 text-sm mb-4">No hay tareas recientes</p>
                  <Link
                    to="/tasks"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Crear Primera Tarea
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                    >
                      <span className="text-lg">{getStatusIcon(task.status)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          task.status === 'completada' ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.estimatedTime > 0 && (
                            <span className="text-xs text-gray-500">
                              ⏱ {task.estimatedTime}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <Link
                  to="/tasks"
                  className="w-full flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition group"
                >
                  <span className="text-xl">➕</span>
                  <div>
                    <p className="font-semibold">Nueva Tarea</p>
                    <p className="text-sm text-blue-600">Crear una nueva tarea</p>
                  </div>
                </Link>

                <Link
                  to="/tasks?filter=urgente"
                  className="w-full flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition group"
                >
                  <span className="text-xl">🚨</span>
                  <div>
                    <p className="font-semibold">Tareas Urgentes</p>
                    <p className="text-sm text-red-600">Ver tareas prioritarias</p>
                  </div>
                </Link>

                <button
                  onClick={loadDashboardData}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 transition group"
                >
                  <span className="text-xl">🔄</span>
                  <div>
                    <p className="font-semibold">Actualizar</p>
                    <p className="text-sm text-gray-600">Refrescar datos</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Estado del Sistema */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Estado del Sistema</h3>
              <p className="text-sm text-gray-600">Todos los sistemas funcionando correctamente</p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Operacional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
