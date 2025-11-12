 require("dotenv").config()
const express = require("express");
const axios = require("axios");
const { db,  admin } = require("../firebaseAdmin");






// const addpaystack = async (req, res) => {
//   const { reference } = req.params;

//   try {
//     if (!reference) {
//       return res.status(400).json({ error: "Transaction reference is required" });
//     }

//     // ✅ Verify transaction
//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//     );

//     const transaction = verifyRes.data.data;
//     if (transaction.status !== "success") {
//       return res.status(400).json({ error: "Payment not successful", data: transaction });
//     }

//     const email = transaction.customer.email;
//     const authorizationCode = transaction.authorization?.authorization_code;
//     const planCode = transaction.plan || transaction.plan_object?.plan_code;

//     if (!planCode) {
//       return res.status(200).json({
//         success: true,
//         message: "Payment verified but no plan code found (subscription not created).",
//         data: transaction,
//       });
//     }

//     if (!authorizationCode) {
//       return res.status(400).json({ error: "No authorization code found" });
//     }

//     // ✅ Try creating subscription
//     let subscription;
//     try {
//       const subResp = await axios.post(
//         "https://api.paystack.co/subscription",
//         {
//           customer: email,
//           plan: planCode,
//           authorization: authorizationCode,
//         },
//         { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//       );
//       subscription = subResp.data.data;
//     } catch (subErr) {
//       const errData = subErr.response?.data;
//       // 🟡 Handle duplicate subscription
//       if (errData?.code === "duplicate_subscription") {
//         console.log("ℹ️ Subscription already exists — fetching existing one.");

//         // Get customer’s subscriptions
//         const customerSubs = await axios.get(
//           `https://api.paystack.co/subscription?customer=${email}`,
//           { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//         );

//         subscription = customerSubs.data.data.find(
//           (sub) => sub.plan?.plan_code === planCode
//         );

//         if (!subscription) {
//           return res.status(200).json({
//             success: true,
//             message: "Existing subscription not found but payment verified.",
//             data: transaction,
//           });
//         }
//       } else {
//         throw subErr; // rethrow if other error
//       }
//     }

//     // ✅ Prepare subscription data
//     const subscriptionData = {
//       planName: subscription.plan?.name || transaction.plan_object?.name || "Subscription",
//       code: subscription.subscription_code || null,
//       subscription_code: subscription.subscription_code || null,
//       email_token: subscription.email_token || null,
//       status: subscription.status || "active",
//       amount: subscription.amount ? subscription.amount / 100 : transaction.amount / 100,
//       currency: subscription.currency || transaction.currency || "KES",
//       createdAt: admin.firestore.Timestamp.now(),
//       gateway: "Paystack",
//     };

//     // ✅ Store under user
//     const userQuery = await db.collection("users").where("email", "==", transaction.customer.email).limit(1).get();
//     if (!userQuery.empty) {
//       const userDoc = userQuery.docs[0].ref;
//       await userDoc.set(
//         { subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionData) },
//         { merge: true }
//       );
//     }

//     // ✅ Store globally
//     await db.collection("subscriptions").add({ userEmail: transaction.customer.email, ...subscriptionData });

//     res.status(200).json({
//       success: true,
//       message: "Payment verified. Subscription saved (new or existing).",
//       subscription: subscriptionData,
//     });
//   } catch (err) {
//     console.error("❌ Paystack verify/subscription error:", err.response?.data || err.message);
//     res.status(400).json({ error: err.response?.data || err.message });
//   }
// };


// const addpaystack = async (req, res) => {
//   const { reference } = req.params;

//   try {
//     if (!reference) {
//       return res.status(400).json({ success: false, error: "Reference is required" });
//     }

//     // 1️⃣ Verify transaction with Paystack
//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//     );

//     const transaction = verifyRes.data.data;
//     console.log("Transaction verified:", transaction);

//     if (transaction.status !== "success") {
//       return res.status(400).json({ success: false, error: "Payment not successful" });
//     }

//     const authorizationCode = transaction.authorization?.authorization_code;
//     const planCode = transaction.plan || transaction.plan_object?.plan_code;
//     // const planCode = transaction.metadata?.planCode;

//     if (!authorizationCode) {
//       return res.status(400).json({ success: false, error: "No authorization code found" });
//     }

//     if (!planCode) {
//       return res.status(200).json({
//         success: true,
//         message: "Payment verified, planCode missing. Subscription not created.",
//         data: transaction,
//       });
//     }

