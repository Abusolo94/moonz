 

  const express = require("express")
   const router = express.Router()
   const {sendmail, sendToadmin} = require("../controllers/emailController")

    router.post("/sendEmail", sendmail  )
    router.post("/sendEmailadmin", sendToadmin  )

   module.exports = router