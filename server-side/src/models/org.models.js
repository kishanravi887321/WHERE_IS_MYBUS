import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

import dotenv from "dotenv";


dotenv.config({
    path: "../../.env"

})


const orgSchema =new Schema({

    
    email:{
        type:String,
        required :true,
        unique:true,
        lowcase:true
    },
    orgName:{
        required:false,
        type :String,

    },
    phoneNumber:{
        type:String,
        required :true
    },
    city:{
        type:String,
        required :false
    },
   state:{
       type:String,
       required :false
   },
    website_url:{
        type:String,
        required :false
    },
    location_url:{
        type:String,
        required :false
    },
    password:{
        type:String,
        required:[true,"password is required"]

    }
   ,
    

},{Timestamps:true})

////  adding the middleware that restircts the passwords, refreshtkn,accesstkn to being the populated 
// Remove password field from the response when converting to JSON
orgSchema.set("toJSON",{
    transform:(doc,result,options)=>{  /// doc == mongoose doccument , result =the result object(the js object )  copy of the mongoose doccument
        delete result.password
       
        return result

    }
}) 

orgSchema.pre("save", async  function (next){

    if(!this.isModified('password'))  return next();

    this.password=await  bcrypt.hash(this.password,10)
    next()

})

orgSchema.methods.isPasswordCorrect = async function(password) {

    return await bcrypt.compare(password,this.password)  /// mainatian the order (plainpassword,hashedpassword)
    
}


const Organization = mongoose.model("Organization", orgSchema);
export {Organization};
