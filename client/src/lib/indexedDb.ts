import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { 
  Project, Task, InsertProject, InsertTask, Settings, Backup, 
  ProjectPhase, TaskStatus, TaskPriority, TaskCategory,
  Subtask, Block, Comment, TimeLog, ActivityLog, User,
  NotificationType
} from '@shared/schema';

interface GameDevTasksDB extends DBSchema {
  projects: {
    key: number;
    value: Project;
    indexes: { 'by-name': string };
  };
  tasks: {
    key: number;
    value: Task;
    indexes: { 'by-project': number; 'by-status': TaskStatus; 'by-category': TaskCategory; 'by-deadline': Date };
  };
  subtasks: {
    key: number;
    value: Subtask;
    indexes: { 'by-task': number };
  };
  blocks: {
    key: string;
    value: Block;
    indexes: { 'by-project': number };
  };
  comments: {
    key: number;
    value: Comment;
    indexes: { 'by-task': number };
  };
  timeLogs: {
    key: number;
    value: TimeLog;
    indexes: { 'by-task': number };
  };
  activityLog: {
    key: number;
    value: ActivityLog;
    indexes: { 'by-task': number; 'by-project': number; 'by-date': Date };
  };
  settings: {
    key: number;
    value: Settings;
  };
  syncLog: {
    key: number;
    value: {
      id: number;
      entityType: 'project' | 'task' | 'subtask' | 'block' | 'comment' | 'timeLog';
      entityId: number | string;
      action: 'create' | 'update' | 'delete';
      timestamp: Date;
      synced: boolean;
      data: any;
    };
  };
  users: {
    key: string;
    value: User;
  };
}

let db: IDBPDatabase<GameDevTasksDB>;

export async function initDB() {
  if (db) return db;
  
  db = await openDB<GameDevTasksDB>('game-dev-tasks-db', 1, {
    upgrade(database, oldVersion, newVersion, transaction) {
      // Create stores on first use
      if (oldVersion < 1) {
        const projectsStore = database.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
        projectsStore.createIndex('by-name', 'name');

        const tasksStore = database.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        tasksStore.createIndex('by-project', 'projectId');
        tasksStore.createIndex('by-status', 'status');
        tasksStore.createIndex('by-category', 'category');
        tasksStore.createIndex('by-deadline', 'deadline');

        const subtasksStore = database.createObjectStore('subtasks', { keyPath: 'id', autoIncrement: true });
        subtasksStore.createIndex('by-task', 'taskId');

        const blocksStore = database.createObjectStore('blocks', { keyPath: 'id' });
        blocksStore.createIndex('by-project', 'projectId');

        const commentsStore = database.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
        commentsStore.createIndex('by-task', 'taskId');

        const timeLogsStore = database.createObjectStore('timeLogs', { keyPath: 'id', autoIncrement: true });
        timeLogsStore.createIndex('by-task', 'taskId');

        const activityLogStore = database.createObjectStore('activityLog', { keyPath: 'id', autoIncrement: true });
        activityLogStore.createIndex('by-task', 'taskId');
        activityLogStore.createIndex('by-project', 'projectId');
        activityLogStore.createIndex('by-date', 'timestamp');

        database.createObjectStore('settings', { keyPath: 'id' });
        database.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
        database.createObjectStore('users', { keyPath: 'id' });
      }
    }
  });

  return db;
}

// PROJECTS API
export async function getAllProjects(): Promise<Project[]> {
  const db = await initDB();
  return db.getAll('projects');
}

export async function getProject(id: number): Promise<Project | undefined> {
  const db = await initDB();
  return db.get('projects', id);
}

export async function createProject(project: InsertProject): Promise<Project> {
  const db = await initDB();
  // Ensure phase is of the correct type
  const typedProject: InsertProject = {
    ...project,
    phase: project.phase as ProjectPhase
  };
  
  const id = await db.add('projects', typedProject as any) as number;
  const newProject = { ...typedProject, id };
  await addActivityLog({
    projectId: id,
    action: 'create',
    details: `Created project: ${project.name}`,
  });
  await addSyncLogEntry('project', id, 'create', newProject);
  return newProject as Project;
}

