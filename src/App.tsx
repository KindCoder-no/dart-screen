import { useState } from 'react';
import { Target, Monitor, BarChart3, Settings, Power, RotateCcw, ExternalLink, Activity } from 'lucide-react';

interface AppLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const apps: AppLink[] = [
  {
    name: 'Autodarts',
    url: 'https://play.autodarts.io',
    icon: <Target className="w-8 h-8" />,
    description: 'Automatic dart scoring',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'kcapp',
    url: 'http://localhost:3000',
    icon: <BarChart3 className="w-8 h-8" />,
    description: 'Dart statistics & scoring',
    color: 'from-sky-500 to-blue-600',
  },
  {
    name: 'Autodarts Caller',
    url: 'http://localhost:3001',
    icon: <Activity className="w-8 h-8" />,
    description: 'Voice caller integration',
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Board Manager',
    url: 'https://play.autodarts.io/boards',
    icon: <Monitor className="w-8 h-8" />,
    description: 'Board configuration',
    color: 'from-rose-500 to-red-600',
  },
  {
    name: 'Settings',
    url: 'http://localhost:3002',
    icon: <Settings className="w-8 h-8" />,
    description: 'System configuration',
    color: 'from-slate-500 to-gray-600',
  },
];

function App() {
  const [confirmAction, setConfirmAction] = useState<'reboot' | 'shutdown' | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const handleSystemAction = async (action: 'reboot' | 'shutdown') => {
    setConfirmAction(null);
    setActionStatus(action === 'reboot' ? 'Rebooting...' : 'Shutting down...');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-action`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Command failed');
      }
    } catch {
      setActionStatus('Command sent. Device may be unreachable shortly.');
    }

    setTimeout(() => setActionStatus(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Dart Station</h1>
              <p className="text-sm text-gray-400">Autodarts Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400 ml-1">Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* App Grid */}
          <section>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Applications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-lg`}>
                      {app.icon}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{app.name}</h3>
                  <p className="text-sm text-gray-400">{app.description}</p>
                </a>
              ))}
            </div>
          </section>

          {/* System Controls */}
          <section className="mt-10">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">System Controls</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setConfirmAction('reboot')}
                className="flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-200 group"
              >
                <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                <span className="font-medium text-gray-300 group-hover:text-amber-300 transition-colors">Reboot</span>
              </button>
              <button
                onClick={() => setConfirmAction('shutdown')}
                className="flex items-center gap-2 px-5 py-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 group"
              >
                <Power className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                <span className="font-medium text-gray-300 group-hover:text-red-300 transition-colors">Shutdown</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Status Message */}
      {actionStatus && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-xl shadow-2xl animate-fade-in">
          <p className="text-sm font-medium">{actionStatus}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className={`w-12 h-12 rounded-xl ${confirmAction === 'reboot' ? 'bg-amber-500/10' : 'bg-red-500/10'} flex items-center justify-center mb-4`}>
              {confirmAction === 'reboot' ? (
                <RotateCcw className="w-6 h-6 text-amber-400" />
              ) : (
                <Power className="w-6 h-6 text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {confirmAction === 'reboot' ? 'Reboot Device?' : 'Shutdown Device?'}
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {confirmAction === 'reboot'
                ? 'The system will restart. This may take a minute.'
                : 'The system will power off. You will need physical access to turn it back on.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-750 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSystemAction(confirmAction)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirmAction === 'reboot'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {confirmAction === 'reboot' ? 'Reboot' : 'Shutdown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
