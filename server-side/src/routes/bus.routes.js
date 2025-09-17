import { Router } from "express";
import {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusLocationHistory,
    getActiveBusesStatus,
    searchBuses,
    getBusesByBoardingStop
} from "../controllers/bus.controllers.js";

const router = Router();

// Public routes (no authentication required for passengers)
router.route("/search").get(searchBuses);
router.route("/active").get(getActiveBusesStatus);
router.route("/stop/:stopName").get(getBusesByBoardingStop);
router.route("/").get(getAllBuses);
router.route("/:busId").get(getBusById);
router.route("/:busId/location-history").get(getBusLocationHistory);

// Admin routes (you can add authentication middleware here later)
router.route("/").post(createBus);
router.route("/:busId").put(updateBus);
router.route("/:busId").delete(deleteBus);

export { router };