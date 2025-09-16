import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const  registerUser = asyncHandler(async (req,res) => {
    console.log("Register User called with body:", req.body);
    const {username,email,password}=req.body;
    
       if ([username, email, password].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
}


 const existUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existUser) {
         console.log("hekjansd")
        return res.status(409).json(new ApiResponse(409,null,"user already exist !!")) // Conflict status code
    }

    const user= await User.create({
        username,
        email,
        password
    });
 

    if(!user) throw new ApiError(401,"error while creating the user");

      return res.status(201).json(
        new ApiResponse(201, user, "User registered successfully")
    );
});















export {registerUser};