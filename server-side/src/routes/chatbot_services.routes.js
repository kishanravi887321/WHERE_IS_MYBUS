import { Router} from "express";
import { upload } from "../middleware/multer.middlewares.js";
import { verifyToken } from "../middleware/verifyjwtToken.middlewares.js";
import { processAudio } from "../chatbot_services/base.chatbot_services.js";
import { searchBus } from "../testes/x.js";

const router = Router();
router.post("/transcribe", upload.single("audio"), verifyToken, processAudio);
router.get("/search-bus", searchBus);
export { router };
