# 🚌 BusBuddy - Real-Time Bus Tracking System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-busbuddy--ui.onrender.com-blue)](https://busbuddy-ui.onrender.com)
[![Backend API](https://img.shields.io/badge/Backend%20API-where--is--mybus.onrender.com-green)](https://where-is-mybus.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-blue)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Upstash-red)](https://upstash.com)

A comprehensive real-time bus tracking system designed for tier-2 and tier-3 cities, providing seamless communication between drivers and passengers through WebSocket connections and RESTful APIs.

## 🎯 Features

### For Passengers
- 🔍 **Smart Bus Search** - Find buses between any two stops
- 📍 **Real-time Tracking** - Live location updates with interactive maps
- 📱 **Mobile-First Design** - Responsive PWA with offline support
- 🕒 **Live ETAs** - Accurate arrival time predictions
- 📊 **Route Information** - Complete stop-by-stop journey details

### For Drivers
- 🚌 **Driver Dashboard** - Professional control panel for trip management
- 📍 **Location Broadcasting** - Automatic GPS location sharing
- 🔐 **Secure Authentication** - Token-based driver verification
- 👥 **Passenger Analytics** - Real-time passenger count tracking
- 🔄 **Trip Management** - Start/stop trip controls with status updates

### Technical Features
- ⚡ **Real-time Communication** - WebSocket-based live updates
- 🗄️ **Hybrid Storage** - MongoDB for persistence + Redis for caching
- 🔒 **Secure APIs** - JWT authentication with role-based access
- 📡 **Socket Authentication** - Multi-layer security for real-time connections
- 🌐 **Cross-Platform** - Works on web, mobile, and desktop

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        PW[Passenger Web App]
        DW[Driver Web App]
        PM[Passenger Mobile]
        DM[Driver Mobile]
    end

    subgraph "Load Balancer & CDN"
        LB[Load Balancer]
        CDN[Content Delivery Network]
    end

    subgraph "Backend Services"
        API[Express.js API Server]
        WS[Socket.IO WebSocket Server]
        AUTH[JWT Authentication Service]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas)]
        REDIS[(Redis - Upstash)]
        CACHE[Memory Cache]
    end

    subgraph "External Services"
        MAPS[Map Services - Leaflet/OSRM]
        GEO[Geolocation API]
    end

    PW --> LB
    DW --> LB
    PM --> LB
    DM --> LB
    
    LB --> CDN
    LB --> API
    LB --> WS
    
    API --> AUTH
    WS --> AUTH
    
    API --> MONGO
    API --> REDIS
    WS --> REDIS
    WS --> CACHE
    
    PW --> MAPS
    DW --> GEO
    PM --> MAPS
    DM --> GEO
```

---

## 🔌 Socket.IO Event Flow

```mermaid
sequenceDiagram
    participant D as Driver Client
    participant S as Socket.IO Server
    participant R as Redis Cache
    participant P as Passenger Client

    Note over D,P: Driver Connection Flow
    D->>S: connect()
    S->>D: connection established
    D->>S: identify({type: "driver", token: "123456", busId: "BUS001"})
    S->>R: validate token
    R->>S: token valid
    S->>D: identify:success
    D->>S: driver:join({busId, driverInfo})
    S->>R: cache driver session
    S->>D: driver:joined
    S->>P: driver:online (broadcast to passengers)

    Note over D,P: Real-time Location Updates
    loop Every 5 seconds
        D->>S: driver:location({busId, location, speed, heading})
        S->>R: cache location data
        S->>P: bus:location (broadcast to all passengers in bus room)
        S->>D: driver:location:sent (confirmation)
    end

    Note over D,P: Passenger Connection Flow
    P->>S: connect()
    S->>P: connection established
    P->>S: identify({type: "passenger"})
    S->>P: identify:success
    P->>S: passenger:join({busId, passengerInfo})
    S->>R: cache passenger session
    S->>P: passenger:joined
    P->>S: passenger:location:request({busId})
    S->>R: get current location
    S->>P: bus:location (current location data)

    Note over D,P: Disconnection Handling
    D->>S: disconnect()
    S->>R: remove driver from cache
    S->>P: driver:offline (notify passengers)
```

---

## 🛣️ API Routes Overview

```mermaid
graph LR
    subgraph "User Routes (/api/users)"
        UR1[POST /register]
        UR2[POST /login]
        UR3[POST /logout]
        UR4[POST /refresh-token]
        UR5[PUT /changepassword]
    end

    subgraph "Bus Routes (/api/buses)"
        BR1[GET /search]
        BR2[GET /active]
        BR3[GET /stop/:stopName]
        BR4[GET /route/:from/:to]
        BR5[POST /make-active]
        BR6[GET /:busId]
        BR7[GET /:busId/location-history]
        BR8[POST /]
        BR9[PUT /:busId]
        BR10[DELETE /:busId]
    end

    subgraph "Socket Events"
        SE1[identify]
        SE2[driver:join]
        SE3[driver:location]
        SE4[passenger:join]
        SE5[passenger:location:request]
        SE6[passenger:route:request]
    end

    ROOT[🚌 BusBuddy API] --> UR1
    ROOT --> BR1
    ROOT --> SE1
