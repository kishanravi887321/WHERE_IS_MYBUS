import { createOrganization,getOrganizationBuses,checkOrganizationExists} from "../controllers/org.controllers.js";
import { verifyToken } from "../middleware/verifyjwtToken.middlewares.js";
import { Router } from "express";

const router = Router();    
router.route("/create-organization").post(verifyToken, createOrganization);
router.route("/get-buses").get(verifyToken,getOrganizationBuses);
router.route("/check-organization").post(verifyToken,checkOrganizationExists);

export {router};