//     // 2️⃣ Create subscription on Paystack
//     const subResp = await axios.post(
//       "https://api.paystack.co/subscription",
//       {
//         customer: transaction.customer.email,
//         plan: planCode,
//         authorization: authorizationCode,
//       },
//       { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//     );

//     const subscription = subResp.data.data;
//     console.log("Paystack subscription created:", subscription);

//     // 3️⃣ Prepare Firestore subscription data
//     const subscriptionData = {
//       planName: subscription.plan?.name || "Subscription",
//       code: subscription.subscription_code || null,
//       subscription_code: subscription.subscription_code || null,
//       email_token: subscription.email_token || null,
//       status: subscription.status || "active",
//       amount: subscription.amount ? subscription.amount / 100 : transaction.amount / 100,
//       currency: subscription.currency || "Ksh",
//       createdAt: admin.firestore.Timestamp.now(),
//       gateway: "Paystack",
//     };
//     console.log("Subscription data to save:", subscriptionData);

//     // 4️⃣ Save subscription to user document
//     const userQuery = await db.collection("users")
//       .where("email", "==", transaction.customer.email)
//       .limit(1)
//       .get();

//     if (!userQuery.empty) {
//       const userDoc = userQuery.docs[0].ref;
//       await userDoc.set(
//         { subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionData) },
//         { merge: true }
//       );
//       console.log(`Subscription saved for user: ${transaction.customer.email}`);
//     } else {
//       console.warn(`No user found with email: ${transaction.customer.email}`);
//     }

//     // 5️⃣ Save subscription globally for analytics
//     await db.collection("subscriptions").add({
//       userEmail: transaction.customer.email,
//       ...subscriptionData,
//     });
//     console.log("Subscription saved globally for analytics.");

//     res.status(200).json({ success: true, subscription: subscriptionData });
//   } catch (err) {
//     console.error("❌ Paystack verify/subscription error:", err.response?.data || err.message);
//     res.status(400).json({ success: false, error: err.response?.data || err.message });
//   }
// };




// const addpaystack = async (req, res) => {
//   const { reference } = req.params;

//   try {
//     const verifyRes = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//     );

//     const transaction = verifyRes.data.data;

//     if (transaction.status !== "success") {
//       return res.status(400).json({ error: "Payment not successful" });
//     }

//     const authorizationCode = transaction.authorization?.authorization_code;
//     const planCode = transaction.metadata?.planCode;

//     if (!authorizationCode) {
//       return res.status(400).json({ error: "No authorization code found" });
//     }

//     if (!planCode) {
//       // Don't create subscription, just return verification success
//       return res.status(200).json({ success: true, message: "Payment verified, planCode missing, subscription not created.", data: transaction });
//     }

//     // ✅ Only create subscription if planCode exists
//     const subResp = await axios.post(
//       "https://api.paystack.co/subscription",
//       {
//         customer: transaction.customer.email,
//         plan: planCode,
//         authorization: authorizationCode,
//       },
//       { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
//     );

//     const subscription = subResp.data.data;

//     const subscriptionData = {
//       planName: subscription.plan?.name || "Subscription",
//       code: subscription.subscription_code || null,
//       subscription_code: subscription.subscription_code || null,
//       email_token: subscription.email_token || null,
//       status: subscription.status || "active",
//       amount: subscription.amount ? subscription.amount / 100 : transaction.amount / 100,
//       currency: subscription.currency || "Ksh",
//       createdAt: admin.firestore.Timestamp.now(),
//       gateway: "Paystack",
//     };

//     // Save to user doc
//     const userQuery = await db.collection("users").where("email", "==", transaction.customer.email).limit(1).get();
//     if (!userQuery.empty) {
//       const userDoc = userQuery.docs[0].ref;
//       await userDoc.set(
//         { subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionData) },
//         { merge: true }
//       );
//     }

//     // Save globally
//     await db.collection("subscriptions").add({ userEmail: transaction.customer.email, ...subscriptionData });

//     res.status(200).json({ success: true, subscription: subscriptionData });

