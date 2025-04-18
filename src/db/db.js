import mongoose from "mongoose"


export const connectDb=async()=>{
    try {
        const response=await mongoose.connect(`${process.env.DB_URL}`)
        console.log("connected to db",response.connection.host)
    } catch (error) {
        console.log("error while connecting to DB")
        process.exit(1)
    }
}