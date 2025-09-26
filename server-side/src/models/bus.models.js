import mongoose, { Schema } from "mongoose";
import { Organization } from "./org.models.js";

const busSchema = new Schema({
//    ownerOrg: {
//     type: Schema.Types.ObjectId,
//     ref: "Organization",
//     required: true
//   },
    busId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    busNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    routeName: {
        type: String,
        required: true,
        trim: true
    },
    driverName: {
        type: String,
        required: true,
        trim: true
    },
    driverPhone: {
        type: String,
        required: true,
        trim: true
    },
    secretKey: {
        type: String,
        required: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        lastUpdated: { type: Date, default: Date.now }
    },
    route: {
        startPoint: {
            name: String,
            latitude: Number,
            longitude: Number
        },
        endPoint: {
            name: String,
            latitude: Number,
            longitude: Number
        },
        stops: [{
            name: String,
            latitude: Number,
            longitude: Number,
            order: Number
        }],
        // Store full recorded coordinates here
        routeCoordinates: [{
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            timestamp: { type: Date, default: Date.now }
        }]
    }
}, { 
    timestamps: true 
});

// Index for faster queries
busSchema.index({ busId: 1 });
busSchema.index({ busNumber: 1 });
busSchema.index({ isActive: 1 });

export const Bus = mongoose.model("Bus", busSchema);
