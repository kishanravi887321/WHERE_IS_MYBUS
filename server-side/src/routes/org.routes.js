import { createOrganization } from "../controllers/org.controllers.js";

import { Router } from "express";

const router = Router();    
router.route("/create-organization").post(createOrganization);



export {router};