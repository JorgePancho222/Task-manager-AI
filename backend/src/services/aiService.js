// backend/src/services/aiService.js
class AIService {
  async analyzeTask(title, description = '') {
    console.log(`[AI] Analizando tarea: "${title}" con análisis básico`);
    return this.basicAnalysis(title, description);
  }

  // ANÁLISIS BÁSICO - SIN API EXTERNA
  basicAnalysis(title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    // Prioridad basada en palabras clave
    let priority = 'media';
    if (text.includes('urgent') || text.includes('urgente') || text.includes('emergency') || text.includes('!')) {
      priority = 'urgente';
    } else if (text.includes('important') || text.includes('importante') || text.includes('critical')) {
      priority = 'alta';
    } else if (text.includes('low') || text.includes('baja') || text.includes('optional')) {
      priority = 'baja';
    }

    // Tiempo estimado basado en longitud del texto
    const wordCount = text.split(/\s+/).length;
    let estimatedTime = 30;
    if (wordCount < 10) estimatedTime = 15;
    else if (wordCount < 25) estimatedTime = 30;
    else if (wordCount < 50) estimatedTime = 60;
    else estimatedTime = 90;

    // Consejos basados en el contenido
    const tips = [];
    if (text.includes('meeting') || text.includes('reunión')) {
      tips.push('Prepara una agenda antes de la reunión');
      tips.push('Toma notas durante la discusión');
    } else if (text.includes('report') || text.includes('reporte') || text.includes('document')) {
      tips.push('Divide el documento en secciones');
      tips.push('Revisa la ortografía antes de finalizar');
    } else {
      tips.push('Divide la tarea en pasos más pequeños');
      tips.push('Establece un tiempo límite para completarla');
    }

    // Subtareas sugeridas
    const subtasks = [
      'Investigar información relevante',
      'Preparar materiales necesarios', 
      'Ejecutar la tarea principal',
      'Revisar y verificar resultados'
    ];

    return {
      priority,
      estimatedTime,
      tips: tips.slice(0, 2),
      subtasks: subtasks.slice(0, 2)
    };
  }

  async generateProductivityInsights(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completada').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let recommendation = "¡Comienza creando tu primera tarea!";
    if (totalTasks > 0) {
      if (completionRate >= 80) {
        recommendation = "¡Excelente trabajo! Tu productividad es impresionante.";
      } else if (completionRate >= 50) {
        recommendation = "Vas por buen camino. Enfócate en completar las tareas pendientes.";
      } else {
        recommendation = "Te recomendamos establecer prioridades claras y tiempos realistas.";
      }
    }

    return {
      recommendation,
      completionRate,
      averageTaskTime: 45,
      totalTasks,
      completedTasks
    };
  }
}

export default new AIService();
