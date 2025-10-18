import  {router as usersRouter} from "./routes/users.routes.js";
import  {router as busRouter} from "./routes/bus.routes.js";
import  {router as orgRouter} from "./routes/org.routes.js";
import  {router as translateRouter} from "./routes/translate.routes.js";
import { router as transcriptionRouter  } from "./routes/chatbot_services.routes.js";
import translationDemoRouter from "./test/translation-demo.js";
import { verifyToken } from "./middleware/verifyjwtToken.middlewares.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorhandler.middlewares.js";
    
import express from "express";
const app=express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/buses", busRouter);
app.use("/api/orgs", orgRouter);
app.use("/api/chatbot", transcriptionRouter);
app.use("/api/translate", translateRouter);
app.use("/api/demo", translationDemoRouter);

app.get('/' ,verifyToken,(req, res) => {
  console.log('chekd from hoem')
    res.send("hello from where is my bus  sockets+express server");
});
app.get('/activate' , (req, res) => {
  console.log('hello')
    res.send("server is activation successful");
});
  // to parse the json data coming from the client side
app.use(errorHandler);




export {app}