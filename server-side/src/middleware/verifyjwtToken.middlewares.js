
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { User } from "../models/user.models.js";

dotenv.config({
    path:'../../.env'
})

const verifyToken=(req,res,next)=>{
    const token=req.header('Authorization')?.split(' ')[1]
    console.log("Received token:", token)
    
    if(!token) return res.status(202).json({
        status: 202,
        message: "Access denied - your session has expired, please log in again",
        needsAuth: true
    });

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,async (err,user)=>{
        if(err) {
            // console.log("Token verification error:", err.message);
            
            // If token is expired, suggest refresh
            if(err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 401,
                    message: "Access token expired",
                    needsRefresh: true
                });
            }
            
            return res.status(403).json({
                status: 403,
                message: "Invalid token",
                needsAuth: true
            });
        }

        req.user=user;
        next();
    })
}

// Optional authentication - doesn't block if no token
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
        req.user = null;
        next();
        return;
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log('Optional auth - invalid token, continuing as anonymous:', err.message);
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

export {verifyToken, optionalAuth}