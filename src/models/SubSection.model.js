import mongoose from "mongoose";
const subSectionSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    video:{
        type:String,
        required:true
    },
})

export const SubSection=mongoose.model("SubSection",subSectionSchema)