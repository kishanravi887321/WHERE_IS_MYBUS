import  {router as usersRouter} from "./routes/users.routes.js";
    
import express from "express";
const app=express();

app.use("/api/users", usersRouter);



export {app}