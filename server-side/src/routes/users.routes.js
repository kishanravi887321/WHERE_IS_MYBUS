import  {Router} from "express";
const router=Router();


// sample route
router.get("/doctor", (req, res) => {
    res.send("Doctor route is working")
})