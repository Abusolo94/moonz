require("dotenv").config()
const nodemailer = require("nodemailer");
const { db,  admin } = require("../firebaseAdmin");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // or your email SMTP host
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password or SMTP password
  },
});

const sendmail = async (req, res) => {
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
    // if (!provider.allowContact) {
    //   return res.status(403).json({ success: false, error: "Provider does not accept messages" });
    // }

    // 3️⃣ Send email
    const mailOptions = {
      from: `"${sender.userName  || sender.email}" <${process.env.EMAIL_USER}>`,
      to: provider.email,
      subject: `New inquiry from ${sender.userName  || sender.email}`,
      html: `
        <h3>Hello ${provider.userName  || "Service Provider"},</h3>
        <p>You have a new inquiry from <b>${sender.userName || sender.email}</b>:</p>
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



const sendToadmin = async (req, res) => {
  try {
    const { providerId, message, name, email } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔹 Fetch all users with role = "admin"
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.where("roleType", "==", "admin").get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No admin users found" });
    }

    // 🔹 Send email to each admin
    const adminEmails = snapshot.docs.map((doc) => doc.data().email).filter(Boolean);

    for (const adminEmail of adminEmails) {
      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: adminEmail,
        subject: "New message from a user",
        text: message,
      });
    }

    console.log("📧 Emails sent to all admins successfully");
    return res.status(200).json({ success: true, message: "Emails sent to all admins" });

  } catch (error) {
    console.error("Error sending provider email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
};
  module.exports = {sendmail, sendToadmin}