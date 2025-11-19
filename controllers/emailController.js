require("dotenv").config()
const sgMail = require("@sendgrid/mail") ;
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const { db,  admin } = require("../firebaseAdmin");


const sendmail = async (req, res) => {
  const { providerId, message } = req.body;
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    // Verify sender
    const decoded = await admin.auth().verifyIdToken(idToken);
    const senderUid = decoded.uid;
    const senderDoc = await admin.firestore().doc(`users/${senderUid}`).get();
    const sender = senderDoc.data();

    // Get provider
    const providerDoc = await admin.firestore().doc(`users/${providerId}`).get();
    if (!providerDoc.exists) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }
    const provider = providerDoc.data();

    // Send email to ANYONE
    const result = await resend.emails.send({
      from: `11moonz <${process.env.EMAIL_FROM}>`,
      to: provider.email,   // <-- ANY EMAIL
      subject: `Inquiry from ${sender.userName || sender.email}`,
      html: `
        <h3>Hello ${provider.userName || "Service Provider"},</h3>
        <p>You have a new message from <b>${sender.userName || sender.email}</b>:</p>
        <blockquote>${message}</blockquote>
        <p>Reply directly to contact the user.${sender.email}</p>
      `,
    });

    console.log("Resend:", result);

    res.status(200).json({ success: true, message: "Email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
};







const sendToadmin = async (req, res) => {
  try {
    const { providerId, message, name, email } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Fetch all admins
    const snapshot = await admin.firestore()
      .collection("users")
      .where("roleType", "==", "admin")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No admin users found" });
    }

    // Get admin emails
    const adminEmails = snapshot.docs
      .map(doc => doc.data().email)
      .filter(Boolean);

    // Send email to each admin
    await Promise.all(
      adminEmails.map(adminEmail =>
        resend.emails.send({
          from: `11moonz Notifications <${process.env.EMAIL_FROM}>`,
          to: adminEmail,
          subject: "New user message",
          html: `
            <h2>New Message from a User</h2>
            <p><b>Name:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Message:</b></p>
            <blockquote>${message}</blockquote>
          `,
        })
      )
    );

    // Log the admin emails in backend
    console.log(`📧 Emails sent successfully to: ${adminEmails.join(", ")}`);

    // Return the admin emails to frontend
    return res.status(200).json({
      success: true,
      message: "Emails sent to all admins",
      adminEmails,
    });

  } catch (error) {
    console.error("Error sending admin email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
};





  module.exports = {sendmail, sendToadmin}