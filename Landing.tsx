interface Props {
  onStartJourney: () => void;
  onOperations: () => void;
}

export default function Landing({ onStartJourney, onOperations }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-600 rounded-full opacity-10 blur-3xl" />

      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-5xl font-black text-white tracking-tight">RIDE-X</span>
        </div>

        <p className="text-slate-400 text-xl mb-2">Smart Dispatch for Every Journey</p>
        <p className="text-slate-600 text-sm mb-12">DSA-Powered · Doubly Linked List · Hash Map · O(1) Operations</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onStartJourney}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
          >
            Start a Journey
          </button>
          <button
            onClick={onOperations}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-lg transition-all duration-200 border border-slate-700 flex items-center gap-2 justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Operations
          </button>
        </div>

        {/* Status */}
        <div className="mt-16 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">System Online</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="text-slate-500 text-sm">DSA Phase 2 Academic Project</span>
        </div>
      </div>
    </div>
  );
}
