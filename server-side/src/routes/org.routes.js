import { createOrganization,getOrganizationBuses} from "../controllers/org.controllers.js";

import { Router } from "express";

const router = Router();    
router.route("/create-organization").post(createOrganization);
router.route("/get-bus").get(getOrganizationBuses);



export {router};