export async function updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
  const db = await initDB();
  const existingProject = await db.get('projects', id);
  if (!existingProject) return undefined;
  
  // Ensure phase is of the correct type if it exists in the update
  const typedProject: Partial<InsertProject> = {
    ...project
  };
  
  if (typedProject.phase) {
    typedProject.phase = typedProject.phase as ProjectPhase;
  }
  
  // Handle gameEngine if present without requiring specific type
  
  const updatedProject = { ...existingProject, ...typedProject };
  await db.put('projects', updatedProject);
  await addActivityLog({
    projectId: id,
    action: 'update',
    details: `Updated project: ${existingProject.name}`,
  });
  await addSyncLogEntry('project', id, 'update', updatedProject);
  return updatedProject;
}

export async function deleteProject(id: number): Promise<boolean> {
  const db = await initDB();
  const project = await db.get('projects', id);
  if (!project) return false;
  
  // Delete associated tasks
  const tasksToDelete = await db.getAllFromIndex('tasks', 'by-project', id);
  const tx = db.transaction(['projects', 'tasks', 'activityLog', 'syncLog'], 'readwrite');
  
  // Delete project
  await tx.objectStore('projects').delete(id);
  
  // Delete all associated tasks
  for (const task of tasksToDelete) {
    await tx.objectStore('tasks').delete(task.id);
    await addSyncLogEntry('task', task.id, 'delete', null);
  }
  
  await addActivityLog({
    action: 'delete',
    details: `Deleted project: ${project.name}`,
  });
  await addSyncLogEntry('project', id, 'delete', null);
  
  await tx.done;
  return true;
}

// TASKS API
export async function getAllTasks(): Promise<Task[]> {
  const db = await initDB();
  return db.getAll('tasks');
}

export async function getTask(id: number): Promise<Task | undefined> {
  const db = await initDB();
  return db.get('tasks', id);
}

export async function getTasksByProject(projectId: number): Promise<Task[]> {
  const db = await initDB();
  return db.getAllFromIndex('tasks', 'by-project', projectId);
}

export async function createTask(task: InsertTask): Promise<Task> {
  const db = await initDB();
  
  // Ensure proper type casting for enum values
  const typedTask: InsertTask = {
    ...task,
    status: task.status as TaskStatus || 'not-started',
    priority: task.priority as TaskPriority || 'medium',
    category: task.category as TaskCategory || 'other'
  };
  
  // Add task with metadata
  const taskWithMetadata = {
    ...typedTask,
    createdAt: new Date(),
    completedAt: null,
  };
  
  const id = await db.add('tasks', taskWithMetadata) as number;
  
  // Build the complete task object
  const newTask: Task = {
    ...taskWithMetadata,
    id
  };
  
  await addActivityLog({
    taskId: id,
    projectId: task.projectId,
    action: 'create',
    details: `Created task: ${task.title}`,
  });
  
  await addSyncLogEntry('task', id, 'create', newTask);
  return newTask;
}

export async function updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
  const db = await initDB();
  const existingTask = await db.get('tasks', id);
  if (!existingTask) return undefined;
  
  // Ensure proper type casting for enum values
  const typedTaskUpdate: Partial<InsertTask> = {
    ...task
  };
  
  if (typedTaskUpdate.status) {
    typedTaskUpdate.status = typedTaskUpdate.status as TaskStatus;
  }
  
  if (typedTaskUpdate.priority) {
    typedTaskUpdate.priority = typedTaskUpdate.priority as TaskPriority;
  }
  
  if (typedTaskUpdate.category) {
    typedTaskUpdate.category = typedTaskUpdate.category as TaskCategory;
  }
  
  const updatedTask: Task = { 
    ...existingTask, 
    ...typedTaskUpdate 
  };
  
  await db.put('tasks', updatedTask);
  
  await addActivityLog({
    taskId: id,
    projectId: updatedTask.projectId,
    action: 'update',
    details: `Updated task: ${existingTask.title}`,
  });
  
  await addSyncLogEntry('task', id, 'update', updatedTask);
  return updatedTask;
}

export async function completeTask(id: number): Promise<Task | undefined> {
  const db = await initDB();
  const task = await db.get('tasks', id);
  if (!task) return undefined;
  
  const updatedTask: Task = { 
    ...task, 
    status: 'completed' as TaskStatus,
    completedAt: new Date()
  };
  
  await db.put('tasks', updatedTask);
  
  await addActivityLog({
    taskId: id,
    projectId: task.projectId,
    action: 'complete',
    details: `Completed task: ${task.title}`,
  });
  
  await addSyncLogEntry('task', id, 'update', updatedTask);
  return updatedTask;
}

export async function deleteTask(id: number): Promise<boolean> {
  const db = await initDB();
  const task = await db.get('tasks', id);
  if (!task) return false;
  
  await db.delete('tasks', id);
  
  await addActivityLog({
    projectId: task.projectId,
    action: 'delete',
    details: `Deleted task: ${task.title}`,
  });
  
  await addSyncLogEntry('task', id, 'delete', null);
  return true;
}

