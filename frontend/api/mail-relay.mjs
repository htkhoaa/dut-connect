import { createHash, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';

const authUrl = 'https://dut-connect.onrender.com/api/v1/auth/me';
const reply = (status, body) =>
    Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** Only accepts a short-lived, payload-bound token minted by the Java backend. */
export async function POST(request) {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) return reply(401, { accepted: false });
    const token = authorization.slice(7);
    let claims;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token');
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        const now = Math.floor(Date.now() / 1000);
        if (
            header.alg !== 'HS256' ||
            claims.purpose !== 'campaign-mail-relay' ||
            claims.iss !== 'dut-connect' ||
            !Number.isInteger(claims.exp) ||
            !Number.isInteger(claims.iat) ||
            claims.exp <= now ||
            claims.iat > now + 10 ||
            claims.exp - claims.iat > 60 ||
            claims.exp <= claims.iat ||
            !/^[a-f0-9]{64}$/.test(claims.mailHash || '')
        )
            throw new Error('Invalid token');
    } catch {
        return reply(401, { accepted: false });
    }

    let mail;
    try {
        const raw = await request.text();
        if (raw.length > 3_000_000) return reply(413, { accepted: false });
        const envelope = JSON.parse(raw);
        if (typeof envelope.payload !== 'string') throw new Error('Missing payload');
        const payload = Buffer.from(envelope.payload, 'base64');
        const expected = Buffer.from(claims.mailHash, 'hex');
        const actual = createHash('sha256').update(payload).digest();
        if (!timingSafeEqual(expected, actual)) throw new Error('Payload mismatch');
        mail = JSON.parse(payload.toString('utf8'));
        if (
            ![mail.recipient, mail.subject, mail.html, mail.attachmentName, mail.attachment].every(
                (value) => typeof value === 'string' && value.length > 0,
            ) ||
            mail.contentType !== 'image/png'
        )
            throw new Error('Invalid message');
    } catch {
        return reply(400, { accepted: false });
    }

    try {
        // The backend verifies the JWT signature and account status. Decoding alone is never trusted.
        const validation = await fetch(authUrl, {
            headers: { Authorization: authorization },
            signal: AbortSignal.timeout(8000),
        });
        if (!validation.ok) return reply(401, { accepted: false });
        const actor = await validation.json();
        if (actor.id !== claims.sub || actor.status !== 'ACTIVE')
            return reply(403, { accepted: false });
    } catch {
        return reply(503, { accepted: false, code: 'MAIL_CONNECTION_FAILED' });
    }

    const user = process.env.SPRING_MAIL_USERNAME;
    const pass = process.env.SPRING_MAIL_PASSWORD;
    const from = process.env.APP_MAIL_FROM;
    if (process.env.APP_MAIL_ENABLED !== 'true' || !user || !pass || !from) {
        return reply(200, { accepted: false, code: 'MAIL_UNAVAILABLE' });
    }
    const smtp = nodemailer.createTransport({
        host: process.env.SPRING_MAIL_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SPRING_MAIL_PORT || 2525),
        secure: false,
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    });
    try {
        const image = Buffer.from(mail.attachment, 'base64');
        const result = await smtp.sendMail({
            from,
            to: mail.recipient,
            subject: mail.subject,
            html: mail.html,
            messageId: `<${claims.jti}@dutconnect.vercel.app>`,
            attachments: [
                { filename: mail.attachmentName, content: image, contentType: 'image/png' },
                {
                    filename: 'certificate.png',
                    content: image,
                    contentType: 'image/png',
                    cid: 'certificateImage',
                },
            ],
        });
        return reply(200, { accepted: result.accepted.length > 0, code: 'MAIL_DELIVERY_FAILED' });
    } catch (error) {
        const code =
            error.code === 'EAUTH'
                ? 'MAIL_AUTHENTICATION_FAILED'
                : ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EDNS'].includes(error.code)
                  ? 'MAIL_CONNECTION_FAILED'
                  : 'MAIL_DELIVERY_FAILED';
        return reply(200, { accepted: false, code });
    } finally {
        smtp.close();
    }
}

export function GET() {
    return reply(405, { accepted: false, message: 'POST required' });
}
