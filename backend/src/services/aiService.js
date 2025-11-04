// backend/src/services/aiService.js
import axios from 'axios';

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.COHERE_API_KEY || process.env.GEMINI_API_KEY;
    this.provider = process.env.AI_PROVIDER || 'openai';
    console.log(`[AI] Iniciando servicio de IA con proveedor: ${this.provider}`);
  }

  /**
   * Analiza una tarea y proporciona recomendaciones inteligentes
   * @param {string} taskTitle - Título de la tarea
   * @param {string} taskDescription - Descripción de la tarea
   * @returns {Object} Análisis con prioridad, tiempo estimado, tips y subtareas
   */
  async analyzeTask(taskTitle, taskDescription = '') {
    try {
      console.log(`[AI] Analizando tarea: "${taskTitle}"`);
      
      const prompt = this.buildAnalysisPrompt(taskTitle, taskDescription);
      let analysis;

      switch (this.provider) {
        case 'openai':
          analysis = await this.analyzeWithOpenAI(prompt);
          break;
        case 'cohere':
          analysis = await this.analyzeWithCohere(prompt);
          break;
        case 'gemini':
          analysis = await this.analyzeWithGemini(prompt);
          break;
        default:
          console.log('[AI] Proveedor no configurado, usando análisis básico');
          analysis = this.analyzeWithFallback(taskTitle, taskDescription);
      }

      console.log('[AI] Análisis completado exitosamente');
      return analysis;
    } catch (error) {
      console.error('[AI ERROR] Error en análisis de IA:', error.message);
      // Retornar análisis por defecto si falla
      return this.analyzeWithFallback(taskTitle, taskDescription);
    }
  }

  /**
   * Construye el prompt para la IA
   */
  buildAnalysisPrompt(title, description) {
    return `Eres un asistente experto en productividad y gestión de tareas. Analiza la siguiente tarea y proporciona un análisis detallado.

Tarea: "${title}"
Descripción: "${description || 'Sin descripción adicional'}"

Por favor, proporciona tu análisis en el siguiente formato JSON exacto (sin texto adicional, solo el JSON):

{
  "priority": "una de: baja, media, alta, urgente",
  "estimatedTime": número_de_minutos_estimados,
  "tips": [
    "consejo 1 específico y accionable",
    "consejo 2 específico y accionable",
    "consejo 3 específico y accionable"
  ],
  "subtasks": [
    "subtarea 1 específica y clara",
    "subtarea 2 específica y clara",
    "subtarea 3 específica y clara"
  ]
}

Criterios para determinar la prioridad:
- urgente: Requiere atención inmediata, deadline hoy o impacto crítico
- alta: Importante, deadline cercano (1-3 días) o alta relevancia
- media: Moderada importancia, deadline normal (3-7 días)
- baja: Puede esperar, sin deadline urgente

Para el tiempo estimado, considera la complejidad de la tarea. Usa estos rangos:
- Tareas simples: 15-30 minutos
- Tareas moderadas: 30-90 minutos
- Tareas complejas: 90-180 minutos
- Proyectos grandes: 180+ minutos

Los consejos deben ser específicos, prácticos y directamente aplicables a esta tarea.
Las subtareas deben dividir el trabajo en pasos lógicos y secuenciales.`;
  }

  /**
   * Análisis con OpenAI GPT
   */
  async analyzeWithOpenAI(prompt) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key no configurada');
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'Eres un asistente de productividad experto. Siempre respondes en formato JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content;
    return this.parseAIResponse(content);
  }

  /**
   * Análisis con Cohere
   */
  async analyzeWithCohere(prompt) {
    if (!process.env.COHERE_API_KEY) {
      throw new Error('Cohere API key no configurada');
    }

    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7,
        stop_sequences: ['--']
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.generations[0].text;
    return this.parseAIResponse(content);
  }

  /**
   * Análisis con Google Gemini
   */
  async analyzeWithGemini(prompt) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key no configurada');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.candidates[0].content.parts[0].text;
    return this.parseAIResponse(content);
  }

  /**
   * Parsea la respuesta de la IA extrayendo el JSON
   */
  parseAIResponse(content) {
    try {
      // Intentar parsear directamente
      const parsed = JSON.parse(content);
      return this.validateAndCleanAnalysis(parsed);
    } catch (e1) {
      try {
        // Intentar extraer JSON con regex
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateAndCleanAnalysis(parsed);
        }
      } catch (e2) {
        console.error('[AI] No se pudo parsear respuesta:', content);
      }
    }
    
    throw new Error('No se pudo parsear la respuesta de la IA');
  }

  /**
   * Valida y limpia el análisis de la IA
   */
  validateAndCleanAnalysis(analysis) {
    const validPriorities = ['baja', 'media', 'alta', 'urgente'];
    
    return {
      priority: validPriorities.includes(analysis.priority) ? analysis.priority : 'media',
      estimatedTime: Math.max(5, Math.min(parseInt(analysis.estimatedTime) || 60, 480)),
      tips: Array.isArray(analysis.tips) ? analysis.tips.slice(0, 3) : [],
      subtasks: Array.isArray(analysis.subtasks) ? analysis.subtasks.slice(0, 5) : []
    };
  }

  /**
   * Análisis básico sin IA (fallback)
   */
  analyzeWithFallback(taskTitle, taskDescription) {
    console.log('[AI] Usando análisis fallback (sin IA)');
    
    const text = (taskTitle + ' ' + taskDescription).toLowerCase();
    let priority = 'media';
    let estimatedTime = 60;

    // Análisis de prioridad por palabras clave
    const urgentKeywords = ['urgente', 'inmediato', 'hoy', 'ahora', 'importante', 'crítico', 'emergency'];
    const highKeywords = ['pronto', 'mañana', 'esta semana', 'deadline', 'fecha límite'];
    const lowKeywords = ['después', 'cuando pueda', 'algún día', 'opcional'];

    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      priority = 'urgente';
      estimatedTime = 45;
    } else if (highKeywords.some(keyword => text.includes(keyword))) {
      priority = 'alta';
      estimatedTime = 90;
    } else if (lowKeywords.some(keyword => text.includes(keyword))) {
      priority = 'baja';
      estimatedTime = 30;
    }

    // Estimación de tiempo basada en longitud de descripción
    const descLength = taskDescription.length;
    if (descLength > 200) {
      estimatedTime = Math.min(estimatedTime * 1.5, 240);
    } else if (descLength < 50) {
      estimatedTime = Math.max(estimatedTime * 0.7, 15);
    }

    return {
      priority,
      estimatedTime: Math.round(estimatedTime),
      tips: [
        'Divide esta tarea en pasos más pequeños y manejables',
        'Elimina todas las distracciones antes de comenzar',
        'Establece un temporizador para mantener el enfoque',
        'Toma descansos breves cada 25 minutos (técnica Pomodoro)'
      ].slice(0, 3),
      subtasks: [
        'Planificar y preparar recursos necesarios',
        'Ejecutar la tarea principal paso a paso',
        'Revisar y verificar el resultado',
        'Documentar hallazgos o conclusiones'
      ].slice(0, 3)
    };
  }

  /**
   * Genera insights de productividad basados en tareas del usuario
   */
  async generateProductivityInsights(tasks) {
    try {
      const completed = tasks.filter(t => t.status === 'completada').length;
      const total = tasks.length;
      const pending = tasks.filter(t => t.status === 'pendiente').length;
      const inProgress = tasks.filter(t => t.status === 'en_progreso').length;
      
      const avgTime = total > 0 
        ? tasks.reduce((sum, t) => sum + (t.estimatedTime || 0), 0) / total 
        : 0;

      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Determinar recomendación basada en métricas
      let recommendation;
      if (completionRate >= 80) {
        recommendation = '🎉 ¡Excelente trabajo! Tu tasa de finalización es muy alta. Mantén este ritmo y considera tomar tareas más desafiantes.';
      } else if (completionRate >= 60) {
        recommendation = '👍 Buen progreso. Estás completando la mayoría de tus tareas. Intenta enfocarte en terminar las pendientes antes de agregar nuevas.';
      } else if (completionRate >= 40) {
        recommendation = '💪 Hay margen de mejora. Considera reducir el número de tareas activas y enfócarte en completar las existentes primero.';
      } else if (total > 0) {
        recommendation = '🎯 Enfócate en finalizar. Tienes muchas tareas pendientes. Prioriza 2-3 tareas importantes y termínalas antes de continuar.';
      } else {
        recommendation = '📝 ¡Comienza a agregar tareas! Define tus objetivos y divide el trabajo en tareas específicas y medibles.';
      }

      return {
        totalTasks: total,
        completed,
        pending,
        inProgress,
        completionRate: Math.round(completionRate),
        averageTaskTime: Math.round(avgTime),
        recommendation,
        insights: {
          mostProductiveDay: 'Lunes', // Esto se podría calcular con datos reales
          averageTasksPerDay: total > 0 ? (total / 7).toFixed(1) : 0,
          longestStreak: 3 // Esto se podría calcular con datos reales
        }
      };
    } catch (error) {
      console.error('[AI ERROR] Error al generar insights:', error);
      return {
        completionRate: 0,
        averageTaskTime: 0,
        recommendation: 'No hay suficientes datos para generar insights. Comienza agregando y completando tareas.'
      };
    }
  }
}

// CAMBIO IMPORTANTE: Usar export default en lugar de module.exports
export default new AIService();