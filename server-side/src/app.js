import  {router as usersRouter} from "./routes/users.routes.js";
import { errorHandler } from "./middleware/errorhandler.middlewares.js";
    
import express from "express";
const app=express();
app.use(express.json());
app.use("/api/users", usersRouter);
  // to parse the json data coming from the client side
app.use(errorHandler);




export {app}