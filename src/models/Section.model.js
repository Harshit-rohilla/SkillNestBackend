import mongoose from "mongoose";

const sectionSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    subSection:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"SubSection",
        }
    ]
})
export const Section=mongoose.model("Section",sectionSchema)