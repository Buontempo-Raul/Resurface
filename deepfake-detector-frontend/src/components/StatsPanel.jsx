import { BarChart3 } from 'lucide-react';

const KpiStat = ({ label, value, valueClassName = 'text-gray-900 dark:text-white', pulse }) => (
  <div>
    <div className="flex items-center gap-1.5">
      <span className={`text-2xl sm:text-3xl font-bold ${valueClassName}`}>{value}</span>
      {pulse && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />}
    </div>
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

export const StatsPanel = ({ stats }) => {
  const { total, pending, analyzing, completed, fake, real } = stats;

  if (total === 0) return null;

  const realPct = completed > 0 ? Math.round((real / completed) * 100) : 0;
  const fakePct = completed > 0 ? 100 - realPct : 0;

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
        <KpiStat label="Total" value={total} />
        <KpiStat label="Pending" value={pending} />
        <KpiStat label="Analyzing" value={analyzing} pulse={analyzing > 0} />
        <KpiStat label="Completed" value={completed} />
      </div>

      {completed > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Analyzed</span>
            <span className="font-medium">{completed} / {total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-primary-100/70 dark:bg-primary-900/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {completed > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-white/10">
          <div className="flex items-end justify-between mb-1.5">
            <div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{real}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">Real · {realPct}%</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-red-600 dark:text-red-400">{fake}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">Fake · {fakePct}%</span>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden flex gap-px bg-gray-200/60 dark:bg-white/5">
            <div className="bg-green-500" style={{ width: `${realPct}%` }} />
            <div className="bg-red-500" style={{ width: `${fakePct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};
