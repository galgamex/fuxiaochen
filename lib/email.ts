import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("邮件发送成功:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("邮件发送失败:", error);
    return { success: false, error };
  }
}

export function generateVerificationEmailHtml(
  name: string,
  verificationCode: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>邮箱验证</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          border: 1px solid #e1e1e1;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #007bff;
          text-align: center;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          border: 2px dashed #007bff;
          margin: 20px 0;
          letter-spacing: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e1e1;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>邮箱验证</h1>
          <p>您好 ${name}，欢迎注册我们的网站！</p>
        </div>
        
        <p>请使用以下验证码完成邮箱验证：</p>
        
        <div class="code">${verificationCode}</div>
        
        <p>验证码将在 <strong>10分钟</strong> 后过期，请尽快完成验证。</p>
        
        <div class="footer">
          <p>如果您没有注册我们的网站，请忽略此邮件。</p>
          <p>此邮件由系统自动发送，请勿回复。</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmailHtml(
  name: string,
  resetCode: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>密码重置</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          border: 1px solid #e1e1e1;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #dc3545;
          text-align: center;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          border: 2px dashed #dc3545;
          margin: 20px 0;
          letter-spacing: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e1e1e1;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>密码重置</h1>
          <p>您好 ${name}，您请求重置密码。</p>
        </div>
        
        <p>请使用以下验证码重置您的密码：</p>
        
        <div class="code">${resetCode}</div>
        
        <p>验证码将在 <strong>10分钟</strong> 后过期，请尽快完成重置。</p>
        
        <div class="footer">
          <p>如果您没有请求重置密码，请忽略此邮件。</p>
          <p>此邮件由系统自动发送，请勿回复。</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 