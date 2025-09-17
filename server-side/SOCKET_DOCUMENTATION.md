# Bus Tracking System - Socket Implementation

## Overview
This is a real-time bus tracking system that allows:
- **Drivers** to join bus rooms with unique keys and send location updates
- **Passengers** to join bus rooms and receive real-time location updates
- **Admin** to manage buses via REST API

## Architecture

### Models
1. **Bus Model** (`bus.models.js`)
   - Stores bus information (ID, number, route, driver details)
   - Contains current location and route stops

2. **BusLocation Model** (`busLocation.models.js`)
   - Tracks real-time location updates
   - Stores driver status and passenger count
   - Auto-expires old records (24 hours)

### Socket Services
1. **Driver Service** (`bus.sockets_services.js`)
   - Handles driver authentication and room joining
   - Processes location updates
   - Manages driver online/offline status

2. **Passenger Service** (`client.sockets_services.js`)
   - Allows passengers to join bus rooms
   - Provides real-time location updates
   - Tracks passenger count per bus

## API Endpoints

### Bus Management (REST)
- `GET /api/buses` - Get all buses
- `GET /api/buses/:busId` - Get specific bus details
- `POST /api/buses` - Create new bus (admin)
- `PUT /api/buses/:busId` - Update bus (admin)
- `DELETE /api/buses/:busId` - Delete/deactivate bus (admin)
- `GET /api/buses/:busId/location-history` - Get location history
- `GET /api/buses/active` - Get active buses with live status
- `GET /api/buses/search` - Search buses by route/location

### User Management (existing)
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user
- `POST /api/users/refresh` - Refresh tokens
- `PUT /api/users/password` - Update password

## Socket Events

### Driver Events
```javascript
// Connect and identify as driver
socket.emit('identify', { type: 'driver' });

// Join bus with unique key
socket.emit('driver:join', {
    busId: 'BUS_001',
    driverKey: 'driver_BUS_001_2024',
    driverInfo: { name: 'John Doe', phone: '+1234567890' }
});

// Send location update
socket.emit('driver:location', {
    busId: 'BUS_001',
    location: { latitude: 40.7128, longitude: -74.0060 },
    speed: 25,
    heading: 180,
    accuracy: 5
});

// Go offline
socket.emit('driver:offline', { busId: 'BUS_001' });
```

### Passenger Events
```javascript
// Connect and identify as passenger
socket.emit('identify', { type: 'passenger' });

// Join bus room
socket.emit('passenger:join', {
    busId: 'BUS_001',
    userInfo: { name: 'Jane Doe' }
});

// Request current location
socket.emit('passenger:location:request', { busId: 'BUS_001' });

// Request route information
socket.emit('passenger:route:request', { busId: 'BUS_001' });

// Leave bus tracking
socket.emit('passenger:leave', { busId: 'BUS_001' });
```

### Server Events (Received by clients)

#### Driver Responses
- `driver:joined` - Successfully joined as driver
- `driver:location:sent` - Location update confirmation
- `driver:error` - Error messages
- `driver:displaced` - Another driver took control

#### Passenger Responses
- `passenger:joined` - Successfully joined bus tracking
- `bus:location` - Real-time location updates
- `bus:route` - Route information
- `driver:online/offline` - Driver status changes
- `passenger:error` - Error messages

## Usage Examples

### Setting up a Bus (Admin)
```javascript
// Create a new bus
POST /api/buses
{
    "busId": "BUS_001",
    "busNumber": "101",
    "routeName": "Downtown Express",
    "driverName": "John Smith",
    "driverPhone": "+1234567890",
    "capacity": 50,
    "route": {
        "startPoint": {
            "name": "Central Station",
            "latitude": 40.7589,
            "longitude": -73.9851
        },
        "endPoint": {
            "name": "Airport",
            "latitude": 40.6413,
            "longitude": -73.7781
        },
        "stops": [
            {
                "name": "Downtown Mall",
                "latitude": 40.7505,
                "longitude": -73.9934,
                "order": 1
            }
        ]
    }
}
```

### Driver Integration
```javascript
const socket = io('http://localhost:8000');

// Identify as driver
socket.emit('identify', { type: 'driver' });

// Join bus
socket.emit('driver:join', {
    busId: 'BUS_001',
    driverKey: 'driver_BUS_001_2024',
    driverInfo: { name: 'John Smith' }
});

// Send location every 10 seconds
navigator.geolocation.watchPosition((position) => {
    socket.emit('driver:location', {
        busId: 'BUS_001',
        location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        accuracy: position.coords.accuracy || 0
    });
}, { enableHighAccuracy: true });
```

### Passenger Integration
```javascript
const socket = io('http://localhost:8000');

// Identify as passenger
socket.emit('identify', { type: 'passenger' });

// Join bus tracking
socket.emit('passenger:join', {
    busId: 'BUS_001',
    userInfo: { name: 'Jane Doe' }
});

// Listen for location updates
socket.on('bus:location', (data) => {
    console.log('Bus location:', data.location);
    console.log('Speed:', data.speed);
    console.log('Driver online:', data.driverOnline);
    
    // Update map with new location
    updateMapMarker(data.location);
});

// Listen for driver status
socket.on('driver:online', (data) => {
    console.log('Driver came online:', data.driverInfo);
});

socket.on('driver:offline', (data) => {
    console.log('Driver went offline');
});
```

## Security Features

### Driver Authentication
- Each bus has a unique driver key: `driver_{busId}_2024`
- Only one driver can be active per bus
- Driver displacement when multiple drivers try to connect

### Data Validation
- Location coordinates validation
- Bus ID existence validation
- Passenger authorization for specific bus data

### Rate Limiting & Cleanup
- Automatic cleanup of old location records (24 hours)
- Passenger count tracking
- Connection monitoring and stats

## Environment Variables Required
```bash
PORT=8000
DB_URL=mongodb://localhost:27017/bus_tracking
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start the server:
```bash
npm run dev
```

4. Test socket connections at:
- Driver: `http://localhost:8000` (with driver client)
- Passenger: `http://localhost:8000` (with passenger client)
- API: `http://localhost:8000/api/buses`

## Monitoring & Admin

### Get Active Status
```javascript
GET /api/buses/active
// Returns all active buses with driver status and passenger counts
```

### Admin Socket Connection
```javascript
const adminSocket = io('http://localhost:8000?admin=true');
adminSocket.emit('admin:stats');
adminSocket.on('admin:stats:response', (stats) => {
    console.log('Total connections:', stats.totalConnections);
    console.log('Active rooms:', stats.totalRooms);
});
```

This system provides a robust foundation for real-time bus tracking with proper separation of concerns between drivers and passengers, comprehensive error handling, and scalable architecture.