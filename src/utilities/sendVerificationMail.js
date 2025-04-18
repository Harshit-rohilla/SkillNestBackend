import "dotenv/config"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.HOST, 
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
    },
});

export const sendVerificationMail=async(receiverEmail,subject,text)=>{
    try {
        if(!receiverEmail){
            console.log("No receiver email provided");
            return null
        }
        const response= await transporter.sendMail({
            from:process.env.USER_EMAIL,
            to:receiverEmail,
            subject:subject,
            text:text
        })
        console.log("Email sent successfully:");
        return response
    } catch (error) {
        console.log("error while sending mail ",error?.message)
        return null
    }
}