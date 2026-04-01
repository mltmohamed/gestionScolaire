const { contextBridge, ipcRenderer } = require('electron');

// API sécurisée exposée au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  getSession: () => ipcRenderer.invoke('auth:getSession'),
  login: (username, password) => ipcRenderer.invoke('auth:login', { username, password }),
  logout: () => ipcRenderer.invoke('auth:logout'),
  changePassword: (currentPassword, newPassword) =>
    ipcRenderer.invoke('auth:changePassword', { currentPassword, newPassword }),

  // Settings
  getProfile: () => ipcRenderer.invoke('settings:getProfile'),
  setProfile: (profile) => ipcRenderer.invoke('settings:setProfile', profile),

  // Data
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),

  // Students
  getStudents: () => ipcRenderer.invoke('students:getAll'),
  getStudentById: (id) => ipcRenderer.invoke('students:getById', id),
  createStudent: (data) => ipcRenderer.invoke('students:create', data),
  updateStudent: (id, data) => ipcRenderer.invoke('students:update', id, data),
  deleteStudent: (id) => ipcRenderer.invoke('students:delete', id),
  
  // Teachers
  getTeachers: () => ipcRenderer.invoke('teachers:getAll'),
  getTeacherById: (id) => ipcRenderer.invoke('teachers:getById', id),
  createTeacher: (data) => ipcRenderer.invoke('teachers:create', data),
  updateTeacher: (id, data) => ipcRenderer.invoke('teachers:update', id, data),
  deleteTeacher: (id) => ipcRenderer.invoke('teachers:delete', id),
  
  // Classes
  getClasses: () => ipcRenderer.invoke('classes:getAll'),
  getClassById: (id) => ipcRenderer.invoke('classes:getById', id),
  createClass: (data) => ipcRenderer.invoke('classes:create', data),
  updateClass: (id, data) => ipcRenderer.invoke('classes:update', id, data),
  deleteClass: (id) => ipcRenderer.invoke('classes:delete', id),
  
  // Dashboard Stats
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  
  // Subjects
  getSubjects: () => ipcRenderer.invoke('subjects:getAll'),
  createSubject: (data) => ipcRenderer.invoke('subjects:create', data),
  
  // Grades
  getGrades: () => ipcRenderer.invoke('grades:getAll'),
  getGradesByStudent: (studentId) => ipcRenderer.invoke('grades:getByStudent', studentId),
  createGrade: (data) => ipcRenderer.invoke('grades:create', data),
  
  // Payments
  getStudentPayments: () => ipcRenderer.invoke('payments:getStudentPayments'),
  createStudentPayment: (data) => ipcRenderer.invoke('payments:createStudentPayment', data),
  getTeacherPayments: () => ipcRenderer.invoke('payments:getTeacherPayments'),
  createTeacherPayment: (data) => ipcRenderer.invoke('payments:createTeacherPayment', data),
});
