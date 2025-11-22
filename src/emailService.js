// src/emailService.js - UPDATED VERSION
import emailjs from '@emailjs/browser';


// EmailJS Configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
const EMAILJS_CONFIG = {
  serviceId: 'service_zhhkd1q', // From EmailJS dashboard
  confirmationTemplateId: 'template_1197gg9', // For booking confirmation
  approvalTemplateId: 'template_iqrduqi', // For approval emails
  publicKey: 'F_TZefJXRm6XDqVO1' // From EmailJS account
};

// Initialize EmailJS
if (EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey !== 'F_TZefJXRm6XDqVO1') {
  emailjs.init(EMAILJS_CONFIG.publicKey);
} else {
  console.warn('⚠️ EmailJS not configured - using fallback email logging');
}

// Enhanced email sending with better error handling
const sendEmailJS = async (templateId, templateParams) => {
  // Check if EmailJS is properly configured
  if (!EMAILJS_CONFIG.publicKey || EMAILJS_CONFIG.publicKey === 'F_TZefJXRm6XDqVO1') {
    throw new Error('EmailJS not configured. Please set up your EmailJS credentials.');
  }

  try {
    console.log('📧 Sending email with EmailJS...');
    console.log('Template ID:', templateId);
    console.log('Template Params:', templateParams);
    
    const result = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams
    );
    
    console.log('✅ EmailJS response:', result);
    return result;
  } catch (error) {
    console.error('❌ EmailJS error:', error);
    throw error;
  }
};

// Fallback email function that shows what would be sent
const sendFallbackEmail = async (to, subject, message) => {
  console.log('📧 FALLBACK EMAIL (Not actually sent):');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Message:', message);
  
  // Create a mailto link for manual testing
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  console.log('📨 Manual email link:', mailtoLink);
  
  return Promise.resolve({ status: 200, text: 'EMAIL_LOGGED' });
};

export const sendBookingConfirmationEmail = async (bookingData) => {
  const templateParams = {
    to_email: bookingData.guestEmail,
    to_name: bookingData.guestName,
    from_name: 'Appointment System',
    subject: 'Booking Request Received - Pending Approval',
    guest_name: bookingData.guestName,
    booking_date: new Date(bookingData.date).toLocaleDateString(),
    booking_time: `${bookingData.startTime} - ${bookingData.endTime}`,
    booking_duration: `${bookingData.duration} minutes`,
    message: `Dear ${bookingData.guestName}, your booking request for ${new Date(bookingData.date).toLocaleDateString()} at ${bookingData.startTime} has been received and is pending approval.`
  };

  try {
    const result = await sendEmailJS(EMAILJS_CONFIG.confirmationTemplateId, templateParams);
    return result;
  } catch (error) {
    console.error('Failed to send confirmation email with EmailJS, using fallback:', error);
    
    // Fallback
    return sendFallbackEmail(
      bookingData.guestEmail,
      'Booking Request Received - Pending Approval',
      `Dear ${bookingData.guestName},

Your booking request has been received and is pending approval.

Booking Details:
- Date: ${bookingData.date}
- Time: ${bookingData.startTime} - ${bookingData.endTime}
- Duration: ${bookingData.duration} minutes

Status: Pending Approval

We will notify you once the calendar owner approves your booking.

Best regards,
Appointment System`
    );
  }
};

export const sendBookingApprovalEmail = async (bookingData) => {
  const templateParams = {
    to_email: bookingData.guestEmail,
    to_name: bookingData.guestName,
    from_name: 'Appointment System',
    subject: 'Booking Approved!',
    guest_name: bookingData.guestName,
    booking_date: new Date(bookingData.date).toLocaleDateString(),
    booking_time: `${bookingData.startTime} - ${bookingData.endTime}`,
    booking_duration: `${bookingData.duration} minutes`,
    meeting_type: bookingData.meetingType || 'In Person',
    location: bookingData.location || 'To be determined',
    video_link: bookingData.videoLink || '',
    additional_notes: bookingData.notes || '',
    message: `Dear ${bookingData.guestName}, your booking has been approved!`
  };

  try {
    const result = await sendEmailJS(EMAILJS_CONFIG.approvalTemplateId, templateParams);
    return result;
  } catch (error) {
    console.error('Failed to send approval email with EmailJS, using fallback:', error);
    
    // Fallback
    return sendFallbackEmail(
      bookingData.guestEmail,
      'Booking Approved!',
      `Dear ${bookingData.guestName},

Great news! Your booking has been approved.

Approved Booking Details:
- Date: ${bookingData.date}
- Time: ${bookingData.startTime} - ${bookingData.endTime}
- Duration: ${bookingData.duration} minutes
- Meeting Type: ${bookingData.meetingType || 'In Person'}
- Location: ${bookingData.location || 'To be determined'}
${bookingData.videoLink ? `- Video Link: ${bookingData.videoLink}\n` : ''}
${bookingData.notes ? `Additional Notes: ${bookingData.notes}\n` : ''}
We look forward to seeing you!

Best regards,
Appointment System`
    );
  }
};


// const RESEND_API_KEY = 're_355nu9n7_2uFtGftBSDcCRVh4smpZmjAM'; // Get from resend.com

// export const sendBookingConfirmationEmail = async (bookingData) => {
//   try {
//     const response = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${RESEND_API_KEY}`
//       },
//       body: JSON.stringify({
//         from: 'Appointment System <onboarding@resend.dev>',
//         to: [bookingData.guestEmail],
//         subject: 'Booking Request Received - Pending Approval',
//         html: `
//           <h2>Booking Request Received</h2>
//           <p>Dear ${bookingData.guestName},</p>
//           <p>Your booking request has been received and is pending approval.</p>
//           <p><strong>Date:</strong> ${bookingData.date}</p>
//           <p><strong>Time:</strong> ${bookingData.startTime} - ${bookingData.endTime}</p>
//         `
//       })
//     });

//     if (!response.ok) throw new Error('Failed to send email');
    
//     console.log('Confirmation email sent via Resend');
//     return { success: true };
//   } catch (error) {
//     console.error('Resend email failed:', error);
//     // Fallback to console log
//     console.log('Email would be sent to:', bookingData.guestEmail);
//     return { success: true, fallback: true };
//   }
// };

// export const sendBookingApprovalEmail = async (bookingData) => {
//   try {
//     const response = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${RESEND_API_KEY}`
//       },
//       body: JSON.stringify({
//         from: 'Appointment System <onboarding@resend.dev>',
//         to: [bookingData.guestEmail],
//         subject: 'Booking Approved!',
//         html: `
//           <h2>Booking Approved! 🎉</h2>
//           <p>Dear ${bookingData.guestName},</p>
//           <p>Your booking has been approved!</p>
//           <p><strong>Date:</strong> ${bookingData.date}</p>
//           <p><strong>Time:</strong> ${bookingData.startTime} - ${bookingData.endTime}</p>
//           ${bookingData.location ? `<p><strong>Location:</strong> ${bookingData.location}</p>` : ''}
//         `
//       })
//     });

//     if (!response.ok) throw new Error('Failed to send email');
    
//     console.log('Approval email sent via Resend');
//     return { success: true };
//   } catch (error) {
//     console.error('Resend email failed:', error);
//     // Fallback to console log
//     console.log('Approval email would be sent to:', bookingData.guestEmail);
//     return { success: true, fallback: true };
//   }
// };