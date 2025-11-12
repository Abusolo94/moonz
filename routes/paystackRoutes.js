  const express = require("express")
  const router = express.Router()
  const {addpaystack, paystackSub, paystackservSub,  cancelSub, stackonepay, checkSub, cancleSubAdmin} = require("../controllers/paystackController")
 const {authMiddleware} = require("../middleware/authmiddleware")

  router.get("/verify/:reference", addpaystack)
  router.post("/subscribe", paystackSub )
  router.post("/subscribeServ", paystackservSub )
  router.post("/pay-service", stackonepay )
  router.get("/sub-status/:email", checkSub )
  router.get("/cancel-subscriptionadmin", authMiddleware, cancleSubAdmin )
  router.post("/cancel-subscriptionuser", cancelSub)

  
  module.exports = router