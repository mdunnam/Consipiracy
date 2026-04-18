/**
 * The Truth Archive — Payment Server
 *
 * Express server handling:
 *  - Static file serving (the site itself)
 *  - POST /create-checkout-session  → creates a Stripe Checkout session
 *  - GET  /verify-session/:id       → verifies a completed session
 *  - POST /webhook                  → handles Stripe webhook events
 *
 * Setup:
 *  1. npm install express stripe dotenv
 *  2. Copy .env.example to .env and fill in your Stripe keys
 *  3. node server.js
 */

'use strict';

require('dotenv').config();
const express      = require('express');
const path         = require('path');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const stripe       = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Sends a purchase confirmation email with the customer's re-access link.
 * @param {string} toEmail - Customer's email address from Stripe.
 * @param {string} sessionId - Stripe checkout session ID used as the access token.
 */
async function sendPurchaseEmail(toEmail, sessionId) {
  const accessUrl = `${process.env.SITE_URL}/ebook-success.html?session_id=${sessionId}`;
  const fromAddress = process.env.SES_FROM_EMAIL || 'noreply@thetrutharchive.org';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Georgia',serif;color:#e8e0d0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:4px;max-width:600px;">
        <tr><td style="padding:40px;text-align:center;border-bottom:1px solid #2a2a2a;">
          <div style="font-size:2rem;margin-bottom:12px;">👁</div>
          <h1 style="color:#c9a227;font-size:1.5rem;margin:0;letter-spacing:0.15em;text-transform:uppercase;">The Truth Archive</h1>
          <p style="color:#666;font-size:0.75rem;letter-spacing:0.3em;text-transform:uppercase;margin:8px 0 0;">Access Confirmed</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#c9a227;font-size:1.1rem;margin:0 0 16px;">Your access has been unlocked.</p>
          <p style="color:#aaa;line-height:1.8;margin:0 0 24px;">Thank you for your purchase. Use the link below any time to re-access the full 12-chapter eBook — on any device, in any browser.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${accessUrl}" style="display:inline-block;background:#c9a227;color:#000;text-decoration:none;padding:14px 32px;font-family:monospace;font-size:0.85rem;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;border-radius:3px;">Open Full eBook →</a>
          </div>
          <p style="color:#555;font-size:0.8rem;line-height:1.7;">Bookmark this email or save the link. It is your permanent key to the archive.<br>Questions? Reply to this email.</p>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #1a1a1a;text-align:center;">
          <p style="color:#444;font-size:0.72rem;margin:0;letter-spacing:0.1em;">THE TRUTH ARCHIVE &nbsp;·&nbsp; THETRUTHARCHIVE.ORG</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const command = new SendEmailCommand({
    FromEmailAddress: fromAddress,
    Destination: { ToAddresses: [toEmail] },
    Content: {
      Simple: {
        Subject: { Data: '📖 Your Truth Archive Access Link', Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: `Your Truth Archive access link:\n\n${accessUrl}\n\nBookmark this email — it is your permanent key.\n\nthetrutharchive.org`, Charset: 'UTF-8' },
        },
      },
    },
  });

  await ses.send(command);
  console.log(`Purchase email sent to ${toEmail}`);
}

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security headers ────────────────────────────────────────────────────── */

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'js.stripe.com'],
      frameSrc:    ['js.stripe.com', 'hooks.stripe.com'],
      connectSrc:  ["'self'", 'api.stripe.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc:     ["'self'", 'data:', 'fonts.gstatic.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/* ── Rate limiting ───────────────────────────────────────────────────────── */

/** Tight limit on checkout and verify endpoints to prevent abuse. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
});

app.use('/create-checkout-session', apiLimiter);
app.use('/verify-session',          apiLimiter);

/* ── Middleware ──────────────────────────────────────────────────────────── */

// Raw body needed for Stripe webhook signature verification.
// Must come BEFORE express.json() for the webhook route.
app.use('/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());

// Serve static site files
app.use(express.static(path.join(__dirname)));

/* ── POST /create-checkout-session ──────────────────────────────────────── */

/**
 * Creates a Stripe Checkout session for the ebook purchase.
 * Returns { url } which the client redirects to.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency:     'usd',
            unit_amount:  999,       // $9.99 in cents
            product_data: {
              name:        'The Truth Archive — Complete eBook',
              description: 'All 12 chapters. Instant browser access.',
              images:      [],
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Collect email so we can send the access link
      customer_creation: 'always',
      // After payment, Stripe redirects here with session_id appended
      success_url: `${process.env.SITE_URL}/ebook-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.SITE_URL}/ebook.html`,
      // Allow promotion codes entered by the buyer
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
});

/* ── GET /verify-session/:id ─────────────────────────────────────────────── */

/**
 * Verifies that a given Checkout session was paid.
 * Called by ebook-success.html on page load.
 * Returns { valid: true } if the session payment_status is 'paid'.
 */
app.get('/verify-session/:id', async (req, res) => {
  const { id } = req.params;

  // Validate the session ID format to prevent injection
  if (!/^cs_[a-zA-Z0-9_]+$/.test(id)) {
    return res.status(400).json({ valid: false, error: 'Invalid session ID format.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const paid    = session.payment_status === 'paid';
    res.json({ valid: paid });
  } catch (err) {
    console.error('Session verify error:', err.message);
    res.status(400).json({ valid: false, error: 'Session not found.' });
  }
});

/* ── POST /webhook ───────────────────────────────────────────────────────── */

/**
 * Stripe webhook handler.
 * Listens for checkout.session.completed events as a server-side
 * confirmation of payment (redundant with /verify-session but more robust).
 *
 * Set your webhook secret in .env as STRIPE_WEBHOOK_SECRET.
 * In the Stripe dashboard → Webhooks → add endpoint:
 *   https://yourdomain.com/webhook  (event: checkout.session.completed)
 */
app.post('/webhook', (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    // Webhook secret not configured — skip verification in dev
    return res.sendStatus(200);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment confirmed via webhook. Session:', session.id, 'Customer:', session.customer_email, 'CustomerID:', session.customer);

    // Try customer_email first, then fetch customer object if needed
    const sendEmail = async () => {
      let email = session.customer_email;
      if (!email && session.customer) {
        try {
          const customer = await stripe.customers.retrieve(session.customer);
          email = customer.email;
        } catch(e) {
          console.error('Could not retrieve customer:', e.message);
        }
      }
      if (email) {
        await sendPurchaseEmail(email, session.id);
        console.log('Purchase email sent to', email);
      } else {
        console.warn('Webhook: no email found for session', session.id);
      }
    };
    sendEmail().catch(err => console.error('Failed to send purchase email:', err.message));
  }

  res.sendStatus(200);
});

/* ── Start ───────────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`Truth Archive server running on http://localhost:${PORT}`);
  console.log(`Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST'}`);
});
