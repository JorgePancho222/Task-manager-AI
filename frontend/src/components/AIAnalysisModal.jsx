// frontend/src/components/AIAnalysisModal.jsx
import { useState } from 'react';

export default function AIAnalysisModal({ analysis, taskId, onClose, onApply }) {
  const [applying, setApplying] = useState(false);

  // Debug log
  console.log('🔍 AIAnalysisModal - taskId:', taskId);

  if (!analysis) return null;

  const handleApply = async () => {
    if (!taskId) {
      console.error('❌ taskId no disponible en el modal');
      alert('Error: No se puede identificar la tarea. Por favor, actualiza la página.');
      return;
    }

    setApplying(true);
    try {
      console.log('🔄 Aplicando análisis para taskId:', taskId);
      await onApply(taskId);
    } catch (error) {
      console.error('❌ Error en handleApply:', error);
    } finally {
      setApplying(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Análisis de IA
              </h2>
              <p className="text-gray-600 text-sm">
                Recomendaciones inteligentes para tu tarea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Prioridad y Tiempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>🎯</span>
                Prioridad Sugerida
              </h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(analysis.priority)}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {analysis.priority}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <span>⏱️</span>
                Tiempo Estimado
              </h3>
              <p className="text-2xl font-bold text-green-700">
                {analysis.estimatedTime} min
              </p>
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span>💡</span>
              Consejos de Productividad
            </h3>
            <ul className="space-y-2">
              {analysis.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-purple-800">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Subtareas Sugeridas */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <span>📋</span>
              Subtareas Sugeridas
            </h3>
            <div className="space-y-2">
              {analysis.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-orange-100">
                  <div className="w-6 h-6 rounded-full border-2 border-orange-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-orange-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-orange-800">{subtask}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nota de IA */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              💡 Estas recomendaciones fueron generadas por inteligencia artificial 
              basándose en el contenido de tu tarea.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleApply}
            disabled={applying || !taskId}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {applying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Aplicando...
              </>
            ) : (
              <>
                <span>✅</span>
                Aplicar Recomendaciones
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
