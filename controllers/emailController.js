require("dotenv").config()
const sgMail = require("@sendgrid/mail") ;
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const nodemailer = require("nodemailer");
const { db,  admin } = require("../firebaseAdmin");
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com", // or your email SMTP host
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER, // your email
//     pass: process.env.EMAIL_PASS, // your app password or SMTP password
//   },
// });






// const sendmail = async (req, res) => {
//   const { providerId, message } = req.body;
//   const idToken = req.headers.authorization?.split("Bearer ")[1];

//   if (!idToken) {
//     return res.status(401).json({ success: false, error: "Unauthorized" });
//   }

//   try {
//     // 1️⃣ Verify sender
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const senderUid = decoded.uid;
//     const senderDoc = await admin.firestore().doc(`users/${senderUid}`).get();
//     const sender = senderDoc.data();

//     // 2️⃣ Get provider info     
//     const providerDoc = await admin.firestore().doc(`users/${providerId}`).get();
//     if (!providerDoc.exists) {
//       return res.status(404).json({ success: false, error: "Provider not found" });
//     }
 
//     const provider = providerDoc.data();
//     // if (!provider.allowContact) {
//     //   return res.status(403).json({ success: false, error: "Provider does not accept messages" });
//     // }

//     // 3️⃣ Send email
//     const mailOptions = {
//       from: `"${sender.userName  || sender.email}" <${process.env.EMAIL_USER}>`,
//       to: provider.email,
//       subject: `New inquiry from ${sender.userName  || sender.email}`,
//       html: `
//         <h3>Hello ${provider.userName  || "Service Provider"},</h3>
//         <p>You have a new inquiry from <b>${sender.userName || sender.email}</b>:</p>
//         <blockquote>${message}</blockquote>
//         <p>Reply directly to this email to contact the user.</p>
//         <hr/>
//         <small>11Moonz Real Estate Platform</small>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     // 4️⃣ Optional log
//     await admin.firestore().collection("messages").add({
//       from: senderUid,
//       to: providerId,
//       message,
//       sentAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     res.status(200).json({ success: true, message: "Email sent successfully." });
//   } catch (error) {
//     console.error("Error sending provider email:", error);
//     res.status(500).json({ success: false, error: "Failed to send email" });
//   }
// };


// const sendmail = async (req, res) => {
//   const { providerId, message } = req.body;
//   const idToken = req.headers.authorization?.split("Bearer ")[1];

//   if (!idToken) {
//     return res.status(401).json({ success: false, error: "Unauthorized" });
//   }

//   try {
//     // 1️⃣ Verify sender
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const senderUid = decoded.uid;
//     const senderDoc = await admin.firestore().doc(`users/${senderUid}`).get();
//     const sender = senderDoc.data();

//     // 2️⃣ Get provider info
//     const providerDoc = await admin.firestore().doc(`users/${providerId}`).get();
//     if (!providerDoc.exists) {
//       return res.status(404).json({ success: false, error: "Provider not found" });
//     }

//     const provider = providerDoc.data();

//     // 3️⃣ Send email using RESEND directly
//     const result = await resend.emails.send({
//       from: `${sender.userName || sender.email} <${process.env.EMAIL_USER}>`,
//       to: provider.email,
//       subject: `New inquiry from ${sender.userName || sender.email}`,
//       html: `
//         <h3>Hello ${provider.userName || "Service Provider"},</h3>
//         <p>You have a new inquiry from <b>${sender.userName || sender.email}</b>:</p>
//         <blockquote>${message}</blockquote>
//         <p>Reply directly to this email to contact the user.</p>
//         <hr/>
//         <small>11Moonz Real Estate Platform</small>
//       `,
//     });

//     console.log("Resend response:", result);

//     // 4️⃣ Log message
//     await admin.firestore().collection("messages").add({
//       from: senderUid,
//       to: providerId,
//       message,
//       sentAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     res.status(200).json({ success: true, message: "Email sent successfully." });
//   } catch (error) {
//     console.error("Error sending provider email:", error);
//     res.status(500).json({ success: false, error: "Failed to send email" });
//   }
// };


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




// const sendToadmin = async (req, res) => {
//   try {
//     const { providerId, message, name, email } = req.body;

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     // 🔹 Fetch all users with role = "admin"
//     const usersRef = admin.firestore().collection("users");
//     const snapshot = await usersRef.where("roleType", "==", "admin").get();

//     if (snapshot.empty) {
//       return res.status(404).json({ error: "No admin users found" });
//     }

//     // 🔹 Send email to each admin
//     const adminEmails = snapshot.docs.map((doc) => doc.data().email).filter(Boolean);

//     for (const adminEmail of adminEmails) {
//       await transporter.sendMail({
//         from: `"${name}" <${email}>`,
//         to: adminEmail,
//         subject: "New message from a user",
//         text: message,
//       });
//     }

//     console.log("📧 Emails sent to all admins successfully");
//     return res.status(200).json({ success: true, message: "Emails sent to all admins" });

//   } catch (error) {
//     console.error("Error sending provider email:", error);
//     return res.status(500).json({ error: "Failed to send email" });
//   }
// };


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
    for (const adminEmail of adminEmails) {

      await resend.emails.send({
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
      });
    }

    console.log("📧 Email sent to all admins via Resend");
    return res.status(200).json({ success: true, message: "Emails sent to all admins" });

  } catch (error) {
    console.error("Error sending admin email:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
};
  module.exports = {sendmail, sendToadmin}