//   } catch (err) {
//     console.error("❌ Paystack verify/subscription error:", err.response?.data || err.message);
//     res.status(400).json({ error: err.response?.data || err.message });
//   }
// };



 const addpaystack =  async (req, res) => {
  const { reference } = req.params;

  try {
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const transaction = verifyRes.data.data;

    if (transaction.status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    // Get authorization code from successful transaction
    const authorizationCode = transaction.authorization?.authorization_code;
    const planCode = transaction.plan_object.plan_code

    if (!authorizationCode) {
      return res.status(400).json({ error: "No authorization code found" });
    }

    // Step 2: Create recurring subscription
    const subResp = await axios.post(
      "https://api.paystack.co/subscription",
      {
        customer: transaction.customer.email,
        plan: planCode,
        authorization: authorizationCode,
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const subscription = subResp.data.data;

    const subscriptionData = {
      planName: subscription.plan?.name || "Subscription",
      code: subscription.subscription_code || null,
      subscription_code: subscription.subscription_code || null,
      email_token: subscription.email_token || null,
      status: subscription.status || "active",
      amount: subscription.amount ? subscription.amount / 100 : transaction.amount / 100,
      currency: subscription.currency || "Ksh",
      createdAt: admin.firestore.Timestamp.now(),
      gateway: "Paystack",
    };

    // Attach to user doc
    const userQuery = await db.collection("users").where("email", "==", transaction.customer.email).limit(1).get();
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0].ref;
      await userDoc.set(
        { subscriptions: admin.firestore.FieldValue.arrayUnion(subscriptionData) },
        { merge: true }
      );
    }

    // Optional: store globally for admin analytics
    await db.collection("subscriptions").add({ userEmail: transaction.customer.email, ...subscriptionData });

    res.status(200).json({ success: true, subscription: subscriptionData });

  } catch (err) {
    console.error("❌ Paystack verify/subscription error:", err.response?.data || err.message);
    res.status(400).json({ error: err.response?.data || err.message });
  }
};



 const paystackSub = async (req, res) => {
  const { email, planCode } = req.body;

  if (!email || !planCode) {
    return res.status(400).json({ error: "Email and planCode are required" });
  }

  try {
    // ✅ Initialize Paystack transaction tied to a plan
    const init = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: planCode *100,
        plan: planCode, // ✅ attach the plan directly
        callback_url: `${process.env.CLIENT_URL}/stacksuccess`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      authorization_url: init.data.data.authorization_url,
    });
  } catch (err) {
    console.error(
      "❌ Paystack initialize error:",
      err.response?.data || err.message
    );
    res.status(400).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};


 const paystackservSub = async (req, res) => {
  const { email, planCode } = req.body;

  if (!email || !planCode) {
    return res.status(400).json({ error: "Email and planCode are required" });
  }

  try {
    // ✅ Initialize Paystack transaction tied to a plan
    const init = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: planCode *100,
        plan: planCode, // ✅ attach the plan directly
        callback_url: `${process.env.CLIENT_URL}/stacksuccess`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      authorization_url: init.data.data.authorization_url,
    });
  } catch (err) {
    console.error(
      "❌ Paystack initialize error:",
      err.response?.data || err.message
    );
    res.status(400).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};









const stackonepay =  async (req, res) => {
  const { email, amount, serviceName } = req.body; // amount in Naira
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // convert to kobo
        metadata: {
          serviceName,
        },
        callback_url: `${process.env.CLIENT_URL}/successs`, // replace with your frontend success URL
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
};

const landPay =  async (req, res) => {
  const { email, amount, serviceName } = req.body; // amount in Naira
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // convert to kobo
        metadata: {
          serviceName,
        },
        callback_url: `${process.env.CLIENT_URL}/landsuccesspay`, // replace with your frontend success URL
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
};

const hotelPay =  async (req, res) => {
  const { email, amount, serviceName } = req.body; // amount in Naira
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // convert to kobo
        metadata: {
          serviceName,
        },
        callback_url: `${process.env.CLIENT_URL}/hotelsuccesspay`, // replace with your frontend success URL
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
};

const commerncialPay =  async (req, res) => {
  const { email, amount, serviceName } = req.body; // amount in Naira
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // convert to kobo
        metadata: {
          serviceName,
        },
        callback_url: `${process.env.CLIENT_URL}/commerncialsucesspay`, // replace with your frontend success URL
      },

      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
};


