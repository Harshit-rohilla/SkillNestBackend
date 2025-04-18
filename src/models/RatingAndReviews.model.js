import mongoose from "mongoose"

const ratingAndReviewsSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    rating:{
        type:Number,
        required:true
    },
    review:{
        type:String,
        required:true,
        trim:true
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    }
})

export const RatingAndReviews=mongoose.model("RatingAndReviews",ratingAndReviewsSchema)