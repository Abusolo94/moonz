
require("dotenv").config()
// const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");


const Stripe = require("stripe");
const { db } = require("../firebaseAdmin");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// const getMail = async (req, res) => {
//   const { fullName, email, message } = req.body;


//   const msg = {
//     to: "rickysolo44@gmail.com", // your email
//     from: 'rickysolo44@gmail.com',
//     replyTo: email,
//     subject: "New property Inquiry",
//     html: `
//       <p><strong>Name:</strong> ${fullName}</p>
//       <p>${message}</p>
//     `,
//   };



//   try {
//     await sgMail.send(msg);
//     res.status(200).send("✅ Email sent successfully!");
//   } catch (error) {
//     console.error("opppps", error);
//     res.status(500).send("❌ Failed to send email",);
//   }
// };

// const addment = async (req, res) => {
//   console.log("the world is coming to an end"); // test log
//   console.log("Request body:", req.body);       // show what was sent

//   res.status(200).json({ message: "Setup is working correctly ✅" });
// };


const getStrip = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // 👈 Use subscription mode
      payment_method_types: ["card"],
      line_items: req.body.items.map(item => ({
        price: item.priceId, // 👈 Use Stripe Price ID for recurring plans
        quantity: item.quantity,
      })),
        // customer_creation: "always",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
};






 const addsub = async (req, res) => {
  try {
    const { email } = req.params;
    const snapshot = await db
      .collection("subscriptions")
      .where("customerEmail", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ hasActiveSubscription: false });
    }

    const doc = snapshot.docs[0].data();
    const isActive = doc.status === "active";

    res.status(200).json({
      hasActiveSubscription: isActive,
      status: doc.status,
      subscriptionId: doc.subscriptionId,
    });
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);
    res.status(500).json({ error: error.message });
  }
};



const addMailer =  async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // you can use 'hotmail', 'yahoo', etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    // Email options
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: "rickysolo44@gmail.com",
      subject: "11moonz real estate",
      html: `
        <h3>New Message from ${name}</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
};



// const addSms = async (req, res) => {
//   const { to, message } = req.body;

//   try {
//     const sms = await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to, // example: '+15551234567'
//     });

//     console.log("SMS sent:", sms.sid);
//     res.json({ success: true, sid: sms.sid });
//   } catch (error) {
//     console.error("Error sending SMS:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


const addonePayment = async (req, res) => {
  try {
    const { amount, description, email } = req.body;

    if (!amount || !description || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // 👈 one-time payment mode
      customer_email: email, // optional, pre-fills checkout email
      line_items: [
        {
          price_data: {
            currency: "usd", // or your currency
            product_data: { name: description },
            unit_amount: Math.round(amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/successs`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("One-time payment error:", error);
    res.status(500).json({ error: error.message });
  }
};



module.exports = {  getStrip, addMailer,  addsub, addonePayment }