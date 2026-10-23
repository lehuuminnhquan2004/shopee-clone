import "dotenv/config";
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpUser || !smtpPass) {
  throw new Error("Thiếu SMTP_USER hoặc SMTP_PASS");
}

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendRegistrationOtp(
  email: string,
  otp: string,
  expiresAt: Date,
): Promise<void> {
  await mailTransporter.sendMail({
    from: {
      name: "Sàn TMĐT MiQ",
      address: smtpUser,
    },
    to: email,
    subject: "Mã xác nhận đăng ký tài khoản",
    text: [
      `Mã xác nhận đăng ký của bạn là: ${otp}`,
      "",
      `Mã hết hạn lúc ${expiresAt.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      })} (giờ Việt Nam).`,
      "Chỉ sử dụng mã trong email được gửi gần nhất.",
      "Không chia sẻ mã này với người khác.",
      "Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.",
    ].join("\n"),
  });
}