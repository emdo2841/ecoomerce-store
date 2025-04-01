// const nodemailer = require("nodemailer");
// require("dotenv").config();

// // Create transporter function
// const emailAuth = async () => {
//   return nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
// };

// // Universal sendEmail function
// const sendEmail = async (email, firstname, resetLink = null, ) => {
//   try {
//     const transporter = await emailAuth();

//     let subject, htmlContent;

//     if (resetLink) {
//       subject = "Password Reset Request";
//       htmlContent = `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <h2>Password Reset Request</h2>
//           <p>Hello ${firstname},</p>
//           <p>Click the link below to reset your password:</p>
//           <p><a href="${resetLink}">${resetLink}</a></p>
//           <p>This link will expire in 1 hour. If you did not request this, please ignore it.</p>
//         </div>
//       `;
//     } else {
//       subject = "Congratulations on Your Successful Registration";
//       htmlContent = `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <h1>Welcome, ${firstname}!</h1>
//           <p>Thank you for registering with Ndoma ECommerce Store.</p>
//           <p>Click <a href="https://localhost:7000/api/product">here</a> to browse through our quality goods.</p>
//         </div>
//       `;
//     }

//     const mailOptions = {
//       from: `"EJ ECOMMERCE STORES" <${process.env.EMAIL}>`,
//       to: email,
//       subject: subject,
//       html: htmlContent,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent to ${email}`);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// module.exports = sendEmail;
  

const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter function
const emailAuth = async () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Universal sendEmail function
const sendEmail = async (email, firstname, resetLink = null, isPasswordChanged = false) => {
  try {
    const transporter = await emailAuth();

    let subject, htmlContent;

    if (resetLink) {
      // Password Reset Request
      subject = "Password Reset Request";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Reset Request</h2>
          <p>Hello ${firstname},</p>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour. If you did not request this, please ignore it.</p>
        </div>
      `;
    } else if (isPasswordChanged) {
      // Password Changed Successfully
      subject = "Your Password Has Been Changed";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Password Changed Successfully</h2>
          <p>Hello ${firstname},</p>
          <p>Your password has been updated successfully.</p>
          <p>If you did not request this change, please contact our support team immediately.</p>
        </div>
      `;
    } else {
      // Registration Success
      subject = "Congratulations on Your Successful Registration";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1>Welcome, ${firstname}!</h1>
          <p>Thank you for registering with Ndoma ECommerce Store.</p>
          <p>Click <a href="https://localhost:7000/api/product">here</a> to browse through our quality goods.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"EJ ECOMMERCE STORES" <${process.env.EMAIL}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = sendEmail;
