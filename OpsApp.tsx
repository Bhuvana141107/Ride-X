import { useState, useMemo } from 'react';
import { useSim } from '../context/SimulationContext';
import type { DriverData, DriverStatus } from '../lib/dsa';
import { VEHICLE_TYPES, DEMAND_MULTIPLIERS } from '../lib/pricing';

interface Props { onLogout: () => void; }

type Tab = 'dashboard' | 'queue' | 'drivers' | 'algo' | 'complexity' | 'log' | 'about';

export default function OpsApp({ onLogout }: Props) {
  const sim = useSim();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  const tabs: [Tab, string][] = [
    ['dashboard', 'Dashboard'],
    ['queue', 'Dispatch Queue'],
    ['drivers', 'Drivers'],
    ['algo', 'Algorithm Viz'],
    ['complexity', 'Complexity'],
    ['log', 'Activity Log'],
    ['about', 'About'],
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <span className="font-bold">RIDE-X</span>
            <span className="text-slate-400 text-xs ml-2">Dispatch Control</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-green-400 text-xs"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />System Online</span>
          <button onClick={() => { if (confirm('Reset all simulation data?')) sim.resetSimulation(); }}
            className="text-slate-400 hover:text-red-400 text-xs border border-slate-700 hover:border-red-500/50 rounded-lg px-3 py-1.5 transition-colors">
            Reset
          </button>
          <button onClick={sim.loadSampleData}
            className="text-slate-300 hover:text-white text-xs border border-slate-700 hover:border-blue-500 rounded-lg px-3 py-1.5 transition-colors">
            Load Sample
          </button>
          <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm transition-colors">Sign out</button>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {tab === 'dashboard' && <DashboardTab sim={sim} dispatchMsg={dispatchMsg} setDispatchMsg={setDispatchMsg} />}
        {tab === 'queue' && <QueueTab sim={sim} />}
        {tab === 'drivers' && <DriversTab sim={sim} />}
        {tab === 'algo' && <AlgoVizTab />}
        {tab === 'complexity' && <ComplexityTab />}
        {tab === 'log' && <ActivityLogTab sim={sim} />}
        {tab === 'about' && <AboutTab />}
      </main>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab({ sim, dispatchMsg, setDispatchMsg }: { sim: ReturnType<typeof useSim>; dispatchMsg: string | null; setDispatchMsg: (m: string | null) => void }) {
  const { queue, driverMap, stats } = sim;
  const drivers = Array.from(driverMap.values());
  const available = drivers.filter(d => d.status === 'Available').length;
  const busy = drivers.filter(d => d.status === 'Busy').length;
  const rides = queue.getAllRequests().map(n => n.data);
  const avgFare = rides.length ? Math.round(rides.reduce((s, r) => s + r.fare, 0) / rides.length) : 0;

  function handleDispatch() {
    const result = sim.dispatchNext();
    if (result === 'empty') setDispatchMsg('Queue is empty — no rides waiting.');
    else if (result === 'no_driver') setDispatchMsg('No available drivers right now.');
    else if (result) setDispatchMsg(`✓ ${result.ride.rideId} matched with ${result.driver.name} (${result.driver.driverId})`);
    setTimeout(() => setDispatchMsg(null), 4000);
  }

  const statCards = [
    { label: 'Active Requests', value: queue.size, color: 'blue' },
    { label: 'Available Drivers', value: available, color: 'green' },
    { label: 'Busy Drivers', value: busy, color: 'amber' },
    { label: 'Completed Rides', value: stats.completedRides, color: 'purple' },
    { label: 'Cancelled Rides', value: stats.cancelledRides, color: 'red' },
    { label: 'Queue Size', value: queue.size, color: 'blue' },
    { label: 'Total Rides', value: stats.totalRides, color: 'slate' },
    { label: 'Avg Fare', value: avgFare ? `₹${avgFare}` : '—', color: 'teal' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    slate: 'bg-slate-700/50 border-slate-600 text-slate-300',
    teal: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Operations Dashboard</h2>
        <button onClick={handleDispatch}
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Dispatch Next (FIFO)
        </button>
      </div>

      {dispatchMsg && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${dispatchMsg.startsWith('✓') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
          {dispatchMsg}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${colorMap[color]}`}>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Live DLL State Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Live Data Structure State</h3>
        <div className="grid md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <p className="text-purple-400 mb-2">DISPATCH QUEUE</p>
            {queue.size === 0 ? <p className="text-slate-500">Empty</p> : (
              <p className="text-slate-300">HEAD → {queue.getAllRequests().map(n => n.data.rideId).join(' ↔ ')} ← TAIL</p>
            )}
            <p className="text-slate-500 mt-1">Size: {queue.size}</p>
          </div>
          <div>
            <p className="text-blue-400 mb-2">RIDE HASH MAP</p>
            {sim.rideMap.size === 0 ? <p className="text-slate-500">Empty</p> : (
              Array.from(sim.rideMap.keys()).map(k => <p key={k} className="text-slate-300">{k} → Node</p>)
            )}
          </div>
          <div>
            <p className="text-green-400 mb-2">DRIVER HASH MAP</p>
            {driverMap.size === 0 ? <p className="text-slate-500">Empty</p> : (
              Array.from(driverMap.values()).map(d => (
                <p key={d.driverId} className={d.status === 'Available' ? 'text-green-400' : 'text-amber-400'}>
                  {d.driverId} → {d.status}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Queue ────────────────────────────────────────────────────────────────────
function QueueTab({ sim }: { sim: ReturnType<typeof useSim> }) {
  const nodes = sim.queue.getAllRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dispatch Queue</h2>
        <span className="text-slate-400 text-sm">FIFO · {nodes.length} request(s)</span>
      </div>

      {/* DLL Visual */}
      {nodes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
          <div className="flex items-start gap-2 min-w-max">
            <div className="flex flex-col items-center">
              <span className="text-purple-400 text-xs font-mono mb-1">HEAD</span>
              <span className="text-purple-400 text-xl">↓</span>
            </div>
            {nodes.map((node, i) => (
              <div key={node.data.rideId} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  {i > 0 && <span className="text-slate-500 text-xs font-mono">← prev</span>}
                  <div className="bg-slate-800 border border-blue-500/40 rounded-xl p-3 w-36 text-center">
                    <p className="text-blue-400 font-mono text-sm font-semibold">{node.data.rideId}</p>
                    <p className="text-slate-300 text-xs mt-1">{node.data.riderName}</p>
                    <p className="text-slate-400 text-xs">₹{node.data.fare}</p>
                    <p className="text-amber-400 text-xs mt-1">{node.data.status}</p>
                  </div>
                  {i < nodes.length - 1 && <span className="text-slate-500 text-xs font-mono">next →</span>}
                </div>
                {i < nodes.length - 1 && <span className="text-slate-500 text-lg">↔</span>}
              </div>
            ))}
            <div className="flex flex-col items-center">
              <span className="text-purple-400 text-xs font-mono mb-1">TAIL</span>
              <span className="text-purple-400 text-xl">↓</span>
            </div>
          </div>
        </div>
      )}
      {nodes.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          Queue is empty. Rides appear here when riders book.
        </div>
      )}

      {/* Queue cards */}
      <div className="space-y-3">
        {nodes.map((node, i) => {
          const r = node.data;
          return (
            <div key={r.rideId} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-slate-400 text-xs mr-2">#{i + 1}</span>
                  <span className="font-mono text-blue-400 text-sm">{r.rideId}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-amber-400 text-xs border border-amber-500/30 rounded-full px-2 py-0.5">{r.status}</span>
                  <button onClick={() => sim.cancelRide(r.rideId)}
                    className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 hover:border-red-400 rounded-lg px-2 py-0.5 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div><span className="text-slate-400">Rider:</span> <span className="text-white">{r.riderName}</span></div>
                <div><span className="text-slate-400">From:</span> <span className="text-white">{r.pickup}</span></div>
                <div><span className="text-slate-400">To:</span> <span className="text-white">{r.drop}</span></div>
                <div><span className="text-slate-400">Distance:</span> <span className="text-white">{r.distance.toFixed(1)} km</span></div>
                <div><span className="text-slate-400">Fare:</span> <span className="text-white font-semibold">₹{r.fare}</span></div>
                <div><span className="text-slate-400">Demand:</span> <span className="text-amber-400">{r.demandLevel}</span></div>
                <div><span className="text-slate-400">Vehicle:</span> <span className="text-white">{r.vehicleType}</span></div>
                <div><span className="text-slate-400">prev:</span> <span className="text-purple-400 font-mono">{node.prev ? node.prev.data.rideId : 'null'}</span></div>
                <div><span className="text-slate-400">next:</span> <span className="text-purple-400 font-mono">{node.next ? node.next.data.rideId : 'null'}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Drivers ──────────────────────────────────────────────────────────────────
function DriversTab({ sim }: { sim: ReturnType<typeof useSim> }) {
  const drivers = Array.from(sim.driverMap.values());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', vehicleType: 'Auto', locationX: '10', locationY: '10' });

  function addDriver() {
    if (!form.name.trim()) return;
    const id = `DRIVER-${String(sim.driverMap.size + 1).padStart(2, '0')}`;
    sim.addDriver({
      driverId: id, name: form.name.trim(), vehicleType: form.vehicleType,
      locationX: parseFloat(form.locationX) || 10,
      locationY: parseFloat(form.locationY) || 10,
      status: 'Available',
    });
    setForm({ name: '', vehicleType: 'Auto', locationX: '10', locationY: '10' });
    setShowAdd(false);
  }

  const available = drivers.filter(d => d.status === 'Available').length;
  const busy = drivers.filter(d => d.status === 'Busy').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Driver Fleet</h2>
          <p className="text-slate-400 text-sm">{available} available · {busy} busy · {drivers.length} total</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          + Add Driver
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">New Driver</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Driver Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 col-span-2" />
            <select value={form.vehicleType} onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
            </select>
            <div className="flex gap-2">
              <input placeholder="X" value={form.locationX} onChange={e => setForm(f => ({ ...f, locationX: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none w-16" />
              <input placeholder="Y" value={form.locationY} onChange={e => setForm(f => ({ ...f, locationY: e.target.value }))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none w-16" />
            </div>
          </div>
          <button onClick={addDriver} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">Add to Fleet</button>
        </div>
      )}

      {/* Coordinate grid */}
      {drivers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Driver Location Grid</h3>
          <DriverGrid drivers={drivers} />
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {drivers.map(d => (
          <div key={d.driverId} className={`bg-slate-900 border rounded-xl p-4 ${d.status === 'Available' ? 'border-green-500/30' : 'border-amber-500/30'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-white text-sm">{d.name}</p>
                <p className="text-slate-400 text-xs font-mono">{d.driverId}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${d.status === 'Available' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                {d.status}
              </span>
            </div>
            <div className="text-xs text-slate-400 space-y-1 mb-3">
              <p>Location: ({d.locationX}, {d.locationY})</p>
              <p>Vehicle: {d.vehicleType}</p>
              {d.currentRide && <p>Ride: <span className="text-amber-400 font-mono">{d.currentRide}</span></p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => sim.setDriverStatus(d.driverId, 'Available')}
                disabled={d.status === 'Available'}
                className="flex-1 text-xs py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Set Available
              </button>
              <button onClick={() => sim.setDriverStatus(d.driverId, 'Busy')}
                disabled={d.status === 'Busy'}
                className="flex-1 text-xs py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Set Busy
              </button>
              <button onClick={() => sim.removeDriver(d.driverId)}
                className="text-xs py-1.5 px-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                ✕
              </button>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="col-span-3 text-center text-slate-400 py-8">No drivers registered. Add one above or load sample data.</div>
        )}
      </div>
    </div>
  );
}

function DriverGrid({ drivers }: { drivers: DriverData[] }) {
  const SIZE = 240;
  const PAD = 20;
  const MAX = 40;
  const scale = (v: number) => PAD + (v / MAX) * (SIZE - PAD * 2);

  return (
    <svg width={SIZE} height={SIZE} className="bg-slate-800 rounded-lg border border-slate-700">
      {/* Grid lines */}
      {[0, 10, 20, 30, 40].map(v => (
        <line key={`hg${v}`} x1={PAD} y1={scale(v)} x2={SIZE - PAD} y2={scale(v)} stroke="#334155" strokeWidth="1" />
      ))}
      {[0, 10, 20, 30, 40].map(v => (
        <line key={`vg${v}`} x1={scale(v)} y1={PAD} x2={scale(v)} y2={SIZE - PAD} stroke="#334155" strokeWidth="1" />
      ))}
      {/* Axes */}
      <line x1={PAD} y1={SIZE - PAD} x2={SIZE - PAD} y2={SIZE - PAD} stroke="#475569" strokeWidth="1.5" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={SIZE - PAD} stroke="#475569" strokeWidth="1.5" />
      {/* Labels */}
      <text x={SIZE / 2} y={SIZE - 4} fill="#64748b" fontSize="10" textAnchor="middle">X</text>
      <text x={8} y={SIZE / 2} fill="#64748b" fontSize="10" textAnchor="middle">Y</text>
      {/* Drivers */}
      {drivers.map(d => {
        const cx = scale(d.locationX);
        const cy = SIZE - scale(d.locationY);
        return (
          <g key={d.driverId}>
            <circle cx={cx} cy={cy} r={7} fill={d.status === 'Available' ? '#22c55e' : '#f59e0b'} opacity={0.85} />
            <text x={cx} y={cy - 10} fill="#e2e8f0" fontSize="9" textAnchor="middle">{d.driverId.replace('DRIVER-', 'D')}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Algorithm Visualization ──────────────────────────────────────────────────
function AlgoVizTab() {
  const sections = [
    {
      title: 'ENQUEUE — Add Ride',
      color: 'blue',
      steps: ['New Ride Request received', 'Create RideNode with all data', 'Set node.prev = queue.tail', 'Set queue.tail.next = node', 'Update queue.tail = node', 'Add rideId → node to rideMap (Hash Map)', 'Increment queue.size'],
      complexity: 'O(1)',
      note: 'Insertion at tail is always constant time.',
    },
    {
      title: 'DEQUEUE — Dispatch Ride',
      color: 'purple',
      steps: ['Check if queue is empty', 'Retrieve queue.head (first node)', 'Update queue.head = head.next', 'Set new head.prev = null', 'Assign available driver from driverMap', 'Update ride.status = Matched', 'Update driver.status = Busy'],
      complexity: 'O(1)',
      note: 'Removal from head is always constant time — strict FIFO.',
    },
    {
      title: 'CANCEL — O(1) via Hash Map',
      color: 'red',
      steps: ['User requests cancellation of rideId', 'rideMap.get(rideId) — direct lookup', 'Retrieve actual RideNode reference', 'Access node.prev and node.next', 'Reconnect: node.prev.next = node.next', 'Reconnect: node.next.prev = node.prev', 'rideMap.delete(rideId)', 'Decrement queue.size'],
      complexity: 'O(1)',
      note: 'Hash Map gives direct node reference — no traversal needed.',
    },
    {
      title: 'DRIVER LOOKUP',
      color: 'green',
      steps: ['driverMap.get(driverId)', 'Return driver object directly', 'Update driver.status', 'driverMap.set(driverId, updatedDriver)'],
      complexity: 'O(1)',
      note: 'Hash Map provides constant-time driver access.',
    },
    {
      title: 'FARE CALCULATION',
      color: 'amber',
      steps: ['distance = √((x₂-x₁)² + (y₂-y₁)²)', 'demand = getDemandFromState(activeRides, availableDrivers)', 'surge = DEMAND_MULTIPLIERS[demand]', 'fare = (BASE_FARE + distance × RATE × surge) × vehicleFactor'],
      complexity: 'O(1)',
      note: 'Pure mathematical operations — no loops or data structure traversal.',
    },
  ];

  const colorMap: Record<string, { border: string; title: string; step: string; badge: string }> = {
    blue: { border: 'border-blue-500/30', title: 'text-blue-400', step: 'bg-blue-500/10 border-blue-500/20 text-blue-300', badge: 'bg-blue-600' },
    purple: { border: 'border-purple-500/30', title: 'text-purple-400', step: 'bg-purple-500/10 border-purple-500/20 text-purple-300', badge: 'bg-purple-600' },
    red: { border: 'border-red-500/30', title: 'text-red-400', step: 'bg-red-500/10 border-red-500/20 text-red-300', badge: 'bg-red-600' },
    green: { border: 'border-green-500/30', title: 'text-green-400', step: 'bg-green-500/10 border-green-500/20 text-green-300', badge: 'bg-green-600' },
    amber: { border: 'border-amber-500/30', title: 'text-amber-400', step: 'bg-amber-500/10 border-amber-500/20 text-amber-300', badge: 'bg-amber-600' },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Algorithm Visualization</h2>
      <div className="grid md:grid-cols-2 gap-5">
        {sections.map(s => {
          const c = colorMap[s.color];
          return (
            <div key={s.title} className={`bg-slate-900 border ${c.border} rounded-xl p-5`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className={`font-bold text-sm ${c.title}`}>{s.title}</h3>
                <span className={`text-xs text-white px-2 py-0.5 rounded-full font-mono ${c.badge}`}>{s.complexity}</span>
              </div>
              <ol className="space-y-2">
                {s.steps.map((step, i) => (
                  <li key={i} className={`flex gap-2 items-start border rounded-lg px-3 py-2 text-xs ${c.step}`}>
                    <span className="font-mono opacity-60 shrink-0">{i + 1}.</span>
                    <span className="font-mono">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-slate-500 text-xs italic">{s.note}</p>
            </div>
          );
        })}
      </div>

      {/* Cancellation example diagram */}
      <div className="bg-slate-900 border border-red-500/20 rounded-xl p-5">
        <h3 className="text-red-400 font-bold text-sm mb-4">Cancellation Step-by-Step Example</h3>
        <div className="space-y-2 text-xs font-mono">
          {[
            ['STEP 1', 'Before: HEAD → R101 ↔ R102 ↔ R103 ↔ R104 ← TAIL', 'text-slate-300'],
            ['STEP 2', 'Cancel request: rideId = "R103"', 'text-amber-300'],
            ['STEP 3', 'Hash Map: rideMap.get("R103") → Node R103', 'text-blue-300'],
            ['STEP 4', 'Access: R103.prev = R102, R103.next = R104', 'text-purple-300'],
            ['STEP 5', 'Reconnect: R102.next = R104', 'text-green-300'],
            ['STEP 6', 'Reconnect: R104.prev = R102', 'text-green-300'],
            ['STEP 7', 'rideMap.delete("R103") — remove Hash Map entry', 'text-red-300'],
            ['FINAL', 'After: HEAD → R101 ↔ R102 ↔ R104 ← TAIL', 'text-slate-300'],
          ].map(([label, text, cls]) => (
            <div key={label} className="flex gap-3 items-center">
              <span className="text-slate-500 w-14 shrink-0">{label}</span>
              <span className={cls}>{text}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-green-400 text-xs font-semibold">✓ Time Complexity: O(1) — no list traversal required</p>
      </div>
    </div>
  );
}

// ── Complexity ───────────────────────────────────────────────────────────────
function ComplexityTab() {
  const rows = [
    ['Enqueue', 'Doubly Linked List', 'O(1)', 'Insert node at tail — update tail pointer'],
    ['Dequeue', 'Doubly Linked List', 'O(1)', 'Remove node from head — update head pointer'],
    ['Cancel (any position)', 'Hash Map + Doubly Linked List', 'O(1)', 'Direct node reference via rideMap; pointer reconnection'],
    ['Driver Availability', 'Hash Map (driverMap)', 'O(1)', 'Direct lookup by driverId key'],
    ['Price Calculation', 'Mathematical formula', 'O(1)', 'Euclidean distance + fare formula; no loops'],
    ['Display/Traverse Queue', 'Doubly Linked List', 'O(R)', 'R = number of active ride requests'],
    ['Load Sample Data', 'DLL + Hash Maps', 'O(R + D)', 'Insert R rides + D drivers'],
  ];

  const dsaComparisons = [
    { label: 'Standard Array', cancel: 'O(N)', enqueue: 'O(1)', dequeue: 'O(N)', notes: 'Removal from middle requires shifting all elements' },
    { label: 'Standard Queue', cancel: 'O(N)', enqueue: 'O(1)', dequeue: 'O(1)', notes: 'Arbitrary cancellation requires linear scan' },
    { label: 'RIDE-X Hybrid (DLL + HashMap)', cancel: 'O(1)', enqueue: 'O(1)', dequeue: 'O(1)', notes: 'Hash Map gives direct node reference; DLL enables O(1) pointer-based removal' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Complexity Analysis</h2>

      {/* Time complexity table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <h3 className="font-semibold text-slate-300 text-sm">Time Complexity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Operation</th>
                <th className="px-5 py-3 text-left">Data Structure</th>
                <th className="px-5 py-3 text-left">Complexity</th>
                <th className="px-5 py-3 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([op, ds, cx, reason]) => (
                <tr key={op} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{op}</td>
                  <td className="px-5 py-3 text-slate-300">{ds}</td>
                  <td className="px-5 py-3">
                    <span className={`font-mono font-bold text-sm ${cx === 'O(1)' ? 'text-green-400' : 'text-amber-400'}`}>{cx}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Space complexity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-slate-300 text-sm mb-3">Space Complexity</h3>
        <p className="text-green-400 font-mono text-xl font-bold mb-3">O(R + D)</p>
        <div className="space-y-2 text-sm text-slate-400">
          <p><span className="text-white">R</span> = number of active ride requests (stored in Doubly Linked List + rideMap)</p>
          <p><span className="text-white">D</span> = number of registered drivers (stored in driverMap)</p>
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <h3 className="font-semibold text-slate-300 text-sm">Standard Queue vs RIDE-X Hybrid Design</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Design</th>
                <th className="px-5 py-3 text-left">Enqueue</th>
                <th className="px-5 py-3 text-left">Dequeue</th>
                <th className="px-5 py-3 text-left">Cancel</th>
                <th className="px-5 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dsaComparisons.map(row => (
                <tr key={row.label} className={`border-b border-slate-800/50 ${row.label.includes('RIDE-X') ? 'bg-blue-500/5' : ''}`}>
                  <td className={`px-5 py-3 font-medium text-xs ${row.label.includes('RIDE-X') ? 'text-blue-400' : 'text-white'}`}>{row.label}</td>
                  <td className={`px-5 py-3 font-mono font-bold ${row.enqueue === 'O(1)' ? 'text-green-400' : 'text-red-400'}`}>{row.enqueue}</td>
                  <td className={`px-5 py-3 font-mono font-bold ${row.dequeue === 'O(1)' ? 'text-green-400' : 'text-red-400'}`}>{row.dequeue}</td>
                  <td className={`px-5 py-3 font-mono font-bold ${row.cancel === 'O(1)' ? 'text-green-400' : 'text-red-400'}`}>{row.cancel}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why these data structures */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { title: 'Doubly Linked List', color: 'blue', reasons: ['Maintains strict FIFO order', 'O(1) insertion at tail (enqueue)', 'O(1) removal from head (dequeue)', 'Pointer-based removal of any node (cancel)', 'No index shifting like arrays'] },
          { title: 'Hash Map (rideMap)', color: 'purple', reasons: ['Direct lookup by Ride ID: O(1)', 'Stores rideId → actual RideNode reference', 'Eliminates linear scan during cancellation', 'Complements DLL for O(1) arbitrary removal'] },
          { title: 'Hash Map (driverMap)', color: 'green', reasons: ['Direct driver access by driverId: O(1)', 'Stores full driver object with status', 'O(1) status updates (Available/Busy)', 'Fast availability checks during dispatch'] },
          { title: 'Euclidean Distance', color: 'amber', reasons: ['Simple coordinate-based calculation', 'Formula: √((x₂-x₁)² + (y₂-y₁)²)', 'O(1) constant time computation', 'No external map API required'] },
        ].map(({ title, color, reasons }) => {
          const colors: Record<string, string> = {
            blue: 'border-blue-500/30 text-blue-400',
            purple: 'border-purple-500/30 text-purple-400',
            green: 'border-green-500/30 text-green-400',
            amber: 'border-amber-500/30 text-amber-400',
          };
          return (
            <div key={title} className={`bg-slate-900 border rounded-xl p-4 ${colors[color].split(' ')[0]}`}>
              <h4 className={`font-bold text-sm mb-3 ${colors[color].split(' ')[1]}`}>{title}</h4>
              <ul className="space-y-1.5">
                {reasons.map(r => (
                  <li key={r} className="flex gap-2 text-xs text-slate-400">
                    <span className={`shrink-0 ${colors[color].split(' ')[1]}`}>→</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Activity Log ─────────────────────────────────────────────────────────────
function ActivityLogTab({ sim }: { sim: ReturnType<typeof useSim> }) {
  const opColors: Record<string, string> = {
    ENQUEUE: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    DEQUEUE: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    CANCEL: 'text-red-400 bg-red-500/10 border-red-500/30',
    DRIVER_UPDATE: 'text-green-400 bg-green-500/10 border-green-500/30',
    DRIVER_ADD: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    LOAD: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Activity Log</h2>
        <span className="text-slate-400 text-sm">{sim.activityLog.length} entries</span>
      </div>
      {sim.activityLog.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          No activity yet. Operations appear here in real time.
        </div>
      )}
      <div className="space-y-2">
        {sim.activityLog.map(entry => {
          const color = opColors[entry.operation] ?? 'text-slate-300 bg-slate-800 border-slate-700';
          return (
            <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-start gap-4">
              <span className="text-slate-500 text-xs font-mono shrink-0 mt-0.5">
                {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm">{entry.message}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${color}`}>{entry.operation}</span>
                <span className="text-xs text-green-400 font-mono">{entry.complexity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
function AboutTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold">About RIDE-X</h2>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-blue-400 font-bold mb-1">Ride-Sharing Dispatch System</h3>
        <p className="text-slate-400 text-sm mb-4">A High-Performance DSA Design for Real-Time Request Matching & Dynamic Price Estimation</p>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Team Members</p>
            <div className="space-y-1.5">
              {[
                ['D. Bhuvana', 'CH.SC.U4CSE25211'],
                ['Jyothsna Reddy Anday', 'CH.SC.U4CSE25219'],
              ].map(([name, id]) => (
                <div key={id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-white text-sm">{name}</span>
                  <span className="text-slate-400 text-xs font-mono">{id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Core Data Structures</p>
            <ul className="space-y-1">
              {['Doubly Linked List', 'Hash Map (rideMap)', 'Hash Map (driverMap)'].map(d => (
                <li key={d} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-blue-400">▸</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Core Operations</p>
            <ul className="space-y-1">
              {['Enqueue — O(1)', 'Dequeue — O(1)', 'Cancel — O(1)', 'Driver Lookup — O(1)', 'Price Calculation — O(1)'].map(d => (
                <li key={d} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-green-400">▸</span>{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Academic Requirements</p>
        <div className="space-y-2">
          {[
            ['Algorithm Design', '30 marks', 'Enqueue, Dequeue, Cancel, Driver Lookup, Price Calculation'],
            ['Complexity Analysis', '30 marks', 'O(1) for all core operations; O(R+D) space'],
            ['Technique Selection', '30 marks', 'DLL + HashMap hybrid for FIFO + O(1) cancellation'],
            ['Presentation & Interaction', '10 marks', 'Interactive real-time simulation with live DSA state'],
          ].map(([title, marks, desc]) => (
            <div key={title} className="flex gap-3 items-start">
              <span className="text-purple-400 text-xs font-mono shrink-0 mt-0.5">{marks}</span>
              <div>
                <p className="text-white text-sm font-medium">{title}</p>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'localStorage', 'No external APIs'].map(t => (
            <span key={t} className="text-xs bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-slate-300">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
