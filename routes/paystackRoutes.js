  const express = require("express")
  const router = express.Router()
  const {addpaystack, paystackSub, stackonepay, checkSub} = require("../controllers/paystackController")

  router.get("/verify/:reference", addpaystack )
  router.post("/subscribe", paystackSub )
  router.post("/pay-service", stackonepay )
  router.get("/sub-status/:email", checkSub )

  
  module.exports = router