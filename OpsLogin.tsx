import { useState } from 'react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

const DEMO_ID = 'OPS-001';
const DEMO_PASS = 'control123';

export default function OpsLogin({ onLogin, onBack }: Props) {
  const [opsId, setOpsId] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (opsId === DEMO_ID && pass === DEMO_PASS) {
      onLogin();
    } else {
      setError('Invalid credentials. Use the demo account below.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <span className="text-white font-bold">RIDE-X</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Dispatch Control</h1>
          <p className="text-slate-400 text-sm mb-8">Authorized operations access</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Operations ID</label>
              <input
                type="text"
                value={opsId}
                onChange={e => setOpsId(e.target.value)}
                placeholder="OPS-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Enter Control Center
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Demo Credentials</p>
            <button onClick={() => { setOpsId(DEMO_ID); setPass(DEMO_PASS); }} className="text-left w-full">
              <p className="text-purple-400 text-sm font-mono">{DEMO_ID}</p>
              <p className="text-slate-400 text-sm font-mono">{DEMO_PASS}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
