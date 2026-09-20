import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DispatchQueue, RideNode, RideData, DriverData, DriverStatus, DemandLevel } from '../lib/dsa';
import { getDemandFromState, calculateFare, DEMAND_MULTIPLIERS } from '../lib/pricing';
import { euclideanDistance } from '../lib/locations';

export interface ActivityLog {
  id: string;
  timestamp: number;
  message: string;
  operation: string;
  complexity: string;
}

interface Stats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
}

// ── Module-level DSA singletons ─────────────────────────────────────────────
const queue = new DispatchQueue();
const rideMap = new Map<string, RideNode>();
const driverMap = new Map<string, DriverData>();

// serialise / restore from localStorage
function saveToStorage(log: ActivityLog[], stats: Stats) {
  try {
    const rides = queue.getAllRequests().map(n => n.data);
    const drivers = Array.from(driverMap.values());
    localStorage.setItem('ridex_data', JSON.stringify({ rides, drivers, log, stats }));
  } catch { /* ignore */ }
}

function loadFromStorage(): { log: ActivityLog[]; stats: Stats } {
  try {
    const raw = localStorage.getItem('ridex_data');
    if (!raw) return { log: [], stats: { totalRides: 0, completedRides: 0, cancelledRides: 0 } };
    const { rides, drivers, log, stats } = JSON.parse(raw);

    // Clear existing singletons
    queue.head = queue.tail = null;
    queue.size = 0;
    rideMap.clear();
    driverMap.clear();

    // Restore drivers
    (drivers as DriverData[]).forEach(d => driverMap.set(d.driverId, d));

    // Restore DLL in order
    (rides as RideData[]).filter(r => r.status === 'Waiting').forEach(r => {
      const node = queue.enqueue(r);
      rideMap.set(r.rideId, node);
    });

    return { log: log ?? [], stats: stats ?? { totalRides: 0, completedRides: 0, cancelledRides: 0 } };
  } catch {
    return { log: [], stats: { totalRides: 0, completedRides: 0, cancelledRides: 0 } };
  }
}

// ── Context ─────────────────────────────────────────────────────────────────
interface SimContextValue {
  queue: DispatchQueue;
  rideMap: Map<string, RideNode>;
  driverMap: Map<string, DriverData>;
  activityLog: ActivityLog[];
  stats: Stats;
  version: number;

  currentDemand: () => DemandLevel;
  addRide: (data: Omit<RideData, 'status' | 'timestamp'>) => string;
  cancelRide: (rideId: string) => boolean;
  dispatchNext: () => { ride: RideData; driver: DriverData } | null | 'no_driver' | 'empty';
  setDriverStatus: (driverId: string, status: DriverStatus) => void;
  addDriver: (driver: DriverData) => void;
  removeDriver: (driverId: string) => void;
  loadSampleData: () => void;
  resetSimulation: () => void;
}

const SimContext = createContext<SimContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function ts(): string {
  return new Date().toLocaleTimeString('en-IN', { hour12: false });
}

