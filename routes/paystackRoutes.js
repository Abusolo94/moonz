  const express = require("express")
  const router = express.Router()
  const {addpaystack, paystackSub, cancleSub, stackonepay, checkSub} = require("../controllers/paystackController")

  router.get("/verify/:reference", addpaystack )
  router.post("/subscribe", paystackSub )
  router.post("/pay-service", stackonepay )
  router.get("/sub-status/:email", checkSub )
  router.get("/cancel-subscription",cancleSub )

  
  module.exports = router