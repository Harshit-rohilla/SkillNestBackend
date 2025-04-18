import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema= new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        index:true,
        trim:true,
        unique:true
    },
    contactNumber:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    accountType:{
        type:String,
        required:true,
        enum:["student","instructor"]
    },
    profile:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile"
    },
    courses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    }],
    courseProgress:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"CourseProgress"
    }],
    userImage:{
        type:String,
    },
    passwordToken:{
        type:String
    },
    passwordTokenExpiresIn:{
        type:Date
    },
    cart: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course", unique:true }], 
    default: [] 
}

})

userSchema.methods.generateAccessToken=async function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            accountType:this.accountType
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
// userSchema.methods.generateRefreshToken=async function(){
//     return jwt.sign(
//         {
//             _id:this._id,
//             email:this.email,
//             accountType:this.accountType
//         },
//         process.env.Refresh_TOKEN_SECRET,
//         {
//             expiresIn:process.env.Refresh_TOKEN_EXPIRY
//         }
//     )
// }

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
    
}

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password= await bcrypt.hash(this.password,10)
    next()
})

// export const User=mongoose.model("User",userSchema)
export const User = mongoose.models.User || mongoose.model('User', userSchema);