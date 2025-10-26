 require("dotenv").config()
const express = require("express");
const axios = require("axios");
const { db,  admin } = require("../firebaseAdmin");


const addpaystack = async (req, res) => {
  const { reference } = req.params;

  try {
    // Step 1: Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verification = response.data.data;

    // Step 2: Only store if payment was successful
    if (verification.status === "success") {
      const subscriptionData = {
        userEmail: verification.customer.email,
        amount: verification.amount / 100, // Convert from kobo to KSh
        currency: verification.currency,
        reference: verification.reference,
        status: verification.status,
        serviceName: verification.metadata?.serviceName || "Subscription",
        paymentDate: new Date().toISOString(),
        gateway: "Paystack",
      };

      // Step 3: Store in Firestore
      await db.collection("subscriptions").add(subscriptionData);

      console.log("✅ Subscription stored successfully!");
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ Verification Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};



const paystackSub = async (req, res) => {
  const { email, planCode } = req.body;

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: 5000 * 100, // amount in kobo
        plan: planCode,     // your Paystack plan code
        callback_url: `${process.env.CLIENT_URL}/stacksuccess`, // ✅ inside body
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Paystack error:", error.response?.data || error.message);
    res.status(400).json({ error: error.message });
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



const checkSub = async (req, res) => {
  try {
    const { email } = req.params;

    // 🔍 Find user's latest subscription/payment record
    const snapshot = await db
      .collection("subscriptions")
      .where("userEmail", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ hasActiveSubscription: false });
    }

    const doc = snapshot.docs[0].data();

    // ✅ Define "active" based on status and recent payment
    const isSuccess = doc.status === "success";
    const paymentDate = new Date(doc.paymentDate);
    const now = new Date();

    // You can define how long a subscription lasts (e.g., 30 days)
    const isRecent =
      (now - paymentDate) / (1000 * 60 * 60 * 24) <= 30; // 30 days validity

    const isActive = isSuccess && isRecent;

    res.status(200).json({
      hasActiveSubscription: isActive,
      status: doc.status,
      reference: doc.reference,
      serviceName: doc.serviceName,
      amount: doc.amount,
      currency: doc.currency,
      paymentDate: doc.paymentDate,
    });
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);
    res.status(500).json({ error: error.message });
  }
};



module.exports = {addpaystack, paystackSub, stackonepay, checkSub};