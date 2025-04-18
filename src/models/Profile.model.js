import mongoose from "mongoose"

const profileSchema=new mongoose.Schema({
    gender:{
        type:String,
        enum:["Male","Female"]
    },
    dob:{
        type:Date
    },
    about:{
        type:String,
        trim:true
    }
})

export const Profile=mongoose.model("Profile",profileSchema)