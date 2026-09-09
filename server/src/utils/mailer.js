import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// ponytail: lazy singleton, no connection pooling config - fine at this app's send volume
let transporter = null;

const getTransporter = () => {
    if (!env.email.user || !env.email.password || (!env.email.service && !env.email.host)) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport(
            env.email.service
                ? { service: env.email.service, auth: { user: env.email.user, pass: env.email.password } }
                : { host: env.email.host, port: env.email.port, secure: env.email.port === 465, auth: { user: env.email.user, pass: env.email.password } }
        );
    }
    return transporter;
};

// Returns true if an email was actually sent, false if SMTP isn't configured
export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    const t = getTransporter();
    if (!t) return false;

    await t.sendMail({
        from: env.email.from,
        to: toEmail,
        subject: 'Reset your Expense Tracker password',
        html: `
            <p>You requested a password reset.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        `
    });
    return true;
};
