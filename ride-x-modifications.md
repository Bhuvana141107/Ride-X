IMPORTANT — EXISTING PROJECT MODIFICATION ONLY

This is an existing working RIDE-X React/TypeScript project.

DO NOT rebuild the project from scratch.
DO NOT replace the existing DSA implementation with a simplified or fake version.
First inspect and understand the existing codebase, especially:

- src/lib/dsa.ts
- SimulationStore / simulation state
- RideNode
- DispatchQueue
- rideMap
- driverMap
- booking pages
- dashboard pages
- pricing logic
- routing
- localStorage
- algorithm visualization components

Make only the changes requested below while preserving all existing working functionality.

==================================================
1. PRESERVE THE EXISTING DSA IMPLEMENTATION
==================================================

The following must remain actual working implementations:

- Doubly Linked List
- RideNode with prev and next
- head and tail
- DispatchQueue
- FIFO enqueue
- FIFO dequeue
- rideMap storing rideId → RideNode
- O(1)-average cancellation using direct RideNode access
- driverMap for driver availability
- driver matching
- dynamic pricing
- activity log
- algorithm visualization
- localStorage persistence
- shared simulation state

DO NOT replace the Doubly Linked List with an array.

DO NOT create fake/static DSA visualizations.

When a rider creates a ride, it must go through the actual existing queue logic.

When a rider cancels, it must remove the actual node from the existing Doubly Linked List using the existing Hash Map/node reference mechanism.

==================================================
2. CHANGE LOCATION INPUT — USER-FRIENDLY PLACES
==================================================

Currently the system uses coordinates for pickup and destination.

DO NOT ask normal customers to manually enter latitude and longitude.

Customers generally know place names, not coordinate values.

Change the customer-facing booking interface to use recognizable place names.

For example:

Pickup Location
[ Select or enter a place ]

Destination
[ Select or enter a place ]

The customer should be able to choose locations such as:

- Amrita College
- Chennai Central
- Chennai Airport
- T Nagar
- Anna Nagar
- Marina Beach
- Tambaram
- Guindy
- Velachery
- Adyar

Use a predefined set of realistic demo locations if a real maps/geocoding service is not already present.

==================================================
3. KEEP COORDINATES INTERNALLY
==================================================

IMPORTANT:

Do NOT remove coordinates from the underlying algorithm.

The selected place should internally map to coordinates.

Example:

Amrita College → { x: ..., y: ... }
Chennai Central → { x: ..., y: ... }

The customer sees:

Pickup: Amrita College
Destination: Chennai Central

The system internally obtains the corresponding coordinates and uses them for:

- Euclidean distance calculation
- fare calculation
- dynamic pricing

The coordinates should not be required as manual customer input.

If the existing project already has coordinate data, reuse it instead of creating unnecessary duplicate systems.

==================================================
4. DISPLAY DISTANCE TO THE RIDER
==================================================

After the rider selects pickup and destination, show:

Pickup
Destination
Distance
Current demand
Estimated fare

Example:

Pickup:
Amrita College

Destination:
Chennai Central

Distance:
8.4 km

Current Demand:
High

Estimated Fare:
₹245

[Accept & Book Ride]

The distance should be calculated using the existing pricing/distance logic.

Do not fake the distance.

==================================================
5. DEMAND LEVEL MUST BE AUTOMATIC
==================================================

The rider MUST NOT manually select:

- Low demand
- Medium demand
- High demand

Remove any customer-facing demand dropdown or manual demand selector if one currently exists.

Demand must be determined automatically by the system using the current simulation state.

Use relevant existing data such as:

- number of active ride requests
- number of available drivers

The system should determine whether demand is Low, Medium, or High according to the existing/project logic.

The customer only enters/selects:

- Pickup
- Destination
- Vehicle type, if already supported

The system calculates:

Pickup + Destination
↓
Internal coordinates
↓
Distance
↓
Current demand
↓
Dynamic fare
↓
Customer accepts/rejects fare
↓
Actual DispatchQueue enqueue

Do not allow the customer to control the demand value.

==================================================
6. DYNAMIC PRICING
==================================================

Preserve the existing dynamic pricing implementation.

The fare should continue to use:

- calculated distance
- demand/surge factor
- vehicle factor if already implemented
- existing pricing formula

Do not replace the existing pricing algorithm unnecessarily.

If the existing code has demand multipliers, continue using them.

The demand value should come from the system rather than user input.

==================================================
7. RIDER EXPERIENCE
==================================================

The rider-facing booking page should feel like a real ride-booking application.

The rider should see:

Pickup Location
Destination
Vehicle Type (if already supported)
Distance
Current Demand
Estimated Fare

Then:

[Accept & Book Ride]

After booking, show:

- Ride ID
- Current status
- Queue position
- Estimated fare
- Pickup
- Destination
- Cancellation option

Do not expose unnecessary technical fields such as:

Latitude
Longitude
prev
next
head
tail
Hash Map

Those belong in the operations/algorithm visualization area.

==================================================
8. OPERATIONS / DSA VIEW
==================================================

Keep the technical DSA visualization available for the Operations/Dispatch Control side.

The operations interface should still show:

- Active requests
- Dispatch Queue
- FIFO order
- Doubly Linked List visualization
- HEAD
- TAIL
- Ride nodes
- prev / next relationships
- Hash Map information
- Driver availability
- Driver matching
- Cancellation
- Activity Log
- Algorithm Visualization
- Complexity Analysis

This technical information should not be removed just because the rider interface is being simplified.

==================================================
9. LOGIN AND DASHBOARD STRUCTURE
==================================================

