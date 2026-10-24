import "dotenv/config";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

export async function verifyGoogleIdToken(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        throw new Error("Không có GOOGLE_CLIENT_ID")
    }
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
    })
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
        throw new Error("Google token thiếu thông tin tài khoản");
    }

    return payload;
}