let idCounter = 100;
function nextRideId() {
  return `RIDE-${++idCounter}`;
}
let driverCounter = 0;
function nextDriverId() {
  return `DRIVER-${String(++driverCounter).padStart(2, '0')}`;
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const restored = (() => { try { return loadFromStorage(); } catch { return { log: [], stats: { totalRides: 0, completedRides: 0, cancelledRides: 0 } }; } })();

  const [activityLog, setActivityLog] = useState<ActivityLog[]>(restored.log);
  const [stats, setStats] = useState<Stats>(restored.stats);
  const [version, setVersion] = useState(0);

  const refresh = useCallback((log: ActivityLog[], s: Stats) => {
    setActivityLog(log);
    setStats(s);
    setVersion(v => v + 1);
    saveToStorage(log, s);
  }, []);

  const addLog = useCallback((log: ActivityLog[], message: string, operation: string, complexity: string): ActivityLog[] => {
    const entry: ActivityLog = { id: makeId('LOG'), timestamp: Date.now(), message, operation, complexity };
    return [entry, ...log].slice(0, 100);
  }, []);

  const currentDemand = useCallback((): DemandLevel => {
    const activeRides = queue.size;
    const availableDrivers = Array.from(driverMap.values()).filter(d => d.status === 'Available').length;
    return getDemandFromState(activeRides, availableDrivers);
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRide = useCallback((data: Omit<RideData, 'status' | 'timestamp'>) => {
    const rideData: RideData = { ...data, status: 'Waiting', timestamp: Date.now() };
    const node = queue.enqueue(rideData);
    rideMap.set(rideData.rideId, node);

    setStats(prev => {
      const s = { ...prev, totalRides: prev.totalRides + 1 };
      setActivityLog(prev => {
        const log = addLog(prev, `${rideData.rideId} added to queue | ${rideData.pickup} → ${rideData.drop} | Fare: ₹${rideData.fare}`, 'ENQUEUE', 'O(1)');
        saveToStorage(log, s);
        return log;
      });
      return s;
    });
    setVersion(v => v + 1);
    return rideData.rideId;
  }, [addLog]);

  const cancelRide = useCallback((rideId: string): boolean => {
    const ok = queue.cancelByMap(rideId, rideMap);
    if (!ok) return false;

    setStats(prev => {
      const s = { ...prev, cancelledRides: prev.cancelledRides + 1 };
      setActivityLog(prev => {
        const log = addLog(prev, `${rideId} cancelled | Hash Map lookup → O(1) node removal`, 'CANCEL', 'O(1)');
        saveToStorage(log, s);
        return log;
      });
      return s;
    });
    setVersion(v => v + 1);
    return true;
  }, [addLog]);

  const dispatchNext = useCallback((): { ride: RideData; driver: DriverData } | null | 'no_driver' | 'empty' => {
    if (queue.isEmpty()) return 'empty';
    const available = Array.from(driverMap.values()).find(d => d.status === 'Available');
    if (!available) return 'no_driver';

    const node = queue.dequeue()!;
    node.data.status = 'Matched';
    node.data.assignedDriver = available.driverId;
    available.status = 'Busy';
    available.currentRide = node.data.rideId;
    driverMap.set(available.driverId, { ...available });

    setStats(prev => {
      const s = { ...prev, completedRides: prev.completedRides + 1 };
      setActivityLog(prevLog => {
        const log = addLog(prevLog, `${node.data.rideId} matched with ${available.name} (${available.driverId}) | FIFO dequeue`, 'DEQUEUE', 'O(1)');
        saveToStorage(log, s);
        return log;
      });
      return s;
    });
    setVersion(v => v + 1);
    return { ride: node.data, driver: available };
  }, [addLog]);

  const setDriverStatus = useCallback((driverId: string, status: DriverStatus) => {
    const driver = driverMap.get(driverId);
    if (!driver) return;
    driver.status = status;
    if (status === 'Available') driver.currentRide = undefined;
    driverMap.set(driverId, { ...driver });
    setActivityLog(prev => {
      const log = addLog(prev, `${driverId} status → ${status}`, 'DRIVER_UPDATE', 'O(1)');
      saveToStorage(log, stats);
      return log;
    });
    setVersion(v => v + 1);
  }, [addLog, stats]);

  const addDriver = useCallback((driver: DriverData) => {
    driverMap.set(driver.driverId, driver);
    setActivityLog(prev => {
      const log = addLog(prev, `${driver.name} (${driver.driverId}) added to fleet`, 'DRIVER_ADD', 'O(1)');
      saveToStorage(log, stats);
      return log;
    });
    setVersion(v => v + 1);
  }, [addLog, stats]);

  const removeDriver = useCallback((driverId: string) => {
    driverMap.delete(driverId);
    setVersion(v => v + 1);
  }, []);

  const loadSampleData = useCallback(() => {
    // Clear first
    queue.head = queue.tail = null;
    queue.size = 0;
    rideMap.clear();
    driverMap.clear();
    idCounter = 100;
    driverCounter = 0;

    const sampleDrivers: DriverData[] = [
      { driverId: 'DRIVER-01', name: 'Ravi Kumar', locationX: 5, locationY: 8, status: 'Available', vehicleType: 'Auto' },
      { driverId: 'DRIVER-02', name: 'Suresh M', locationX: 20, locationY: 25, status: 'Available', vehicleType: 'Sedan' },
      { driverId: 'DRIVER-03', name: 'Pradeep R', locationX: 15, locationY: 10, status: 'Available', vehicleType: 'Bike' },
      { driverId: 'DRIVER-04', name: 'Karthik S', locationX: 30, locationY: 20, status: 'Available', vehicleType: 'SUV' },
      { driverId: 'DRIVER-05', name: 'Vijay N', locationX: 10, locationY: 30, status: 'Available', vehicleType: 'Auto' },
    ];
    sampleDrivers.forEach(d => driverMap.set(d.driverId, d));
    driverCounter = 5;

    const sampleRides = [
      { pickup: 'Amrita College', pickupX: 10, pickupY: 15, drop: 'Chennai Central', dropX: 25, dropY: 30 },
      { pickup: 'Chennai Airport', pickupX: 5, pickupY: 5, drop: 'T Nagar', dropX: 20, dropY: 20 },
      { pickup: 'Anna Nagar', pickupX: 15, pickupY: 35, drop: 'Marina Beach', dropX: 35, dropY: 25 },
      { pickup: 'Tambaram', pickupX: 12, pickupY: 8, drop: 'Guindy', dropX: 18, dropY: 15 },
      { pickup: 'Velachery', pickupX: 22, pickupY: 12, drop: 'Adyar', dropX: 28, dropY: 18 },
    ];

    const names = ['Rahul S', 'Priya K', 'Arjun M', 'Neha R', 'Vikram P'];
    const demand: DemandLevel = 'Normal';
    const newStats = { totalRides: 5, completedRides: 0, cancelledRides: 0 };

    sampleRides.forEach((r, i) => {
      idCounter = 100 + i;
      const rideId = `RIDE-${101 + i}`;
      const dist = euclideanDistance(r.pickupX, r.pickupY, r.dropX, r.dropY);
      const fare = calculateFare(dist, demand, 'Auto');
      const data: RideData = {
        rideId, riderName: names[i], pickup: r.pickup, pickupX: r.pickupX, pickupY: r.pickupY,
        drop: r.drop, dropX: r.dropX, dropY: r.dropY, distance: dist, fare,
        demandLevel: demand, surgeMultiplier: 1.0, vehicleType: 'Auto',
        status: 'Waiting', timestamp: Date.now() - (5 - i) * 60000,
      };
      const node = queue.enqueue(data);
      rideMap.set(rideId, node);
    });
    idCounter = 105;

    const log: ActivityLog[] = [
      { id: makeId('LOG'), timestamp: Date.now(), message: 'Sample data loaded — 5 drivers, 5 rides', operation: 'LOAD', complexity: 'O(R+D)' },
    ];
    saveToStorage(log, newStats);
    setActivityLog(log);
    setStats(newStats);
    setVersion(v => v + 1);
  }, []);

  const resetSimulation = useCallback(() => {
    queue.head = queue.tail = null;
    queue.size = 0;
    rideMap.clear();
    driverMap.clear();
    idCounter = 100;
    driverCounter = 0;
    localStorage.removeItem('ridex_data');
    const emptyStats = { totalRides: 0, completedRides: 0, cancelledRides: 0 };
    setActivityLog([]);
    setStats(emptyStats);
    setVersion(v => v + 1);
  }, []);

  return (
    <SimContext.Provider value={{
      queue, rideMap, driverMap,
      activityLog, stats, version,
      currentDemand, addRide, cancelRide, dispatchNext,
      setDriverStatus, addDriver, removeDriver,
      loadSampleData, resetSimulation,
    }}>
      {children}
    </SimContext.Provider>
  );
}

export function useSim() {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error('useSim must be used within SimulationProvider');
  return ctx;
}
