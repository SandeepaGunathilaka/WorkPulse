const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Email Configuration:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***hidden***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

const testEmail = async () => {
  try {
    console.log('\n🧪 Testing email configuration...');

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('✅ Transporter created successfully');

    // Verify SMTP connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmployee = {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@hospital.lk', // Replace with actual test email
      employeeId: 'EMP20250999',
      department: 'Emergency',
      designation: 'Nurse'
    };

    const mailOptions = {
      from: `"WorkPulse Hospital Management" <${process.env.EMAIL_FROM}>`,
      to: testEmployee.email,
      subject: 'Test Email - Password Notification',
      text: `Hello ${testEmployee.firstName},\n\nThis is a test email from WorkPulse Hospital Management System.\n\nYour login credentials:\nEmployee ID: ${testEmployee.employeeId}\nEmail: ${testEmployee.email}\nPassword: TestPassword123\n\nBest regards,\nWorkPulse Team`,
      html: `
        <h1>Test Email - WorkPulse Hospital</h1>
        <p>Hello ${testEmployee.firstName} ${testEmployee.lastName},</p>
        <p>This is a test email from WorkPulse Hospital Management System.</p>
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <h3>Login Credentials</h3>
          <p><strong>Employee ID:</strong> ${testEmployee.employeeId}</p>
          <p><strong>Email:</strong> ${testEmployee.email}</p>
          <p><strong>Password:</strong> TestPassword123</p>
        </div>
        <p>Best regards,<br>WorkPulse Team</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
};

testEmail();