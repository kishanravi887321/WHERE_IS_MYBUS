import {app} from "./app.js";
import dotenv from "dotenv";
import  connectDB from "./db/index.db.js";
dotenv.config({path:'../.env'});



const startServer = async () => {
  try {
    // connect MongoDB
    await connectDB();

    // connect Redis
    

    // start server after both are connected
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed", err);
  }
};

startServer();