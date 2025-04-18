import { connectDb } from "./db/db.js"
import { app } from "./app.js"
import "dotenv/config"

connectDb()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("server started")
    })
})
.catch((err)=>{
    console.log("error while starting the server ",err?.message)
})