```

---

## 📊 Socket.IO Events Documentation

### 🚗 Driver Events

#### Authentication & Connection
```javascript
// 1. Connect and identify
socket.emit('identify', {
    type: 'driver',
    token: '123456',    // 6-digit OTP from /make-active API
    busId: 'BUS001'
});

// 2. Join bus room
socket.emit('driver:join', {
    busId: 'BUS001',
    driverInfo: {
        name: 'John Smith',
        phone: '+1234567890'
    }
});
```

#### Location Updates
```javascript
// 3. Send real-time location (every 5-10 seconds)
socket.emit('driver:location', {
    busId: 'BUS001',
    location: {
        latitude: 40.7128,
        longitude: -74.0060
    },
    speed: 25,        // km/h
    heading: 180,     // degrees (0-360)
    accuracy: 5       // meters
});
```

#### Driver Event Responses
```javascript
socket.on('identify:success', () => {});
socket.on('driver:joined', (data) => {});
socket.on('driver:location:sent', (data) => {});
socket.on('driver:error', (error) => {});
socket.on('driver:displaced', (data) => {}); // Another driver took control
```

### 👥 Passenger Events

#### Connection & Bus Tracking
```javascript
// 1. Connect and identify
socket.emit('identify', { type: 'passenger' });

// 2. Join bus tracking
socket.emit('passenger:join', {
    busId: 'BUS001',
    passengerInfo: {
        name: 'Jane Doe',
        boarding_stop: 'Central Station',
        destination_stop: 'Airport'
    }
});

// 3. Request current location
socket.emit('passenger:location:request', { busId: 'BUS001' });

// 4. Request route information
socket.emit('passenger:route:request', { busId: 'BUS001' });
```

#### Passenger Event Responses
```javascript
socket.on('passenger:joined', (data) => {
    // Bus info, current location, passenger count
});

socket.on('bus:location', (data) => {
    // Real-time location updates
    console.log('Bus at:', data.location);
    console.log('Speed:', data.speed);
    console.log('Timestamp:', data.timestamp);
});

socket.on('driver:online', (data) => {
    // Driver came online
});

socket.on('driver:offline', (data) => {
    // Driver went offline
});

socket.on('bus:route', (data) => {
    // Route information with stops
});
```

---

## 🗄️ Data Models

### Bus Model
```javascript
{
    ownerEmail: String,
    busId: String,           // Unique identifier
    busNumber: String,       // Display number
    routeName: String,       // Route description
    driverName: String,
    driverPhone: String,
    secretKey: String,       // Driver authentication
    capacity: Number,
    isActive: Boolean,
    currentLocation: {
        latitude: Number,
        longitude: Number,
        lastUpdated: Date
    },
    route: {
        startPoint: { name, latitude, longitude },
        endPoint: { name, latitude, longitude },
        stops: [{ name, latitude, longitude, order }]
    }
}
```

### BusLocation Model (Real-time tracking)
```javascript
{
    busId: String,
    location: {
        latitude: Number,
        longitude: Number
    },
    speed: Number,
    heading: Number,
    accuracy: Number,
    driverSocketId: String,
    isDriverOnline: Boolean,
    connectedPassengers: Number,
    lastSeen: Date,
    // Auto-expires after 24 hours
    expiresAt: Date
}
```

### User Model
```javascript
{
    username: String,
    email: String,
    password: String,        // Bcrypt hashed
    accessToken: String,
    refreshToken: String
}
```

---

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layers"
        L1[Client Connection]
        L2[Socket.IO Handshake]
        L3[Driver Token Validation]
        L4[Redis Token Storage]
        L5[JWT for REST APIs]
    end

    subgraph "Authorization Levels"
        AL1[Public - Passenger Access]
        AL2[Driver - Bus Control]
        AL3[Admin - Bus Management]
    end

    subgraph "Data Protection"
        DP1[Input Validation]
        DP2[Rate Limiting]
        DP3[CORS Configuration]
        DP4[Environment Variables]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> AL2
    L5 --> AL3
    
    AL1 --> DP1
    AL2 --> DP2
    AL3 --> DP3
```

### Security Features

1. **Driver Authentication**
   - 6-digit OTP tokens generated via `/make-active` API
   - Redis-cached token validation
   - Single driver per bus enforcement
   - Automatic driver displacement

2. **Socket Security**
   - Connection-level identification required
   - Room-based access control
   - Input validation for all events
   - Automatic cleanup of stale connections

