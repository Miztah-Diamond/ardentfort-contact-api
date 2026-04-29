const nodemailer = require('nodemailer');

const ORIGINS = ['https://www.ardentfortlaw.com','https://ardentfortlaw.com','http://localhost:3000'];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ORIGINS.includes(origin) ? origin : ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fullName, email, organization, inquiryType, message } = req.body;
    if (!fullName || !email || !inquiryType || !message) return res.status(400).json({ error: 'Missing required fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (req.body._honey) return res.status(200).json({ success: true });

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com', port: 465, secure: true,
      auth: { user: process.env.ZOHO_EMAIL, pass: process.env.ZOHO_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: '"Ardent Fort Law Website" <' + process.env.ZOHO_EMAIL + '>',
      to: process.env.ZOHO_EMAIL,
      replyTo: '"' + fullName + '" <' + email + '>',
      subject: 'New Contact Inquiry - ' + inquiryType,
      html: '<h2>New Contact Inquiry</h2><p><b>Name:</b> ' + fullName + '</p><p><b>Email:</b> ' + email + '</p><p><b>Organization:</b> ' + (organization || 'N/A') + '</p><p><b>Type:</b> ' + inquiryType + '</p><p><b>Message:</b></p><p>' + message + '</p>'
    });

    await transporter.sendMail({
      from: '"Ardent Fort Law" <' + process.env.ZOHO_EMAIL + '>',
      to: email,
      subject: 'We Received Your Inquiry - Ardent Fort Law',
      html: '<p>Dear ' + fullName + ',</p><p>Thank you for reaching out. We received your inquiry regarding <b>' + inquiryType + '</b> and will respond within 24 hours.</p><p>Warm regards,<br>Ardent Fort Law</p>'
    });

    return res.status(200).json({ success: true, message: 'Inquiry sent successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};
