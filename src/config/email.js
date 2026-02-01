const nodemailer = require('nodemailer');

// Create email transporter using Brevo
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Brevo SMTP Connection Error:', error);
  } else {
    console.log('Brevo SMTP Server is ready to send emails');
  }
});

// Send confirmation email
const sendConfirmationEmail = async (email, confirmationLink) => {
  try {
    const mailOptions = {
      from: process.env.BREVO_FROM_EMAIL,
      to: email,
      subject: 'Welcome to BioMed Newsletter - Confirm Your Subscription',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dwpkrvrfk/image/upload/v1769959139/logo_l2ja8n.png" alt="BioMed Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2>Welcome to BioMed Newsletter!</h2>
          <p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>
          <p>Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${confirmationLink}">${confirmationLink}</a></p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If you didn't subscribe to this newsletter, please ignore this email.
          </p>
          <p style="font-size: 12px; color: #666;">
            BioMed Newsletter | Medical Education Platform
          </p>
        </div>
      `,
      text: `Welcome to BioMed Newsletter!\n\nPlease confirm your email by visiting:\n${confirmationLink}\n\nThis link will expire in 24 hours.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', result.response);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

// Send welcome email after confirmation
const sendWelcomeEmail = async (email) => {
  try {
    const mailOptions = {
      from: process.env.BREVO_FROM_EMAIL,
      to: email,
      subject: 'You\'re All Set! Welcome to BioMed Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dwpkrvrfk/image/upload/v1769959139/logo_l2ja8n.png" alt="BioMed Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2>Welcome to BioMed!</h2>
          <p>Your email has been confirmed. You're now subscribed to our newsletter.</p>
          <p>You'll receive:</p>
          <ul>
            <li>Latest medical research and insights</li>
            <li>Educational articles and tutorials</li>
            <li>Course updates and announcements</li>
            <li>Exclusive member-only content</li>
          </ul>
          <p>Thank you for being part of our community!</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            BioMed Newsletter | Medical Education Platform
          </p>
        </div>
      `,
      text: 'Welcome to BioMed! You are now subscribed to our newsletter.'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.response);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send unsubscribe confirmation email
const sendUnsubscribeEmail = async (email) => {
  try {
    const mailOptions = {
      from: process.env.BREVO_FROM_EMAIL,
      to: email,
      subject: 'You\'ve Been Unsubscribed from BioMed Newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dwpkrvrfk/image/upload/v1769959139/logo_l2ja8n.png" alt="BioMed Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2>Unsubscribe Confirmation</h2>
          <p>You have been unsubscribed from the BioMed Newsletter.</p>
          <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            BioMed Newsletter | Medical Education Platform
          </p>
        </div>
      `,
      text: 'You have been unsubscribed from the BioMed Newsletter.'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Unsubscribe email sent:', result.response);
    return true;
  } catch (error) {
    console.error('Error sending unsubscribe email:', error);
    throw error;
  }
};

// Send contact form confirmation email to user
const sendContactConfirmationEmail = async (email, fullName) => {
  try {
    const mailOptions = {
      from: process.env.BREVO_FROM_EMAIL,
      to: email,
      subject: 'We Received Your Message - BioMed Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dwpkrvrfk/image/upload/v1769959139/logo_l2ja8n.png" alt="BioMed Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2>Thank You for Contacting BioMed!</h2>
          <p>Dear ${fullName},</p>
          <p>We have received your message and appreciate you reaching out to us.</p>
          <p>Our support team will review your inquiry and get back to you as soon as possible.</p>
          <p>In the meantime, if you have any urgent questions, please feel free to contact us at:</p>
          <p style="margin: 20px 0;">
            <strong>Email:</strong> ${process.env.SUPPORT_EMAIL}<br>
            <strong>Phone:</strong> ${process.env.SUPPORT_PHONE}
          </p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            BioMed Support Team | Medical Education Platform
          </p>
        </div>
      `,
      text: `Thank you for contacting BioMed!\n\nWe have received your message and will get back to you soon.\n\nSupport Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Contact confirmation email sent:', result.response);
    return true;
  } catch (error) {
    console.error('Error sending contact confirmation email:', error);
    throw error;
  }
};

// Send contact form notification email to admin
const sendContactAdminNotificationEmail = async (contactData) => {
  try {
    const mailOptions = {
      from: process.env.BREVO_FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission from ${contactData.full_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://res.cloudinary.com/dwpkrvrfk/image/upload/v1769959139/logo_l2ja8n.png" alt="BioMed Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2>New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold; width: 30%;">Name:</td>
              <td style="padding: 10px;">${contactData.full_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">Email:</td>
              <td style="padding: 10px;"><a href="mailto:${contactData.email}">${contactData.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">Phone:</td>
              <td style="padding: 10px;">${contactData.country_code || ''} ${contactData.phone_number || 'Not provided'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">Topic:</td>
              <td style="padding: 10px;">${contactData.interest_topic || 'Not specified'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; font-weight: bold;">Message:</td>
              <td style="padding: 10px; white-space: pre-wrap;">${contactData.message}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold;">Submitted:</td>
              <td style="padding: 10px;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification. Please log into the admin panel to manage this inquiry.
          </p>
        </div>
      `,
      text: `New Contact Form Submission\n\nName: ${contactData.full_name}\nEmail: ${contactData.email}\nPhone: ${contactData.country_code} ${contactData.phone_number}\nTopic: ${contactData.interest_topic}\nMessage: ${contactData.message}`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent:', result.response);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

module.exports = {
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendUnsubscribeEmail,
  sendContactConfirmationEmail,
  sendContactAdminNotificationEmail,
  transporter
};
