import Router from "express";
import { authenticate, isStudent } from "../middlewares/auth.middleware.js";
import { createOrder, verifySignature, sendPaymentConfirmationMail } from "../controllers/payment.controller.js";

const paymentRouter=Router()
paymentRouter.route("/create-order").post(authenticate,isStudent,createOrder)
paymentRouter.route("/verify-signature").post(authenticate,isStudent,verifySignature)
paymentRouter.route("/payment-mail").post(authenticate,isStudent,sendPaymentConfirmationMail)


export default paymentRouter