// SUBTASKS API
export async function getSubtasksByTask(taskId: number): Promise<any[]> {
  const db = await initDB();
  const subtasks = await db.getAllFromIndex('subtasks', 'by-task', taskId);
  // Sort by order field
  return subtasks.sort((a, b) => a.order - b.order);
}

export async function updateSubtask(subtaskId: number, updates: Partial<{ title: string, isCompleted: boolean, order: number }>): Promise<any> {
  const db = await initDB();
  
  // Get current subtask
  const subtask = await db.get('subtasks', subtaskId);
  if (!subtask) {
    throw new Error("Subtask not found");
  }
  
  // Update the subtask
  const updatedSubtask = { ...subtask, ...updates };
  await db.put('subtasks', updatedSubtask);
  
  // Add to sync log
  await addSyncLogEntry('subtask', subtaskId, 'update', updatedSubtask);
  
  // Add activity log
  const task = await db.get('tasks', subtask.taskId);
  if (task) {
    let action = 'update';
    let details = `Updated subtask "${subtask.title}"`;
    
    if ('isCompleted' in updates) {
      action = updates.isCompleted ? 'complete' : 'reopen';
      details = updates.isCompleted 
        ? `Completed subtask "${subtask.title}"`
        : `Reopened subtask "${subtask.title}"`;
    }
    
    await addActivityLog({
      taskId: subtask.taskId,
      projectId: task.projectId,
      action,
      details,
    });
  }
  
  return updatedSubtask;
}

export async function deleteSubtask(subtaskId: number): Promise<boolean> {
  const db = await initDB();
  
  // Get subtask before deleting
  const subtask = await db.get('subtasks', subtaskId);
  if (!subtask) {
    return false;
  }
  
  // Delete subtask
  await db.delete('subtasks', subtaskId);
  
  // Add to sync log
  await addSyncLogEntry('subtask', subtaskId, 'delete', subtask);
  
  // Add activity log
  const task = await db.get('tasks', subtask.taskId);
  if (task) {
    await addActivityLog({
      taskId: subtask.taskId,
      projectId: task.projectId,
      action: 'delete',
      details: `Deleted subtask "${subtask.title}"`,
    });
  }
  
  return true;
}

export async function updateSubtasksOrder(subtasks: { id: number, order: number }[]): Promise<boolean> {
  const db = await initDB();
  const tx = db.transaction('subtasks', 'readwrite');
  
  for (const subtask of subtasks) {
    const currentSubtask = await tx.store.get(subtask.id);
    if (currentSubtask) {
      await tx.store.put({ ...currentSubtask, order: subtask.order });
      await addSyncLogEntry('subtask', subtask.id, 'update', { ...currentSubtask, order: subtask.order });
    }
  }
  
  await tx.done;
  
  await addActivityLog({
    action: 'reorder',
    details: `Reordered ${subtasks.length} subtasks`,
  });
  
  return true;
}

export async function createSubtask(subtask: { taskId: number, title: string, order: number }): Promise<any> {
  const db = await initDB();
  // Generate an ID for this subtask
  const nextId = await db.count('subtasks') + 1;
  
  const newSubtask = { 
    id: nextId,
    ...subtask,
    isCompleted: false,
  };
  
  // Add to database
  await db.add('subtasks', newSubtask);
  
  const task = await db.get('tasks', subtask.taskId);
  if (task) {
    await addActivityLog({
      taskId: subtask.taskId,
      projectId: task.projectId,
      action: 'create',
      details: `Added subtask to "${task.title}": ${subtask.title}`,
    });
  }
  
  await addSyncLogEntry('subtask', nextId, 'create', newSubtask);
  return newSubtask;
}

// COMMENTS API
export async function getCommentsByTask(taskId: number): Promise<any[]> {
  const db = await initDB();
  return db.getAllFromIndex('comments', 'by-task', taskId);
}

export async function addComment(comment: { taskId: number, content: string, createdBy: string }): Promise<any> {
  const db = await initDB();
  const newComment = {
    ...comment,
    createdAt: new Date(),
  };
  
  const id = await db.add('comments', newComment) as number;
  const result = { ...newComment, id };
  
  const task = await db.get('tasks', comment.taskId);
  if (task) {
    await addActivityLog({
      taskId: comment.taskId,
      projectId: task.projectId,
      action: 'comment',
      details: `Added comment to "${task.title}"`,
      userId: comment.createdBy,
    });
  }
  
  await addSyncLogEntry('comment', id, 'create', result);
  return result;
}

