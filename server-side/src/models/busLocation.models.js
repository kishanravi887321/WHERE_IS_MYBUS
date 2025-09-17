import mongoose, { Schema } from "mongoose";

const busLocationSchema = new Schema({
    busId: {
        type: String,
        required: true,
        ref: 'Bus'
    },
    location: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    speed: {
        type: Number,
        default: 0,
        min: 0
    },
    heading: {
        type: Number,
        default: 0,
        min: 0,
        max: 360
    },
    accuracy: {
        type: Number,
        default: 0
    },
    driverSocketId: {
        type: String,
        default: null
    },
    isDriverOnline: {
        type: Boolean,
        default: false
    },
    connectedPassengers: {
        type: Number,
        default: 0
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

// TTL index - automatically delete documents older than 24 hours
busLocationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Index for faster queries
busLocationSchema.index({ busId: 1 });
busLocationSchema.index({ lastSeen: 1 });
busLocationSchema.index({ isDriverOnline: 1 });

// Static method to get latest location for a bus
busLocationSchema.statics.getLatestLocation = async function(busId) {
    return await this.findOne({ busId }).sort({ createdAt: -1 });
};

// Static method to update or create location
busLocationSchema.statics.updateLocation = async function(busId, locationData) {
    return await this.findOneAndUpdate(
        { busId },
        { 
            ...locationData,
            lastSeen: new Date()
        },
        { 
            upsert: true, 
            new: true,
            runValidators: true
        }
    );
};

export const BusLocation = mongoose.model("BusLocation", busLocationSchema);