const checkSub = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📨 Incoming sub-status check for:", email);

    if (!email) {
      return res.status(400).json({ error: "Email parameter missing" });
    }

    const decodedEmail = decodeURIComponent(email.toLowerCase());
    console.log("🔍 Decoded email:", decodedEmail);

    // =========================
    // 🔹 Step 1: Check Firestore
    // =========================
    const userSnap = await db
      .collection("users")
      .where("email", "==", decodedEmail)
      .limit(1)
      .get();

    let hasActiveSubscription = false;
    if (!userSnap.empty) {
      const userData = userSnap.docs[0].data();
      const subscriptions = userData.subscriptions || [];
      hasActiveSubscription = subscriptions.some(
        (sub) => sub.status === "active"
      );
    }

    // =========================
    // 🔹 Step 2: Check Paystack Directly (if Firestore has none)
    // =========================
    if (!hasActiveSubscription) {
      console.log("⚠️ No active Firestore sub — checking Paystack API...");
      try {
        const paystackRes = await axios.get(
          `https://api.paystack.co/subscription`,
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        // Filter subscriptions belonging to this email
        const subsForUser = paystackRes.data.data.filter(
          (sub) =>
            sub.customer &&
            sub.customer.email &&
            sub.customer.email.toLowerCase() === decodedEmail
        );

        // Check if any subscription is active
        hasActiveSubscription = subsForUser.some(
          (sub) => sub.status === "active"
        );

        console.log(
          `💳 Paystack found ${subsForUser.length} subscriptions for ${decodedEmail}.`
        );

        // Optionally update Firestore if active sub found
        if (hasActiveSubscription && !userSnap.empty) {
          const userRef = userSnap.docs[0].ref;
          await userRef.set(
            {
              subscriptions: subsForUser.map((s) => ({
                id: s.id,
                plan: s.plan,
                status: s.status,
                createdAt: s.createdAt,
                nextPaymentDate: s.next_payment_date,
              })),
            },
            { merge: true }
          );
          console.log("✅ Firestore updated with Paystack subscription info.");
        }
      } catch (paystackErr) {
        console.error("❌ Paystack fetch failed:", paystackErr.response?.data || paystackErr.message);
      }
    }

    console.log("✅ Final subscription status:", hasActiveSubscription);
    return res.json({ hasActiveSubscription });
  } catch (err) {
    console.error("❌ Error in /sub-status:", err.stack || err.message);
    return res.status(500).json({
      hasActiveSubscription: false,
      error: err.message,
    });
  }
};

//  const checkSub =  async (req, res) => {
//   const { email } = req.params;

//   try {
//     const userSnapshot = await db
//       .collection("users")
//       .where("email", "==", email)
//       .limit(1)
//       .get();

//     if (userSnapshot.empty) {
//       return res.json({ hasActiveSubscription: false });
//     }

//     const userData = userSnapshot.docs[0].data();
//     const hasActiveSubscription =
//       userData.subscriptions?.some(sub => sub.status === "active") || false;

//     return res.json({ hasActiveSubscription });
//   } catch (error) {
//     console.error("❌ Error checking subscription:", error);
//     res.status(500).json({ hasActiveSubscription: false });
//   }
// };



const cancleSubAdmin = async (req, res) => {
  const { code, token, userId } = req.body;
  const requesterId = req.user.uid; // from auth middleware

  if (!code || !token || !userId) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // 🔒 Check if requester is admin or the same user
    const requesterDoc = await db.collection("users").doc(requesterId).get();
    const requesterRole = requesterDoc.data()?.roleType;

    if (requesterId !== userId && requesterRole !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // 🚀 Call Paystack to disable subscription
    const paystackRes = await axios.post(
      "https://api.paystack.co/subscription/disable",
      { code, token },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Update Firestore to mark subscription as cancelled
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const subs = userDoc.data().subscriptions || [];

      const updatedSubs = subs.map((sub) =>
        sub.code === code
          ? { ...sub, status: "cancelled", cancelledAt: admin.firestore.Timestamp.now() }
          : sub
      );

      await userRef.update({ subscriptions: updatedSubs });
    }

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: paystackRes.data,
    });
  } catch (error) {
    console.error("❌ Cancel error:", error.response?.data || error.message);

    res.status(400).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.response?.data || error.message,
    });
  }
};



const cancelSub = async (req, res) => {
  const { subscription_code, token } = req.body;

  if (!subscription_code || !token) {
    return res.status(400).json({
      success: false,
      error: "Both subscription_code and token are required",
    });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/subscription/disable",
      {
        code: subscription_code,
        token: token,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ Paystack Cancel Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to cancel subscription",
      details: error.response?.data || error.message,
    });
  }
};



module.exports = {addpaystack, paystackservSub, cancelSub, paystackSub, stackonepay, checkSub, landPay, commerncialPay, hotelPay, cancleSubAdmin};