// TIME TRACKING API
export async function startTimeTracking(taskId: number, description: string = ''): Promise<any> {
  const db = await initDB();
  const startTime = new Date();
  
  const newTimeLog = {
    taskId,
    startTime,
    endTime: null,
    duration: 0,
    description,
  };
  
  const id = await db.add('timeLogs', newTimeLog) as number;
  const result = { ...newTimeLog, id };
  
  const task = await db.get('tasks', taskId);
  if (task) {
    await addActivityLog({
      taskId,
      projectId: task.projectId,
      action: 'time-start',
      details: `Started time tracking for "${task.title}"`,
    });
  }
  
  return result;
}

export async function stopTimeTracking(timeLogId: number): Promise<any> {
  const db = await initDB();
  const timeLog = await db.get('timeLogs', timeLogId);
  if (!timeLog) return null;
  
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - timeLog.startTime.getTime()) / 1000); // duration in seconds
  
  const updatedTimeLog = {
    ...timeLog,
    endTime,
    duration,
  };
  
  await db.put('timeLogs', updatedTimeLog);
  
  const task = await db.get('tasks', timeLog.taskId);
  if (task) {
    await addActivityLog({
      taskId: timeLog.taskId,
      projectId: task.projectId,
      action: 'time-stop',
      details: `Stopped time tracking for "${task.title}" (${formatDuration(duration)})`,
    });
  }
  
  await addSyncLogEntry('timeLog', timeLogId, 'update', updatedTimeLog);
  return updatedTimeLog;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}h ${minutes}m ${secs}s`;
}

// ACTIVITY LOG API
export async function getActivityLog(options: { 
  projectId?: number, 
  taskId?: number, 
  limit?: number 
} = {}): Promise<any[]> {
  const db = await initDB();
  let logs: any[] = [];
  
  if (options.projectId) {
    logs = await db.getAllFromIndex('activityLog', 'by-project', options.projectId);
  } else if (options.taskId) {
    logs = await db.getAllFromIndex('activityLog', 'by-task', options.taskId);
  } else {
    logs = await db.getAll('activityLog');
  }
  
  // Sort by timestamp, newest first
  logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Apply limit if specified
  if (options.limit && logs.length > options.limit) {
    logs = logs.slice(0, options.limit);
  }
  
  return logs;
}

export async function addActivityLog(log: {
  taskId?: number | null,
  projectId?: number | null,
  action: string,
  details: string,
  userId?: string,
}): Promise<any> {
  const db = await initDB();
  const newLog = {
    ...log,
    taskId: log.taskId || null,
    projectId: log.projectId || null,
    timestamp: new Date(),
    userId: log.userId || 'current-user', // In a real app, this would come from authentication
  };
  
  const id = await db.add('activityLog', newLog) as number;
  return { ...newLog, id };
}

// OFFLINE SYNC API
export async function addSyncLogEntry(
  entityType: 'project' | 'task' | 'subtask' | 'block' | 'comment' | 'timeLog',
  entityId: number | string,
  action: 'create' | 'update' | 'delete',
  data: any
): Promise<void> {
  const db = await initDB();
  await db.add('syncLog', {
    entityType,
    entityId,
    action,
    timestamp: new Date(),
    synced: false,
    data,
  });
}

export async function getUnSyncedChanges(): Promise<any[]> {
  const db = await initDB();
  const allChanges = await db.getAll('syncLog');
  return allChanges.filter(change => !change.synced);
}

export async function markAsSynced(id: number): Promise<void> {
  const db = await initDB();
  const syncEntry = await db.get('syncLog', id);
  if (syncEntry) {
    syncEntry.synced = true;
    await db.put('syncLog', syncEntry);
  }
}

// SETTINGS API
export async function getSettings(): Promise<Settings | undefined> {
  const db = await initDB();
  return db.get('settings', 1);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const db = await initDB();
  await db.put('settings', { ...settings, id: 1 });
  return { ...settings, id: 1 };
}

// BACKUP & RESTORE API
export async function getBackupData(): Promise<Backup> {
  const db = await initDB();
  const [projects, tasks, subtasks, blocks, comments, timeLogs, settings] = await Promise.all([
    db.getAll('projects'),
    db.getAll('tasks'),
    db.getAll('subtasks'),
    db.getAll('blocks'),
    db.getAll('comments'),
    db.getAll('timeLogs'),
    db.get('settings', 1),
  ]);
  
  return {
    projects,
    tasks,
    subtasks,
    blocks,
    comments,
    timeLogs,
    settings,
    date: new Date().toISOString(),
  };
}

export async function restoreFromBackup(backup: Backup): Promise<boolean> {
  const db = await initDB();
  const tx = db.transaction(
    ['projects', 'tasks', 'subtasks', 'blocks', 'comments', 'timeLogs', 'settings'],
    'readwrite'
  );
  
  // Clear existing data
  await Promise.all([
    tx.objectStore('projects').clear(),
    tx.objectStore('tasks').clear(),
    tx.objectStore('subtasks').clear(),
    tx.objectStore('blocks').clear(),
    tx.objectStore('comments').clear(),
    tx.objectStore('timeLogs').clear(),
  ]);
  
  // Restore data
  for (const project of backup.projects) {
    await tx.objectStore('projects').add(project);
  }
  
  for (const task of backup.tasks) {
    await tx.objectStore('tasks').add(task);
  }
  
  if (backup.subtasks) {
    for (const subtask of backup.subtasks) {
      await tx.objectStore('subtasks').add(subtask);
    }
  }
  
  if (backup.blocks) {
    for (const block of backup.blocks) {
      await tx.objectStore('blocks').add(block);
    }
  }
  
  if (backup.comments) {
    for (const comment of backup.comments) {
      await tx.objectStore('comments').add(comment);
    }
  }
  
  if (backup.timeLogs) {
    for (const timeLog of backup.timeLogs) {
      await tx.objectStore('timeLogs').add(timeLog);
    }
  }
  
  if (backup.settings) {
    await tx.objectStore('settings').put({ ...backup.settings, id: 1 });
  }
  
  await tx.done;
  return true;
}

// STATISTICS API
export async function getStatistics(): Promise<any> {
  const db = await initDB();
  const [projects, tasks, subtasks, timeLogs] = await Promise.all([
    db.getAll('projects'),
    db.getAll('tasks'),
    db.getAll('subtasks'),
    db.getAll('timeLogs'),
  ]);
  
  // Count projects
  const totalProjects = projects.length;
  
  // Count tasks by status
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const notStartedTasks = tasks.filter(t => t.status === 'not-started').length;
  
  // Group tasks by category
  const tasksByCategory: Record<string, number> = {};
  for (const task of tasks) {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = 0;
    }
    tasksByCategory[task.category]++;
  }
  
  // Calculate completion rate by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const tasksByDay: Record<string, number> = {};
  const completedTasksFiltered = tasks.filter(t => 
    t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo
  );
  
  for (const task of completedTasksFiltered) {
    const dateStr = new Date(task.completedAt as Date).toISOString().split('T')[0];
    if (!tasksByDay[dateStr]) {
      tasksByDay[dateStr] = 0;
    }
    tasksByDay[dateStr]++;
  }
  
  // Calculate total tracked time
  const totalTrackedSeconds = timeLogs
    .filter(log => log.duration > 0)
    .reduce((total, log) => total + log.duration, 0);
  
  // Calculate average completion time (from creation to completion)
  const completionTimes = tasks
    .filter(t => t.status === 'completed' && t.completedAt)
    .map(t => new Date(t.completedAt as Date).getTime() - new Date(t.createdAt).getTime());
  
  const avgCompletionTime = completionTimes.length
    ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length / (1000 * 60 * 60)) // in hours
    : 0;
  
  return {
    totalProjects,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    tasksByCategory,
    tasksByDay,
    totalTrackedSeconds,
    avgCompletionTimeHours: avgCompletionTime,
    subtaskStats: {
      total: subtasks.length,
      completed: subtasks.filter(s => s.isCompleted).length
    }
  };
}

// USERS API for task assignment
export async function getAllUsers(): Promise<any[]> {
  const db = await initDB();
  return db.getAll('users');
}

export async function getUser(id: string): Promise<any> {
  const db = await initDB();
  return db.get('users', id);
}

export async function addUser(user: { id: string, name: string, email: string, avatar: string }): Promise<any> {
  const db = await initDB();
  await db.put('users', user);
  return user;
}

// Initialize with demo user if needed
export async function initDemoUser(): Promise<void> {
  const db = await initDB();
  const user = await db.get('users', 'current-user');
  if (!user) {
    await db.put('users', {
      id: 'current-user',
      name: 'Current User',
      email: 'user@example.com',
      avatar: '',
    });
  }
}