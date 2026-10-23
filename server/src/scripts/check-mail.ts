import { mailTransporter } from "../lib/mail.js";

async function main(): Promise<void> {
  await mailTransporter.verify();
  console.log("Kết nối và xác thực SMTP thành công");
}

main().catch(() => {
  console.error(
    "Không kết nối được SMTP. Kiểm tra tài khoản, mật khẩu ứng dụng và mạng.",
  );
  process.exitCode = 1;
});