3. **API Security**
   - JWT-based authentication for admin routes
   - Request validation middleware
   - CORS configuration
   - Rate limiting protection

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Redis (Upstash) account
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/kishanravi887321/WHERE_IS_MYBUS.git
cd WHERE_IS_MYBUS/server-side
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create `.env` file in the server-side directory:
```env
PORT=8000
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/busbuddy
REDIS_URL=redis://username:password@host:port
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### Frontend Setup (Next.js)

1. **Navigate to frontend**
```bash
cd BusBuddy  # or client-side for Vite version
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

4. **Start development server**
```bash
npm run dev
```

---

## 📱 Usage Examples

### Driver Integration
```javascript
import { io } from 'socket.io-client';

const socket = io('https://where-is-mybus.onrender.com');

// Step 1: Activate bus and get token
const response = await fetch('/api/buses/make-active', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busId: 'BUS001', secretKey: 'driver_secret' })
});
const { token } = await response.json();

// Step 2: Connect via socket
socket.emit('identify', { type: 'driver', token, busId: 'BUS001' });

socket.on('identify:success', () => {
    socket.emit('driver:join', {
        busId: 'BUS001',
        driverInfo: { name: 'John Driver' }
    });
});

// Step 3: Send location updates
navigator.geolocation.watchPosition((position) => {
    socket.emit('driver:location', {
        busId: 'BUS001',
        location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
    });
});
```

### Passenger Integration
```javascript
const socket = io('https://where-is-mybus.onrender.com');

// Join bus tracking
socket.emit('identify', { type: 'passenger' });
socket.emit('passenger:join', { busId: 'BUS001' });

// Listen for location updates
socket.on('bus:location', (data) => {
    console.log('Bus location:', data.location);
    console.log('Speed:', data.speed + ' km/h');
    console.log('Driver online:', data.driverOnline);
    
    // Update map marker
    updateMapMarker(data.location);
});

// Listen for driver status
socket.on('driver:online', (data) => {
    console.log('Driver came online:', data.driverInfo.name);
});
```

---

## 🔧 API Endpoints

### Bus Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/buses` | Get all buses | No |
| `GET` | `/api/buses/search` | Search buses by route | No |
| `GET` | `/api/buses/active` | Get active buses with live status | No |
| `GET` | `/api/buses/route/:from/:to` | Find buses between stops | No |
| `POST` | `/api/buses/make-active` | Activate bus & generate driver token | No |
| `GET` | `/api/buses/:busId` | Get specific bus details | No |
| `POST` | `/api/buses` | Create new bus | Yes |
| `PUT` | `/api/buses/:busId` | Update bus information | Yes |
| `DELETE` | `/api/buses/:busId` | Delete bus | Yes |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/users/register` | Register new user | No |
| `POST` | `/api/users/login` | User login | No |
| `POST` | `/api/users/logout` | User logout | Yes |
| `POST` | `/api/users/refresh-token` | Refresh access token | No |
| `PUT` | `/api/users/changepassword` | Change password | Yes |

---

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active socket connections
- Buses currently online
- Passengers tracking per bus
- Location update frequency
- Socket room management

### Data Insights
- Popular routes analysis
- Peak usage times
- Driver performance metrics
- Passenger behavior patterns

### Health Monitoring
```bash
# Server health check
curl https://where-is-mybus.onrender.com/

# Database connectivity
curl https://where-is-mybus.onrender.com/api/buses/active

# Socket.IO status
# Connect to wss://where-is-mybus.onrender.com and emit 'admin:stats'
```

---

## 🌐 Deployment

### Backend (Render.com)
- **URL**: https://where-is-mybus.onrender.com
- **Environment**: Node.js 20.x
- **Database**: MongoDB Atlas
- **Cache**: Redis (Upstash)
- **WebSocket**: Socket.IO with sticky sessions

### Frontend (Render.com)
- **URL**: https://busbuddy-ui.onrender.com
- **Framework**: Next.js 14
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=8000
DB_URL=mongodb+srv://...
REDIS_URL=redis://...
ACCESS_TOKEN_SECRET=production_secret
REFRESH_TOKEN_SECRET=production_refresh_secret
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Add tests for new features
- Update documentation
- Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Kishan Ravi** - *Full Stack Developer* - [@kishanravi887321](https://github.com/kishanravi887321)

---

## 🔗 Links

- [Live Demo](https://busbuddy-ui.onrender.com) - Frontend Application
- [API Documentation](https://where-is-mybus.onrender.com) - Backend API
- [Project Repository](https://github.com/kishanravi887321/WHERE_IS_MYBUS) - Source Code

---

## 📞 Support

For support, email support@busbuddy.com or join our Slack channel.

---

*Built with ❤️ for smarter public transportation*