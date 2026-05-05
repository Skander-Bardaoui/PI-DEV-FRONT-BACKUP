import { useState, useEffect } from 'react';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { checkinsApi } from '../api/checkins.api';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
}

interface DailyCheckinBannerProps {
  businessId: string;
  userFirstName?: string;
  assignedTasks: Task[];
  onCheckinComplete: () => void;
}

const priorityColors = {
  URGENT: 'bg-red-100 text-red-700 border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  LOW: 'bg-green-100 text-green-700 border-green-300',
};

const priorityLabels = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export default function DailyCheckinBanner({
  businessId,
  userFirstName,
  assignedTasks,
  onCheckinComplete,
}: DailyCheckinBannerProps) {
  const [visible, setVisible] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // Filter only TODO and IN_PROGRESS tasks
  const activeTasks = assignedTasks.filter(
    (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS'
  );

  useEffect(() => {
    checkIfAlreadyCheckedIn();
  }, []);

  const checkIfAlreadyCheckedIn = async () => {
    try {
      const { hasCheckedIn } = await checkinsApi.hasCheckedInToday();
      setVisible(!hasCheckedIn);
    } catch (error) {
      console.error('Failed to check check-in status:', error);
      setVisible(true); // Show banner on error
    } finally {
      setChecking(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await checkinsApi.create({
        businessId,
        taskIds: selectedTaskIds,
        note: note.trim() || undefined,
        skipped: false,
      });
      toast.success('Check-in submitted successfully! 🎉');
      setVisible(false);
      onCheckinComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await checkinsApi.create({
        businessId,
        taskIds: [],
        skipped: true,
      });
      toast.info('Check-in skipped for today');
      setVisible(false);
      onCheckinComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to skip check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return null; // Don't show anything while checking
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            Good morning{userFirstName ? `, ${userFirstName}` : ''}! 👋
          </h2>
          <p className="text-violet-100">
            Let's start the day by checking in on your tasks
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {activeTasks.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium text-violet-100 mb-3">
              Select the tasks you'll work on today:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    selectedTaskIds.includes(task.id)
                      ? 'bg-white text-violet-700 border-white shadow-md scale-105'
                      : 'bg-violet-600/50 text-white border-violet-400/50 hover:bg-violet-600/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedTaskIds.includes(task.id) && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span className="font-medium">{task.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        selectedTaskIds.includes(task.id)
                          ? priorityColors[task.priority]
                          : 'bg-violet-500/50 text-white'
                      }`}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-violet-100 mb-2">
              Add a note (optional):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any updates, blockers, or comments..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              rows={3}
            />
          </div>
        </>
      ) : (
        <div className="mb-4 p-4 bg-violet-600/50 rounded-lg border border-violet-400/50">
          <p className="text-violet-100">
            You don't have any active tasks assigned. You can still add a note or skip for today.
          </p>
          <div className="mt-3">
            <label className="block text-sm font-medium text-violet-100 mb-2">
              Add a note (optional):
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any updates or comments..."
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-violet-200 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-white text-violet-600 px-6 py-3 rounded-lg font-semibold hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Submit Check-in
            </>
          )}
        </button>
        <button
          onClick={handleSkip}
          disabled={submitting}
          className="px-6 py-3 rounded-lg font-semibold bg-violet-600/50 hover:bg-violet-600/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
        >
          Skip for today
        </button>
      </div>
    </div>
  );
}
