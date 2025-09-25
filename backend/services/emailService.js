const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send password notification email to employee
const sendPasswordNotificationEmail = async (employeeData, password) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"WorkPulse Hospital Management" <${process.env.EMAIL_FROM}>`,
      to: employeeData.email,
      subject: 'Your WorkPulse Account Password Has Been Set',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your WorkPulse Account Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 10px 10px; }
            .credentials { background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 WorkPulse Hospital</h1>
              <p>Employee Management System</p>
            </div>

            <div class="content">
              <h2>Hello ${employeeData.firstName} ${employeeData.lastName},</h2>

              <p>Your WorkPulse account password has been successfully set by the system administrator. You can now access your employee dashboard using the credentials below.</p>

              <div class="credentials">
                <h3>🔐 Login Credentials</h3>
                <p><strong>Employee ID:</strong> ${employeeData.employeeId}</p>
                <p><strong>Email:</strong> ${employeeData.email}</p>
                <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 3px;">${password}</code></p>
                <p><strong>Login URL:</strong> <a href="${process.env.FRONTEND_URL}/login">Login to WorkPulse</a></p>
              </div>

              <div class="warning">
                <h4>⚠️ Important Security Notice</h4>
                <ul>
                  <li>Please change your password after your first login</li>
                  <li>Do not share your credentials with anyone</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Contact HR if you have any issues accessing your account</li>
                </ul>
              </div>

              <p>Your account details:</p>
              <ul>
                <li><strong>Name:</strong> ${employeeData.firstName} ${employeeData.lastName}</li>
                <li><strong>Department:</strong> ${employeeData.department}</li>
                <li><strong>Designation:</strong> ${employeeData.designation}</li>
                <li><strong>Employee ID:</strong> ${employeeData.employeeId}</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" class="button">Login to WorkPulse Dashboard</a>
              </div>

              <p>If you have any questions or need assistance, please contact your HR department or system administrator.</p>

              <p>Welcome to the WorkPulse team!</p>

              <p>Best regards,<br>WorkPulse Hospital Management System</p>
            </div>

            <div class="footer">
              <p>&copy; 2025 WorkPulse Hospital Management System. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending password notification email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to new employee (HR registration)
const sendWelcomeEmail = async (employeeData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"WorkPulse Hospital Management" <${process.env.EMAIL_FROM}>`,
      to: employeeData.email,
      subject: 'Welcome to WorkPulse Hospital - Account Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to WorkPulse Hospital</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; border-radius: 0 0 10px 10px; }
            .info-box { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Welcome to WorkPulse Hospital</h1>
              <p>Employee Management System</p>
            </div>

            <div class="content">
              <h2>Hello ${employeeData.firstName} ${employeeData.lastName},</h2>

              <p>Welcome to WorkPulse Hospital! Your employee account has been successfully created by our HR department.</p>

              <div class="info-box">
                <h3>📋 Your Account Information</h3>
                <p><strong>Employee ID:</strong> ${employeeData.employeeId}</p>
                <p><strong>Email:</strong> ${employeeData.email}</p>
                <p><strong>Department:</strong> ${employeeData.department}</p>
                <p><strong>Designation:</strong> ${employeeData.designation}</p>
                <p><strong>Joining Date:</strong> ${new Date(employeeData.joiningDate).toLocaleDateString()}</p>
              </div>

              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Your system administrator will set up your login password</li>
                <li>You will receive another email with your login credentials</li>
                <li>Once you receive your password, you can access your employee dashboard</li>
                <li>Please contact HR if you don't receive your password within 24 hours</li>
              </ol>

              <p>We're excited to have you join our team and look forward to working with you!</p>

              <p>Best regards,<br>HR Department<br>WorkPulse Hospital</p>
            </div>

            <div class="footer">
              <p>&copy; 2025 WorkPulse Hospital Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordNotificationEmail,
  sendWelcomeEmail
};