Keep the previously requested RIDE-X entry experience.

Landing page:

RIDE-X

"Smart Dispatch for Every Journey"

Primary button:

[ Start a Journey ]

Secondary option:

⚙ Operations

Do NOT use obvious:

"User Login"
"Admin Login"

==================================================
10. RIDER LOGIN
==================================================

Rider authentication page:

Welcome Back

Email / ID
Password

[ Login ]

[ Create Account ]

Demo account:

rider@ridex.demo
rider123

After successful rider login:

→ Rider Dashboard

==================================================
11. OPERATIONS LOGIN
==================================================

Operations authentication page:

Dispatch Control

Authorized operations access

Operations ID
Password

[ Enter Control Center ]

Demo account:

OPS-001
control123

After successful login:

→ Operations / Dispatch Control Dashboard

Do not use "Admin" terminology.

==================================================
12. SHARED SIMULATION STATE
==================================================

VERY IMPORTANT:

The rider dashboard and operations dashboard must use the SAME underlying simulation state.

Example:

Rider:
Creates ride

↓

Actual DispatchQueue.enqueue()

↓

Ride is added to the actual Doubly Linked List

↓

rideMap stores rideId → RideNode

↓

Operations dashboard immediately sees the same request

↓

If rider cancels:

rideMap.get(rideId)

↓

actual RideNode is removed from DLL

↓

Operations dashboard updates

Do NOT create separate fake data for rider and operations dashboards.

==================================================
13. FIFO DISPATCH
==================================================

Preserve strict FIFO behavior.

When Operations selects:

[ Dispatch Next ]

the system should use the actual queue dequeue operation.

The earliest active request should be processed first.

After matching:

- ride status updates
- driver becomes Busy
- queue updates
- activity log updates
- rider view updates

==================================================
14. CANCELLATION
==================================================

Preserve real cancellation behavior.

Cancellation must:

1. Find the ride through rideMap
2. Obtain the actual RideNode
3. Remove that node from the Doubly Linked List
4. Update rideMap
5. Update the shared simulation state
6. Update the rider dashboard
7. Update the operations dashboard
8. Add an activity-log entry

Do not simply hide the ride from the UI.

==================================================
15. DESIGN
==================================================

Keep the existing RIDE-X visual identity and improve the UI where necessary.

Use a professional mobility/ride-sharing dashboard style.

The rider interface should be simple and customer-friendly.

The operations interface can be more technical and data-rich.

Use:

- clean cards
- clear buttons
- readable typography
- responsive layout
- professional navigation
- clear status badges
- attractive but not excessive animations

Do not sacrifice functionality for visual design.

==================================================
16. TECHNICAL ACCURACY
==================================================

Do not claim an operation is O(1) if the existing implementation actually performs a linear search.

Keep complexity information technically accurate.

For example, if the existing nearest-driver matching loops through all drivers, represent that appropriately as O(D).

Preserve the actual implementation rather than changing code merely to make the complexity table look better.

==================================================
17. DO NOT BREAK EXISTING FEATURES
==================================================

Before modifying anything, inspect the existing code.

Do not remove:

- existing pages
- existing navigation
- DSA visualizations
- queue operations
- driver management
- pricing
- activity logs
- localStorage
- simulation state

unless absolutely necessary for the requested changes.

Make minimum necessary changes.

==================================================
18. TEST EVERYTHING AFTER MODIFICATION
==================================================

After making the changes, test these complete flows:

TEST 1 — RIDER BOOKING

1. Open RIDE-X
2. Click Start a Journey
3. Login as rider
4. Select pickup using a place name
5. Select destination using a place name
6. Verify coordinates are handled internally
7. Verify distance is calculated
8. Verify demand is automatically determined
9. Verify fare is dynamically calculated
10. Accept the fare
11. Verify ride enters the actual DispatchQueue

TEST 2 — OPERATIONS

1. Logout
2. Open Operations
3. Login using OPS-001 / control123
4. Verify the same rider request appears
5. Verify it appears in the actual FIFO queue
6. Verify the Doubly Linked List visualization updates

TEST 3 — CANCELLATION

1. Create another ride
2. Cancel it from the rider side
3. Verify the actual DLL node is removed
4. Verify rideMap is updated
5. Verify operations dashboard updates
6. Verify activity log updates

TEST 4 — DISPATCH

1. Create multiple rides
2. Confirm FIFO order
3. Click Dispatch Next
4. Verify the earliest request is dispatched
5. Verify driver status changes appropriately
6. Verify queue updates

TEST 5 — REFRESH

1. Create rides
2. Refresh the page
3. Verify the existing simulation state persists through localStorage
4. Verify the DLL is reconstructed correctly if that is how the existing project works

==================================================
FINAL REQUIREMENT
==================================================

This is NOT a request to create a new ride-sharing website from scratch.

This is an existing RIDE-X DSA project that needs a more realistic and user-friendly customer experience.

The most important requirements are:

1. Preserve the actual DSA implementation.
2. Do not manually ask customers for coordinates.
3. Let customers select/enter recognizable place names.
4. Map those places to internal coordinates.
5. Continue using those coordinates for Euclidean distance and fare calculation.
6. Automatically determine demand from the simulation state.
7. Never ask the rider to manually choose Low/Medium/High demand.
8. Keep the rider and operations dashboards connected to the same simulation state.
9. Preserve FIFO dispatch, instant cancellation, Hash Map lookup, Doubly Linked List operations, driver tracking, dynamic pricing, visualizations, and localStorage.
10. Make the final application look polished and professional while keeping the underlying DSA technically genuine.