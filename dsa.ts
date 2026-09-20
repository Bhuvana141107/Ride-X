export type DemandLevel = 'Low' | 'Normal' | 'High' | 'Very High';
export type RideStatus = 'Waiting' | 'Matched' | 'Cancelled' | 'Completed';
export type DriverStatus = 'Available' | 'Busy';

export interface RideData {
  rideId: string;
  riderName: string;
  pickup: string;
  pickupX: number;
  pickupY: number;
  drop: string;
  dropX: number;
  dropY: number;
  distance: number;
  fare: number;
  demandLevel: DemandLevel;
  surgeMultiplier: number;
  vehicleType: string;
  status: RideStatus;
  timestamp: number;
  assignedDriver?: string;
}

export interface DriverData {
  driverId: string;
  name: string;
  locationX: number;
  locationY: number;
  status: DriverStatus;
  currentRide?: string;
  vehicleType: string;
}

export class RideNode {
  data: RideData;
  prev: RideNode | null = null;
  next: RideNode | null = null;
  constructor(data: RideData) {
    this.data = data;
  }
}

export class DispatchQueue {
  head: RideNode | null = null;
  tail: RideNode | null = null;
  size = 0;

  enqueue(data: RideData): RideNode {
    const node = new RideNode(data);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
    return node;
  }

  dequeue(): RideNode | null {
    if (!this.head) return null;
    const node = this.head;
    if (this.head === this.tail) {
      this.head = this.tail = null;
    } else {
      this.head = this.head.next!;
      this.head.prev = null;
    }
    node.next = null;
    this.size--;
    return node;
  }

  // O(1) cancellation via Hash Map direct node reference
  cancelByMap(rideId: string, rideMap: Map<string, RideNode>): boolean {
    const node = rideMap.get(rideId);
    if (!node) return false;
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = node.next = null;
    this.size--;
    rideMap.delete(rideId);
    return true;
  }

  peek(): RideNode | null { return this.head; }
  isEmpty(): boolean { return this.size === 0; }

  getAllRequests(): RideNode[] {
    const out: RideNode[] = [];
    let cur = this.head;
    while (cur) { out.push(cur); cur = cur.next; }
    return out;
  }
}
