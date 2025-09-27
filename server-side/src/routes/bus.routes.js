import { Router } from "express";
import {
    createBus,
    getAllBuses,
    getBusById,
    updateBus,
    deleteBus,
    getBusLocationHistory,
    makeTheBusRoute,
    getActiveBusesStatus,
    searchBuses,
    getBusesByBoardingStop,
    MakeTheBusActive,
    getBusesFromStopToStop,
    updatePaassenger,
    makethebusInactive
} from "../controllers/bus.controllers.js";

const router = Router();

// Public routes (no authentication required for passengers)
router.route("/search").get(searchBuses);
router.route("/active").get(getActiveBusesStatus);
router.route("/make-route").post(makeTheBusRoute);
router.route("/stop/:stopName").get(getBusesByBoardingStop);
router.route("/route/:fromStop/:toStop").get(getBusesFromStopToStop);
router.route("/").get(getAllBuses);
router.route("/make-active").post(MakeTheBusActive);
router.route("/make-inactive").post(makethebusInactive);
router.route("/:busId").get(getBusById);
router.route("/:busId/location-history").get(getBusLocationHistory);
router.route("/update-passenger-count").post(updatePaassenger);

// Admin routes (you can add authentication middleware here later)
router.route("/").post(createBus);
router.route("/:busId").put(updateBus);
router.route("/:busId").delete(deleteBus);

export { router };