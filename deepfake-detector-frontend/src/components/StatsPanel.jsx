import { Image, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'gray' }) => {
  const colorClasses = {
    gray:   'bg-gray-50 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    green:  'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    red:    'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

export const StatsPanel = ({ stats }) => {
  const { total, pending, analyzing, completed, fake, real } = stats;

  if (total === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h2>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        <StatCard icon={Image}       label="Total Images" value={total}     color="blue" />
        <StatCard icon={Clock}       label="Pending"      value={pending}   color="gray" />
        <StatCard icon={Clock}       label="Analyzing"    value={analyzing} color="yellow" />
        <StatCard icon={CheckCircle} label="Completed"    value={completed} color="green" />
        <StatCard icon={CheckCircle} label="Real"         value={real}      color="green" />
        <StatCard icon={XCircle}     label="Fake"         value={fake}      color="red" />
      </div>

      {completed > 0 && total > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Analysis Progress</span>
            <span className="font-medium">{completed} / {total} ({Math.round((completed / total) * 100)}%)</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {completed > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Detection Results:</span>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-green-600 dark:text-green-400 font-semibold">{real}</span>
                <span className="text-gray-500 dark:text-gray-400"> Real</span>
              </div>
              <div className="text-sm">
                <span className="text-red-600 dark:text-red-400 font-semibold">{fake}</span>
                <span className="text-gray-500 dark:text-gray-400"> Fake</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
