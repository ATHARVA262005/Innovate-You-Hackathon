import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        console.log(`✅ Email sent to ${to}: ${subject}`);
        return { success: true, message: "Email sent successfully!" };
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return { success: false, message: "Failed to send email" };
    }
};
