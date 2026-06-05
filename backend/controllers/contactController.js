const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Save to database
    const contact = await Contact.create({ name, email, subject, message });

    // Send email notification (optional - wont fail if email fails)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"The Silent Route" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📩 New Contact: ${subject}`,
        html: `
          <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
            <h2 style="color: #e94560;">New Message - The Silent Route</h2>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr/>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.log('Email send failed (non-critical):', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon. 🙏'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};