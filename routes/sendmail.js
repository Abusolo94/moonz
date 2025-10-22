 const express = require("express")
 const router = express.Router()
const {getMail, addment, getStrip, addMailer, addSms, addsub, addonePayment} = require("../controllers/sendmailController")

 router.post("/sends", getMail)
 router.post("/add", addment)
 router.post("/create-checkout-session", getStrip)
 router.post("/send-email", addMailer)
 router.post("/send-sms", addSms)
 router.get("/subscription-status/:email", addsub)
 router.post("/createonetime", addonePayment )
 

 


 module.exports = router 