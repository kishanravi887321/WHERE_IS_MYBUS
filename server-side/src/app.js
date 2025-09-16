import  {router as usersRouter} from "./routes/users.routes.js";
import { errorHandler } from "./middleware/errorhandler.middlewares.js";
    
import express from "express";
const app=express();

app.use("/api/users", usersRouter);
app.use(errorHandler);




export {app}