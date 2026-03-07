// Service API pour la communication avec le main process via IPC

export const studentAPI = {
  getAll: async () => {
    const result = await window.electronAPI.getStudents();
    return result.success ? result.data : [];
  },
  
  getById: async (id) => {
    const result = await window.electronAPI.getStudentById(id);
    return result.success ? result.data : null;
  },
  
  create: async (data) => {
    const result = await window.electronAPI.createStudent(data);
    return result;
  },
  
  update: async (id, data) => {
    const result = await window.electronAPI.updateStudent(id, data);
    return result;
  },
  
  delete: async (id) => {
    const result = await window.electronAPI.deleteStudent(id);
    return result;
  },
};

export const teacherAPI = {
  getAll: async () => {
    const result = await window.electronAPI.getTeachers();
    return result.success ? result.data : [];
  },
  
  create: async (data) => {
    const result = await window.electronAPI.createTeacher(data);
    return result;
  },
  
  update: async (id, data) => {
    const result = await window.electronAPI.updateTeacher(id, data);
    return result;
  },
  
  delete: async (id) => {
    const result = await window.electronAPI.deleteTeacher(id);
    return result;
  },
};

export const classAPI = {
  getAll: async () => {
    if (!window.electronAPI) {
      console.error('electronAPI non disponible - êtes-vous dans Electron ?');
      return [];
    }
    const result = await window.electronAPI.getClasses();
    return result.success ? result.data : [];
  },
  
  create: async (data) => {
    if (!window.electronAPI) {
      console.error('electronAPI non disponible - êtes-vous dans Electron ?');
      return { success: false, error: 'API non disponible' };
    }
    try {
      const result = await window.electronAPI.createClass(data);
      return result;
    } catch (error) {
      console.error('Erreur création classe:', error);
      return { success: false, error: error.message };
    }
  },
  
  update: async (id, data) => {
    if (!window.electronAPI) {
      return { success: false, error: 'API non disponible' };
    }
    const result = await window.electronAPI.updateClass(id, data);
    return result;
  },
  
  delete: async (id) => {
    if (!window.electronAPI) {
      return { success: false, error: 'API non disponible' };
    }
    const result = await window.electronAPI.deleteClass(id);
    return result;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const result = await window.electronAPI.getDashboardStats();
    return result.success ? result.data : null;
  },
};
