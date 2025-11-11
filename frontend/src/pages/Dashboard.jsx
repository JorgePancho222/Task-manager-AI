const loadDashboardData = async () => {
  try {
    setLoading(true);
    
    // Cargar todas las tareas y calcular estadísticas localmente
    const tasksResponse = await axios.get(`${API_URL}/api/tasks?status=all`);
    if (tasksResponse.data.success) {
      const tasks = tasksResponse.data.data.tasks;
      setRecentTasks(tasks.slice(0, 5));
      
      // Calcular estadísticas localmente
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completada').length,
        pending: tasks.filter(t => t.status === 'pendiente').length,
        inProgress: tasks.filter(t => t.status === 'en_progreso').length,
        urgent: tasks.filter(t => t.priority === 'urgente').length
      };
      setStats(stats);

      // Insights simulados
      setInsights({
        recommendation: "¡Sigue así! Estás progresando bien con tus tareas.",
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        averageTaskTime: 30
      });
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    setLoading(false);
  }
};
