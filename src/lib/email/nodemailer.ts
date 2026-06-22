import nodemailer from 'nodemailer';

interface SendCredentialsOptions {
  fullName: string;
  email: string;
  tempPassword: string;
  deptName: string;
  loginUrl: string;
}

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // If credentials are not set, return null (we will log to console)
  if (!host || !user || !pass) {
    return null;
  }

  // Optimize transport for Gmail service to resolve standard TLS handshaking issues
  if (host.includes('gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

export async function sendCredentialsEmail(options: SendCredentialsOptions): Promise<boolean> {
  const { fullName, email, tempPassword, deptName, loginUrl } = options;
  const transporter = getTransporter();

  const from = process.env.SMTP_FROM || '"E-Grievance Portal" <no-reply@egrievance.com>';
  const subject = `Welcome to the E-Grievance Portal - Department Account Credentials`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to the E-Grievance Portal</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          color: #1f2937;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
        }
        .welcome-msg {
          font-size: 18px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .credentials-card {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        .cred-item {
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
        }
        .cred-label {
          font-weight: 600;
          color: #475569;
        }
        .cred-value {
          font-family: monospace;
          color: #0f172a;
          font-size: 14px;
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .btn-container {
          text-align: center;
          margin-top: 32px;
        }
        .btn {
          display: inline-block;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          transition: background-color 0.2s;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>E-Grievance Portal</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Department User Account Setup</p>
        </div>
        <div class="content">
          <p class="welcome-msg">Hello ${fullName},</p>
          <p>An administrator has created a department user account for you. You have been assigned to the <strong>${deptName}</strong> department.</p>
          <p>Please find your account login credentials below:</p>
          
          <div class="credentials-card">
            <div class="cred-item">
              <span class="cred-label">Email:</span>
              <span class="cred-value">${email}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Temporary Password:</span>
              <span class="cred-value" style="font-weight: bold; color: #dc2626;">${tempPassword}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Department:</span>
              <span class="cred-value">${deptName}</span>
            </div>
          </div>

          <p style="color: #ef4444; font-size: 13px;"><strong>Security Note:</strong> It is highly recommended that you change this temporary password immediately after logging in for the first time.</p>
          
          <div class="btn-container">
            <a href="${loginUrl}" class="btn">Log In to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} E-Grievance Redressal System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n=========================================');
    console.log('DEVELOPMENT EMAIL SIMULATION:');
    console.log(`TO: ${email}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`FULL NAME: ${fullName}`);
    console.log(`TEMP PASSWORD: ${tempPassword}`);
    console.log(`DEPARTMENT: ${deptName}`);
    console.log(`LOGIN URL: ${loginUrl}`);
    console.log('=========================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send credentials email via Nodemailer:', error);
    // Fallback: print to console so developer doesn't lose credentials
    console.log('\n=========================================');
    console.log('FALLBACK EMAIL PRINT (SMTP FAILED):');
    console.log(`TO: ${email}`);
    console.log(`TEMP PASSWORD: ${tempPassword}`);
    console.log('=========================================\n');
    return false;
  }
}

interface SendGrievanceNotificationOptions {
  emails: string[];
  grievanceId: number;
  title: string;
  description: string;
  citizenName: string;
  deptName: string;
  detailsUrl: string;
}

export async function sendGrievanceNotificationEmail(options: SendGrievanceNotificationOptions): Promise<boolean> {
  const { emails, grievanceId, title, description, citizenName, deptName, detailsUrl } = options;
  const transporter = getTransporter();

  if (emails.length === 0) {
    return true; // No staff to notify
  }

  const from = process.env.SMTP_FROM || '"E-Grievance Portal" <no-reply@egrievance.com>';
  const subject = `New Grievance Allocated to ${deptName} - Case #GR-${grievanceId}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Grievance Allocation Alert</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          color: #1f2937;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #4f46e5 100%);
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
        }
        .alert-title {
          font-size: 18px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 16px;
          color: #1e3a8a;
        }
        .grievance-card {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }
        .item-label {
          font-weight: 600;
          color: #475569;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .item-value {
          color: #0f172a;
          font-size: 15px;
          margin-bottom: 16px;
        }
        .item-value.desc {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          white-space: pre-wrap;
        }
        .btn-container {
          text-align: center;
          margin-top: 32px;
        }
        .btn {
          display: inline-block;
          background-color: #4f46e5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
          transition: background-color 0.2s;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #f3f4f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Grievance Allocated</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Case Alert #GR-${grievanceId}</p>
        </div>
        <div class="content">
          <p class="alert-title">Hello Team,</p>
          <p>A new citizen grievance has been registered and auto-allocated to the <strong>${deptName}</strong> department. Please review the details below:</p>
          
          <div class="grievance-card">
            <div class="item-label">Case ID</div>
            <div class="item-value">#GR-${grievanceId}</div>
            
            <div class="item-label">Citizen Name</div>
            <div class="item-value">${citizenName}</div>

            <div class="item-label">Grievance Title</div>
            <div class="item-value" style="font-weight: bold; color: #0f172a;">${title}</div>

            <div class="item-label">Description</div>
            <div class="item-value desc">${description}</div>
          </div>
          
          <div class="btn-container">
            <a href="${detailsUrl}" class="btn">View in Staff Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated operational alert. Please do not reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} E-Grievance Redressal System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('\n=========================================');
    console.log('DEVELOPMENT EMAIL SIMULATION: NEW GRIEVANCE ALLOCATION');
    console.log(`TO: ${emails.join(', ')}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CASE ID: #GR-${grievanceId}`);
    console.log(`TITLE: ${title}`);
    console.log(`CITIZEN: ${citizenName}`);
    console.log(`DETAILS URL: ${detailsUrl}`);
    console.log('=========================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: emails.join(', '),
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Failed to send grievance alert email via Nodemailer:', error);
    return false;
  }
}

