import  {router as usersRouter} from "./routes/users.routes.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorhandler.middlewares.js";
    
import express from "express";
const app=express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/users", usersRouter);
  // to parse the json data coming from the client side
app.use(errorHandler);




export {app}