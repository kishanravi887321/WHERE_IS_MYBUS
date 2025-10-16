import mongoose from 'mongoose';
import { Bus } from './src/models/bus.models.js';
import { Organization } from './src/models/org.models.js';

async function createTestBuses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/BusBuddy');
    console.log('📊 Connected to MongoDB');
    
    // Create/find default organization
    let defaultOrg = await Organization.findOne({ name: 'Test Bus Organization' });
    if (!defaultOrg) {
      defaultOrg = await Organization.create({
        name: 'Test Bus Organization',
        email: 'test@busorg.com',
        phone: '1234567890',
        address: 'Test Address, Test City'
      });
      console.log('✅ Created test organization');
    }
    
    // Clear existing buses
    await Bus.deleteMany({});
    console.log('🗑️ Cleared existing buses');
    
    // Create test buses
    const testBuses = [
      {
        ownerOrg: defaultOrg._id,
        busId: 'BUS22221',
        busNumber: 'DL02PH2004',
        routeName: 'Dehradun ISBT to Vikasnagar via selected stops',
        driverName: 'Chandu Ratan',
        driverPhone: '9871247100',
        secretKey: '1234',
        capacity: 45,
        isActive: true,
        route: {
          startPoint: {
            name: 'Dehradun ISBT',
            latitude: 30.3165,
            longitude: 78.0322
          },
          endPoint: {
            name: 'Vikasnagar',
            latitude: 30.4704,
            longitude: 77.7734
          },
          stops: [
            { name: 'Prem Nagar', latitude: 30.3200, longitude: 78.0400, order: 1 },
            { name: 'Sudhowala', latitude: 30.3350, longitude: 78.0500, order: 2 },
            { name: 'Dhulkot', latitude: 30.3500, longitude: 78.0600, order: 3 },
            { name: 'Sela', latitude: 30.3650, longitude: 78.0700, order: 4 },
            { name: 'Nanda Ki Chowki', latitude: 30.3800, longitude: 78.0800, order: 5 }
          ]
        }
      },
      {
        ownerOrg: defaultOrg._id,
        busId: 'BUS2',
        busNumber: 'DL02PH2005',
        routeName: 'Rajkot to Sikar Express',
        driverName: 'Ravi Kumar',
        driverPhone: '9876543210',
        secretKey: '5678',
        capacity: 50,
        isActive: true,
        route: {
          startPoint: {
            name: 'Sirohi',
            latitude: 24.8854,
            longitude: 72.8638
          },
          endPoint: {
            name: 'Sikar',
            latitude: 27.6094,
            longitude: 75.1399
          },
          stops: [
            { name: 'Mount Abu', latitude: 24.5926, longitude: 72.7156, order: 1 },
            { name: 'Abu Road', latitude: 24.4821, longitude: 72.7828, order: 2 },
            { name: 'Palanpur', latitude: 24.1717, longitude: 72.4386, order: 3 },
            { name: 'Radhanpur', latitude: 23.8333, longitude: 71.6000, order: 4 }
          ]
        }
      },
      {
        ownerOrg: defaultOrg._id,
        busId: 'RJ14PA1234',
        busNumber: 'RJ14PA1234',
        routeName: 'Sirohi to Sikar via stops',
        driverName: 'Mohan Singh',
        driverPhone: '9988776655',
        secretKey: '9999',
        capacity: 40,
        isActive: true,
        route: {
          startPoint: {
            name: 'Sirohi',
            latitude: 24.8854,
            longitude: 72.8638
          },
          endPoint: {
            name: 'Sikar',
            latitude: 27.6094,
            longitude: 75.1399
          },
          stops: [
            { name: 'Pindwara', latitude: 24.7919, longitude: 72.9847, order: 1 },
            { name: 'Reodar', latitude: 24.7167, longitude: 73.0500, order: 2 },
            { name: 'Jalore', latitude: 25.3497, longitude: 72.6350, order: 3 },
            { name: 'Barmer', latitude: 25.7521, longitude: 71.3962, order: 4 }
          ]
        }
      }
    ];
    
    for (const busData of testBuses) {
      const bus = await Bus.create(busData);
      console.log(`✅ Created bus: ${bus.busId} (${bus.busNumber})`);
    }
    
    console.log('\n🎉 Test buses created successfully!');
    
    // Test fuzzy search
    console.log('\n🔍 Testing data in database...');
    const testBuses2 = await Bus.find({ isActive: true }).lean();
    console.log(`📊 Found ${testBuses2.length} active buses`);
    
    testBuses2.forEach(bus => {
      console.log(`\n  🚌 ${bus.busId} (${bus.busNumber})`);
      console.log(`     Route: ${bus.route.startPoint?.name} → ${bus.route.endPoint?.name}`);
      if (bus.route.stops && bus.route.stops.length > 0) {
        console.log(`     Stops: ${bus.route.stops.map(s => s.name).join(', ')}`);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestBuses();
