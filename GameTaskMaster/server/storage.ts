import { 
  projects as schemaProjects, 
  tasks as schemaTasks, 
  settings,
  type Project, 
  type InsertProject, 
  type Task, 
  type InsertTask, 
  type Settings, 
  type InsertSettings,
  type Backup
} from "@shared/schema";

// Define the storage interface with CRUD operations
export interface IStorage {
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  completeTask(id: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  
  // Backup/Restore operations
  getBackupData(): Promise<Backup>;
  restoreFromBackup(backup: Backup): Promise<boolean>;
  
  // Statistics
  getStatistics(): Promise<{
    totalProjects: number;
    completedTasks: number;
    inProgressTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByDay: Record<string, number>;
  }>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private projectsData: Project[] = [];
  private tasksData: Task[] = [];
  private settingsData: Settings | undefined;
  private projectCurrentId: number = 1;
  private taskCurrentId: number = 1;

  constructor() {
    this.settingsData = {
      id: 1,
      theme: "light",
      language: "en",
      primaryColor: "#6200EA"
    };
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return this.projectsData;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projectsData.find(p => p.id === id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject = { ...project, id: this.projectCurrentId++ };
    this.projectsData.push(newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const index = this.projectsData.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    this.projectsData[index] = { ...this.projectsData[index], ...project };
    return this.projectsData[index];
  }

  async deleteProject(id: number): Promise<boolean> {
    const index = this.projectsData.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.projectsData.splice(index, 1);
    // Delete associated tasks
    this.tasksData = this.tasksData.filter(t => t.projectId !== id);
    return true;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return this.tasksData;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasksData.find(t => t.id === id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return this.tasksData.filter(task => task.projectId === projectId);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask = { ...task, id: this.taskCurrentId++ };
    this.tasksData.push(newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const index = this.tasksData.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    this.tasksData[index] = { ...this.tasksData[index], ...task };
    return this.tasksData[index];
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;
    const updatedTask = {...task, status: "completed", completedAt: new Date()};
    await this.updateTask(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const index = this.tasksData.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.tasksData.splice(index, 1);
    return true;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settingsData;
  }

  async saveSettings(newSettings: InsertSettings): Promise<Settings> {
    this.settingsData = { ...this.settingsData, ...newSettings };
    return this.settingsData;
  }

  // Backup/Restore operations (Retained from original code)
  async getBackupData(): Promise<Backup> {
    const projectsArray = Array.from(this.projectsData.values()).map(project => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      deadline: project.deadline ? project.deadline.toISOString() : null,
    }));
    
    const tasksArray = Array.from(this.tasksData.values()).map(task => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      deadline: task.deadline ? task.deadline.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    }));
    
    return {
      projects: projectsArray,
      tasks: tasksArray,
      settings: this.settingsData ? {
        theme: this.settingsData.theme,
        language: this.settingsData.language,
        primaryColor: this.settingsData.primaryColor,
      } : null,
    };
  }

  async restoreFromBackup(backup: Backup): Promise<boolean> {
    try {
      // Clear existing data
      this.projectsData = [];
      this.tasksData = [];
      
      // Restore projects
      backup.projects.forEach(project => {
        this.projectsData.push({
          ...project,
          createdAt: new Date(project.createdAt),
          deadline: project.deadline ? new Date(project.deadline) : null,
        });
      });
      
      // Restore tasks
      backup.tasks.forEach(task => {
        this.tasksData.push({
          ...task,
          createdAt: new Date(task.createdAt),
          deadline: task.deadline ? new Date(task.deadline) : null,
          completedAt: task.completedAt ? new Date(task.completedAt) : null,
        });
      });
      
      // Restore settings
      if (backup.settings) {
        this.settingsData = {
          id: 1,
          ...backup.settings,
        };
      }
      
      // Update IDs for new entries
      this.projectCurrentId = Math.max(...this.projectsData.map(p => p.id), 0) + 1;
      this.taskCurrentId = Math.max(...this.tasksData.map(t => t.id), 0) + 1;
      
      return true;
    } catch (error) {
      console.error("Error restoring from backup:", error);
      return false;
    }
  }

  // Statistics (Retained from original code)
  async getStatistics(): Promise<{
    totalProjects: number;
    completedTasks: number;
    inProgressTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByDay: Record<string, number>;
  }> {
    const tasks = Array.from(this.tasksData);
    
    // Task counts by status
    const completedTasks = tasks.filter(task => task.status === "completed").length;
    const inProgressTasks = tasks.filter(task => task.status === "in-progress").length;
    
    // Tasks by category
    const tasksByCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Tasks completed per day (last 7 days)
    const tasksByDay: Record<string, number> = {};
    const today = new Date();
    
    // Initialize last 7 days with 0 tasks
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      tasksByDay[dateStr] = 0;
    }
    
    // Count completed tasks by day
    tasks.forEach(task => {
      if (task.completedAt) {
        const dateStr = task.completedAt.toISOString().split('T')[0];
        // Only count if within last 7 days
        if (tasksByDay[dateStr] !== undefined) {
          tasksByDay[dateStr] += 1;
        }
      }
    });
    
    return {
      totalProjects: this.projectsData.length,
      completedTasks,
      inProgressTasks,
      tasksByCategory,
      tasksByDay,
    };
  }
}

export const storage = new MemStorage();