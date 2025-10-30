

  const express = require("express")
  const router = express.Router()
  const {landPay, hotelPay, commerncialPay} = require("../controllers/paystackController")

   router.post("/landpay", landPay )
   router.post("/hotelpay", hotelPay )
   router.post("/commercialpay", commerncialPay )


   module.exports = router