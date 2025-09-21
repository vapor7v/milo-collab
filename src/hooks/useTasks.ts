import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { taskGeneratorService, GeneratedTask } from '@/lib/taskGenerator';

export interface TaskProgress {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Timestamp;
  date: string; // YYYY-MM-DD format
}

export interface DailyTasks {
  date: string;
  tasks: TaskProgress[];
  userId: string;
  lastUpdated: Timestamp;
}

export const useTasks = () => {
  const { user } = useAuth();
  const { awardTaskCompletion } = useGamification();
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAchievement, setLastAchievement] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const loadTodaysTasks = async () => {
    if (!user || !user.uid) return;

    try {
      setLoading(true);
      setError(null);
      const taskRef = doc(db, 'task_progress', user.uid, 'daily', today);
      const taskSnap = await getDoc(taskRef);

      if (taskSnap.exists()) {
        const data = taskSnap.data() as DailyTasks;
        // Validate loaded task data
        const validTasks = (data.tasks || []).filter(task =>
          task &&
          typeof task.id === 'string' &&
          typeof task.title === 'string' &&
          typeof task.completed === 'boolean' &&
          typeof task.date === 'string' &&
          (task.completedAt === undefined || task.completedAt instanceof Timestamp)
        );
        setTasks(validTasks);
      } else {
        // Generate AI-powered tasks if no tasks exist for today
        await generateAITasksForToday();
      }
    } catch (err: unknown) {
      console.error('Error loading tasks:', err);
      // Don't set error for permission issues - just log and continue with empty tasks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any).code !== 'permission-denied') {
        setError('Failed to load tasks');
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAITasksForToday = async () => {
    if (!user || !user.uid) return;

    try {
      console.log('Generating AI-powered tasks for today...');
      const generatedTasks = await taskGeneratorService.generateTasksForUser(user.uid);

      const aiTasks: TaskProgress[] = generatedTasks.map((task: GeneratedTask) => ({
        id: task.id,
        title: task.title,
        completed: false,
        date: today
      }));

      await saveTodaysTasks(aiTasks);
      console.log('AI tasks generated and saved:', aiTasks.length);
    } catch (error) {
      console.error('Error generating AI tasks:', error);
      // Fallback to empty tasks if AI generation fails
      setTasks([]);
    }
  };

  // Load today's tasks
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setError(null);
      return;
    }

    loadTodaysTasks();
  }, [user]);

  const saveTodaysTasks = async (updatedTasks: TaskProgress[]) => {
    if (!user || !user.uid) return;

    try {
      // Validate task data before saving
      const validTasks = updatedTasks.filter(task =>
        task &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.completed === 'boolean' &&
        typeof task.date === 'string' &&
        (task.completedAt === undefined || task.completedAt instanceof Timestamp)
      );

      const taskRef = doc(db, 'task_progress', user.uid, 'daily', today);
      const dailyTasks: DailyTasks = {
        date: today,
        tasks: validTasks,
        userId: user.uid,
        lastUpdated: Timestamp.now()
      };

      await setDoc(taskRef, dailyTasks);
      setTasks(validTasks);
      setError(null); // Clear any previous errors
    } catch (err: unknown) {
      console.error('Error saving tasks:', err);
      // Don't set error for permission issues - just log
      if ((err as { code?: string })?.code !== 'permission-denied') {
        setError('Failed to save tasks');
      }
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!taskId || typeof taskId !== 'string') {
      console.error('Invalid taskId provided to toggleTaskCompletion:', taskId);
      return;
    }

    const taskToToggle = tasks.find(task => task.id === taskId);
    const wasCompleted = taskToToggle?.completed || false;

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed;
        const updatedTask = {
          ...task,
          completed,
        };

        // Only include completedAt if the task is completed
        if (completed) {
          updatedTask.completedAt = Timestamp.now();
        } else {
          // Remove completedAt when uncompleting the task
          delete (updatedTask as any).completedAt;
        }

        return updatedTask;
      }
      return task;
    });

    await saveTodaysTasks(updatedTasks);

    // Award rewards only when completing a task (not uncompleting)
    if (!wasCompleted && taskToToggle) {
      const rewardData = await awardTaskCompletion();
      if (rewardData?.newAchievements && rewardData.newAchievements.length > 0) {
        setLastAchievement(rewardData.newAchievements[0]);
      }
    }
  };

  const updateTasksFromWellnessPlan = async (wellnessTasks: string[]) => {
    if (!user || !user.uid || wellnessTasks.length === 0) return;

    const wellnessTaskProgress: TaskProgress[] = wellnessTasks.map((task, index) => ({
      id: `wellness_${index}`,
      title: task,
      completed: false,
      date: today
    }));

    await saveTodaysTasks(wellnessTaskProgress);
  };

  const getCompletedCount = () => {
    return tasks.filter(task => task.completed).length;
  };

  const getTotalCount = () => {
    return tasks.length;
  };

  const getCompletionPercentage = () => {
    const total = getTotalCount();
    if (total === 0) return 0;
    return Math.round((getCompletedCount() / total) * 100);
  };

  const regenerateAITasks = async () => {
    if (!user || !user.uid) return;
    await generateAITasksForToday();
  };

  return {
    tasks,
    loading,
    error,
    toggleTaskCompletion,
    updateTasksFromWellnessPlan,
    regenerateAITasks,
    getCompletedCount,
    getTotalCount,
    getCompletionPercentage,
    refreshTasks: loadTodaysTasks,
    lastAchievement,
    clearAchievement: () => setLastAchievement(null)
  };
};