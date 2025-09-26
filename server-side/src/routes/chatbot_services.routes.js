import { Router} from "express";
import { upload } from "../middleware/multer.middlewares.js";
import { transcribeAudio } from "../chatbot_services/transcript.chatbot_services.js";

const router = Router();
router.post("/transcribe", upload.single("audio"), transcribeAudio);

export { router };
