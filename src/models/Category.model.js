import mongoose from "mongoose";
const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        trim:true,
        required:true
    },
    description:{
        type:String,
        trim:true,
        required:true
    },
    course:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    }]

})
export const Category=mongoose.model("Category",categorySchema)