import dotenv from "dotenv"
import connectDB from "./db/db.js"
import {app} from "./app.js"

dotenv.config({})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!",err)
})





/*


const mongoose=require("mongoose")
const constants=require("./constants")
const express=require("express")
const app=express()

(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${constants.DB_NAME}`)
        app.on("error",(error)=>{
            console.log("error:",error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is running on ${process.env.PORT} port`)
        })
    }
    catch(error){
        console.error("ERROR:",error)
        throw error
    }
})()

*/