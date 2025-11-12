
require("dotenv").config()
const nodemailer = require("nodemailer");
const Stripe = require("stripe");
const { db, admin } = require("../firebaseAdmin");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your App Password
  },
});



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



const addMailer = async (req, res) => {
  const { providerId, message } = req.body;
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    // 1️⃣ Verify sender
    const decoded = await admin.auth().verifyIdToken(idToken);
    const senderUid = decoded.uid;
    const senderDoc = await admin.firestore().doc(`users/${senderUid}`).get();
    const sender = senderDoc.data();

    // 2️⃣ Get provider info     
    const providerDoc = await admin.firestore().doc(`users/${providerId}`).get();
    if (!providerDoc.exists) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }
 
    const provider = providerDoc.data();
    if (!provider.allowContact) {
      return res.status(403).json({ success: false, error: "Provider does not accept messages" });
    }

    // 3️⃣ Send email
    const mailOptions = {
      from: `"${sender.displayName || sender.email}" <${process.env.EMAIL_USER}>`,
      to: provider.email,
      subject: `New inquiry from ${sender.displayName || sender.email}`,
      html: `
        <h3>Hello ${provider.displayName || "Service Provider"},</h3>
        <p>You have a new inquiry from <b>${sender.displayName || sender.email}</b>:</p>
        <blockquote>${message}</blockquote>
        <p>Reply directly to this email to contact the user.</p>
        <hr/>
        <small>11Moonz Real Estate Platform</small>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 4️⃣ Optional log
    await admin.firestore().collection("messages").add({
      from: senderUid,
      to: providerId,
      message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending provider email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
};







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