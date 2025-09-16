import  {Router} from "express";
import { registerUser } from "../controllers/user.controllers.js";
const router=Router();


// sample route
router.get("/doctor/", (req, res) => {
    res.send("Doctor route is working")
})

router.route("/register").post(registerUser);


export {router}