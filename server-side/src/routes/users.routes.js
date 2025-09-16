import  {Router} from "express";
import { verifyToken } from "../middleware/verifyjwtToken.middlewares.js";
import { registerUser
,logoutUser,
    userLogin,refreshAccessToken,updatePassword
 } from "../controllers/user.controllers.js";
const router=Router();


// sample route
router.get("/doctor/", (req, res) => {
    res.send("Doctor route is working")
})

router.route("/register").post(registerUser);


router.route("/login").post(userLogin)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/logout").post(verifyToken, logoutUser)

router.route("/changepassword").put(verifyToken,updatePassword)


export {router}