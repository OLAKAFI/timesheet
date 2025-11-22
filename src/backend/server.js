const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create transporter (using Gmail - you can use any service)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS  // Your app password
  }
});

// Email endpoints
app.post('/api/send-booking-confirmation', async (req, res) => {
  try {
    const { guestEmail, guestName, date, startTime, endTime, duration } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: guestEmail,
      subject: 'Booking Request Received - Pending Approval',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Booking Request Received</h2>
          <p>Dear <strong>${guestName}</strong>,</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #006D7D; margin-top: 0;">Booking Details:</h3>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
          </div>
          
          <p>Your booking request has been received and is currently <strong style="color: #ffc107;">pending approval</strong>.</p>
          <p>You will receive another email once the calendar owner approves your booking.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Appointment System
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to: ${guestEmail}`);
    res.json({ success: true, message: 'Confirmation email sent successfully' });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-booking-approval', async (req, res) => {
  try {
    const { guestEmail, guestName, date, startTime, endTime, duration, location, meetingType, videoLink, notes } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: guestEmail,
      subject: 'Booking Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Booking Approved! 🎉</h2>
          <p>Dear <strong>${guestName}</strong>,</p>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">Approved Booking Details:</h3>
            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
            <p><strong>Duration:</strong> ${duration} minutes</p>
            <p><strong>Meeting Type:</strong> ${meetingType}</p>
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            ${videoLink ? `<p><strong>Video Link:</strong> <a href="${videoLink}">${videoLink}</a></p>` : ''}
          </div>

          ${notes ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #856404; margin-top: 0;">Additional Notes:</h4>
            <p>${notes}</p>
          </div>
          ` : ''}

          <p style="color: #155724; font-weight: bold;">Your booking has been approved! We look forward to seeing you.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              Appointment System
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to: ${guestEmail}`);
    res.json({ success: true, message: 'Approval email sent successfully' });
  } catch (error) {
    console.error('Error sending approval email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});