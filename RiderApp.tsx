import { useState, useMemo } from 'react';
import { useSim } from '../context/SimulationContext';
import { LOCATIONS } from '../lib/locations';
import { euclideanDistance } from '../lib/locations';
import { calculateFare, getDemandFromState, DEMAND_MULTIPLIERS, VEHICLE_TYPES, BASE_FARE, RATE_PER_UNIT } from '../lib/pricing';
import type { DemandLevel } from '../lib/dsa';

interface Props {
  riderName: string;
  onLogout: () => void;
}

type Tab = 'book' | 'myrides';

const DEMAND_COLORS: Record<DemandLevel, string> = {
  Low: 'text-green-400 bg-green-500/10 border-green-500/30',
  Normal: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  High: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  'Very High': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function RiderApp({ riderName, onLogout }: Props) {
  const { addRide, cancelRide, queue, rideMap, currentDemand, version } = useSim();
  const [tab, setTab] = useState<Tab>('book');

  // Booking form state
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [vehicle, setVehicle] = useState('Auto');
  const [name, setName] = useState(riderName);
  const [booked, setBooked] = useState<string | null>(null);
  const [bookError, setBookError] = useState('');

  const demand = currentDemand();

  const farePreview = useMemo(() => {
    if (!pickup || !drop || pickup === drop) return null;
    const pLoc = LOCATIONS.find(l => l.name === pickup);
    const dLoc = LOCATIONS.find(l => l.name === drop);
    if (!pLoc || !dLoc) return null;
    const dist = euclideanDistance(pLoc.x, pLoc.y, dLoc.x, dLoc.y);
    const fare = calculateFare(dist, demand, vehicle);
    return { dist, fare, surge: DEMAND_MULTIPLIERS[demand] };
  }, [pickup, drop, vehicle, demand, version]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBook() {
    setBookError('');
    if (!name.trim()) { setBookError('Please enter your name.'); return; }
    if (!pickup) { setBookError('Please select a pickup location.'); return; }
    if (!drop) { setBookError('Please select a destination.'); return; }
    if (pickup === drop) { setBookError('Pickup and destination cannot be the same.'); return; }
    if (!farePreview) return;

    const pLoc = LOCATIONS.find(l => l.name === pickup)!;
    const dLoc = LOCATIONS.find(l => l.name === drop)!;

    const rideId = addRide({
      rideId: `RIDE-${Date.now().toString(36).toUpperCase()}`,
      riderName: name.trim(),
      pickup, pickupX: pLoc.x, pickupY: pLoc.y,
      drop, dropX: dLoc.x, dropY: dLoc.y,
      distance: farePreview.dist,
      fare: farePreview.fare,
      demandLevel: demand,
      surgeMultiplier: farePreview.surge,
      vehicleType: vehicle,
    });
    setBooked(rideId);
    setPickup('');
    setDrop('');
  }

  // My rides: all rides where riderName matches
  const myRides = useMemo(() => {
    return queue.getAllRequests()
      .filter(n => n.data.riderName === name.trim())
      .map(n => n.data);
  }, [version, name]); // eslint-disable-line react-hooks/exhaustive-deps

  const queueList = queue.getAllRequests().map(n => n.data);
  const bookedRide = booked ? (() => {
    const node = rideMap.get(booked);
    if (node) return node.data;
    // might be matched/cancelled
    return null;
  })() : null;
  const queuePos = booked ? queueList.findIndex(r => r.rideId === booked) + 1 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-lg">RIDE-X</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm hidden sm:block">{riderName}</span>
          <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm transition-colors">Sign out</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="flex gap-1 max-w-2xl">
          {([['book', 'Book a Ride'], ['myrides', 'My Rides']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === 'book' && (
          <>
            {/* Success confirmation */}
            {booked && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400 font-semibold">Ride Booked!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-400">Ride ID:</span> <span className="text-white font-mono">{booked}</span></div>
                  <div><span className="text-slate-400">Status:</span> <span className="text-amber-400">{bookedRide?.status ?? 'Processing'}</span></div>
                  {queuePos > 0 && <div><span className="text-slate-400">Queue Position:</span> <span className="text-white">#{queuePos}</span></div>}
                  {bookedRide && <div><span className="text-slate-400">Fare:</span> <span className="text-white">₹{bookedRide.fare}</span></div>}
                </div>
                <button onClick={() => setBooked(null)} className="mt-3 text-slate-400 hover:text-white text-xs transition-colors">Book another ride</button>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-bold">Book a Ride</h2>

              {/* Name */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Enter your name" />
              </div>

              {/* Pickup */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Pickup Location</label>
                <select value={pickup} onChange={e => setPickup(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer">
                  <option value="">Select pickup location</option>
                  {LOCATIONS.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
              </div>

              {/* Drop */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Destination</label>
                <select value={drop} onChange={e => setDrop(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer">
                  <option value="">Select destination</option>
                  {LOCATIONS.filter(l => l.name !== pickup).map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
              </div>

              {/* Vehicle */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Vehicle Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v} onClick={() => setVehicle(v)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${vehicle === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-600'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fare preview */}
              {farePreview && (
                <div className="bg-slate-800 rounded-xl p-4 space-y-3 border border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pickup</span>
                    <span className="text-white font-medium">{pickup}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Destination</span>
                    <span className="text-white font-medium">{drop}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Distance</span>
                    <span className="text-white font-medium">{farePreview.dist.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-400">Current Demand</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${DEMAND_COLORS[demand]}`}>{demand}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Base Fare</span>
                    <span className="text-slate-300">₹{BASE_FARE}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Rate × Distance</span>
                    <span className="text-slate-300">₹{RATE_PER_UNIT} × {farePreview.dist.toFixed(1)}</span>
                  </div>
                  {farePreview.surge > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Surge ({farePreview.surge}×)</span>
                      <span className="text-amber-400">Applied</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Estimated Fare</span>
                    <span className="text-2xl font-bold text-blue-400">₹{farePreview.fare}</span>
                  </div>
                </div>
              )}

              {bookError && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{bookError}</p>
              )}

              <button
                onClick={handleBook}
                disabled={!farePreview}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-lg"
              >
                {farePreview ? `Accept & Book Ride · ₹${farePreview.fare}` : 'Select locations to continue'}
              </button>
            </div>
          </>
        )}

        {tab === 'myrides' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">My Rides</h2>
            {myRides.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-400">No rides found for <span className="text-white">{name}</span>.</p>
                <button onClick={() => setTab('book')} className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors">Book your first ride →</button>
              </div>
            )}
            {myRides.map(ride => {
              const pos = queueList.findIndex(r => r.rideId === ride.rideId) + 1;
              return (
                <div key={ride.rideId} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-sm text-blue-400">{ride.rideId}</span>
                      {pos > 0 && <span className="ml-2 text-xs text-slate-400">Queue #{pos}</span>}
                    </div>
                    <StatusBadge status={ride.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-slate-400">From:</span> <span className="text-white">{ride.pickup}</span></div>
                    <div><span className="text-slate-400">To:</span> <span className="text-white">{ride.drop}</span></div>
                    <div><span className="text-slate-400">Distance:</span> <span className="text-white">{ride.distance.toFixed(1)} km</span></div>
                    <div><span className="text-slate-400">Fare:</span> <span className="text-white font-semibold">₹{ride.fare}</span></div>
                    {ride.assignedDriver && <div className="col-span-2"><span className="text-slate-400">Driver:</span> <span className="text-green-400">{ride.assignedDriver}</span></div>}
                  </div>
                  {ride.status === 'Waiting' && (
                    <button onClick={() => cancelRide(ride.rideId)}
                      className="text-red-400 hover:text-red-300 text-sm border border-red-500/30 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors">
                      Cancel Ride
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Matched: 'bg-green-500/10 text-green-400 border-green-500/30',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {status}
    </span>
  );
}
