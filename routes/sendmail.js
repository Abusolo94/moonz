 const express = require("express")
 const router = express.Router()
const { getStrip, addMailer,  addsub, addonePayment} = require("../controllers/sendmailController")


 router.post("/create-checkout-session", getStrip)
 router.post("/send-email", addMailer)

 router.get("/subscription-status/:email", addsub)
 router.post("/createonetime", addonePayment )
 

 


 module.exports = router 