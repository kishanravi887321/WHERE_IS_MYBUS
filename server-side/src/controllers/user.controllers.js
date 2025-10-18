import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import validator from "validator";



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
         console.log("User already exists")
        return res.status(409).json(new ApiResponse(409,null,"user already exist !!")) // Conflict status code
    }

    const user= await User.create({
        username,
        email,
        password
    });
 

    if(!user) throw new ApiError(401,"error while creating the user");

    // Auto-login the user after successful registration
    // Generate the access and refresh tokens
    const accessToken = user.generateAccessToken(user._id);
    const refreshToken = user.generateRefreshToken(user._id);

    console.log(accessToken, "generateAccessToken", "registration successful");
    console.log(refreshToken, "generateRefreshToken", "registration successful");

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userLoggedIn = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        // secure: true,
        sameSite: "Lax",
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, { userLoggedIn, accessToken, refreshToken }, "User registered and logged in successfully!"));
});




const userLogin = asyncHandler(async (req, res) => {
    // ---------steps-------
    // req --> email, password
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Please provide valid email and password");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    const isValidPassword = await user.isPasswordCorrect(password);
    if (!isValidPassword) {
        throw new ApiError(400, "Incorrect password. Please try again");
    }

    // Generate the access and refresh tokens
    const accessToken = user.generateAccessToken(user._id);
    const refreshToken = user.generateRefreshToken(user._id);

    console.log(accessToken, "generateAccessToken", "login successful");
    console.log(refreshToken, "generateRefreshToken", "login successful");

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const userLoggedIn = await User.findById(user._id).select("-password -refreshToken -_id");

    const options = {
        httpOnly: true,
        // secure: true,
        sameSite: "Lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { userLoggedIn, accessToken, refreshToken }, "User logged in successfully!"));
});


// Refresh Access Token using Refresh Token
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is required");
        }

        // Import JWT here to avoid import issues
        const jwt = await import('jsonwebtoken');

        // Verify the refresh token
        const decodedToken = jwt.default.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET || "ravikishan"
        );

        // Find the user by ID from token
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Check if the refresh token matches the one stored in database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new access and refresh tokens
        const accessToken = user.generateAccessToken(user._id);
        const newRefreshToken = user.generateRefreshToken(user._id);

        // Update refresh token in database
        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            // secure: true,
            sameSite: "Lax"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Logout User (Clear tokens)
const logoutUser = asyncHandler(async (req, res) => {
    // Clear the refresh token from database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from document
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        // secure: true,
        sameSite: "Lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});



/// update password --->>  using the refreshToken


const updatePassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;

    console.log("You hit this route:", oldpassword, newpassword);

    // Find the user by email (use email from the token)
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Verify if the old password is correct using bcrypt's compare function
    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
        throw new ApiError(400, "Invalid previous password");
    }

    // check for the strong password
    if(!validator.isStrongPassword(newpassword)){
        throw new ApiError(400, "Please write a strong password!");
    }
    
    user.password = newpassword;

    // Save the updated user with the new hashed password
    await user.save();

    // Send success response
    return res.status(200).json(new ApiResponse(200, null, "Password successfully changed"));
});











export {registerUser,logoutUser,
    userLogin,refreshAccessToken,updatePassword

};