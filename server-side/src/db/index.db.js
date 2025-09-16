import mongoose from "mongoose";

const connectDB =async ()=> {
    const DB_URL=process.env.DB_URL;
    console.log("DB_URL in index.db.js file",DB_URL)
    // console.log(process.env.DB_URL)

    try {
        // console.log(process.env.DB_URL)
       const connectionInstance= await mongoose.connect(`${DB_URL}`)

       

       console.log("\n Db connected succsessfully connection HOST::")

       
        
    } catch (error) {
        console.log("error while connecting",error)
        process.exit(1)
    }
}

export  default  connectDB