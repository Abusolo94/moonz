 const express =  require("express") ;
const cors = require("cors") ;
const sgMail = require("@sendgrid/mail") ;
require("dotenv").config()
const sendRouter = require("./routes/sendmail")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { db,  admin } = require("./firebaseAdmin");



const app = express();
app.use(cors());
// app.use(express.json());

app.use('/mails/moonz',  express.json(), sendRouter)



app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {

        // ✅ User completed checkout with subscription
        case "checkout.session.completed": {
          const session = event.data.object;

          if (!session.subscription || !session.customer) {
            console.log("⚠️ Session missing subscription or customer. Skipping.");
            break;
          }

          const customer = await stripe.customers.retrieve(session.customer);

          if (!customer.email) {
            console.log("⚠️ Customer email missing. Skipping.");
            break;
          }

          // Check for existing active subscription
          const existingSub = await db
            .collection("subscriptions")
            .where("customerEmail", "==", customer.email)
            .where("status", "==", "active")
            .get();

          if (!existingSub.empty) {
            console.log("⚠️ User already has an active subscription. Skipping duplicate.");
          } else {
            await db.collection("subscriptions").doc().set({
              subscriptionId: session.subscription,
              customerId: session.customer,
              customerEmail: customer.email,
              status: "active",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log("✅ Subscription saved for", customer.email);
          }
          break;
        }

        // 🔹 Payment failed
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          if (!invoice.subscription) break;

          const snapshot = await db
            .collection("subscriptions")
            .where("subscriptionId", "==", invoice.subscription)
            .get();

          snapshot.forEach(doc =>
            doc.ref.update({ status: "past_due" })
          );
          break;
        }

        // 🔹 Subscription canceled
        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          if (!subscription.id) break;

          const snapshot = await db
            .collection("subscriptions")
            .where("subscriptionId", "==", subscription.id)
            .get();

          snapshot.forEach(doc =>
            doc.ref.update({ status: "canceled" })
          );
          break;
        }

        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Error handling webhook event:", err);
      res.status(500).send(`Webhook handler error: ${err.message}`);
    }
  }
);

app.listen(4000, () => console.log("Server running on port 4000"));