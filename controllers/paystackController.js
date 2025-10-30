 require("dotenv").config()
const express = require("express");
const axios = require("axios");
const { db,  admin } = require("../firebaseAdmin");


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

    if (!authorizationCode) {
      return res.status(400).json({ error: "No authorization code found" });
    }

    // Step 2: Create recurring subscription
    const subResp = await axios.post(
      "https://api.paystack.co/subscription",
      {
        customer: transaction.customer.email,
        plan: transaction.metadata.planCode,
        authorization: authorizationCode,
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const subscription = subResp.data.data;

    const subscriptionData = {
      planName: subscription.name || "Default Plan",
      code: subscription.plan_code || null,
      subscription_code: subscription.subscription_code || null,
      email_token: subscription.email_token || null,
      status: subscription.status,
      amount: subscription.amount / 100 || 0,
      currency: subscription.currency || "N/A",
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




const paystackSub = async(req, res) => {
  const { email, planCode } = req.body;

  if (!email || !planCode) {
    return res.status(400).json({ error: "Email and planCode are required" });
  }

  try {
    // Step 1: Initialize a minimal payment to collect card details
    const init = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: 50, // minimal amount in kobo to collect card
        metadata: { planCode },
        callback_url: `${process.env.CLIENT_URL}/stacksuccess`, // frontend page
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.status(200).json({
      success: true,
      authorization_url: init.data.data.authorization_url,
    });
  } catch (err) {
    console.error("❌ Paystack initialize error:", err.response?.data || err.message);
    res.status(400).json({ error: err.response?.data || err.message });
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


 const checkSub =  async (req, res) => {
  const { email } = req.params;

  try {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.json({ hasActiveSubscription: false });
    }

    const userData = userSnapshot.docs[0].data();
    const hasActiveSubscription =
      userData.subscriptions?.some(sub => sub.status === "active") || false;

    return res.json({ hasActiveSubscription });
  } catch (error) {
    console.error("❌ Error checking subscription:", error);
    res.status(500).json({ hasActiveSubscription: false });
  }
};

const cancleSub =  async (req, res) => {
  const { code, token, userId } = req.body;
  const requesterId = req.user.uid; // from authMiddleware

  try {
    // Check if requester is super admin
    const requesterDoc = await db.collection("users").doc(requesterId).get();
    const requesterRole = requesterDoc.data()?.role;

    // Allow if user cancels their own OR super admin
    if (requesterId !== userId && requesterRole !== "super_admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Call Paystack API
    const response = await axios.post(
      "https://api.paystack.co/subscription/disable",
      { code, token },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update Firestore
    await db
      .collection("users")
      .doc(userId)
      .update({
        subscriptions: admin.firestore.FieldValue.arrayRemove({
          code,
          token,
        }),
      });

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: response.data,
    });
  } catch (error) {
    console.error("Cancel error:", error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.response?.data,
    });
  }
};



module.exports = {addpaystack, paystackSub, stackonepay, checkSub, landPay, commerncialPay, hotelPay, cancleSub};