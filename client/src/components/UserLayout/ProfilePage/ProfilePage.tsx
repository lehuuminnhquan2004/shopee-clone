import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../auth/AuthContext";
import type { Gender, UserProfile } from "../../../types/user";
import { getMe } from "../../../api/userApi";
import { getApiErrorMessage } from "../../../lib/api";

export default function ProfilePage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const { user: profile } = await getMe(controller.signal);
        if (controller.signal.aborted) return;

        setUser(profile);
        setName(profile.fullName ?? "");
        setGender(profile.gender ?? "");

        // Tách chuỗi ngày để tránh đổi ngày do múi giờ.
        const [yyyy = "", mm = "", dd = ""] =
          profile.birthDate?.split("-") ?? [];
        setYear(yyyy);
        setMonth(mm ? String(Number(mm)) : "");
        setDay(dd ? String(Number(dd)) : "");
      } catch (error) {
        if (controller.signal.aborted || axios.isCancel(error)) return;
        setError(getApiErrorMessage(error, "Không thể tải thông tin hồ sơ"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [userId, retryCount]);

  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  // Giữ hiển thị năm đã lưu kể cả khi nằm ngoài danh sách mặc định.
  if (user?.birthDate) {
    const savedYear = Number(user.birthDate.slice(0, 4));
    if (!years.includes(savedYear)) {
      years.push(savedYear);
      years.sort((a, b) => b - a);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // gọi API cập nhật hồ sơ
  }

  if (!userId) return <p>Vui lòng đăng nhập để xem hồ sơ.</p>;
  if (loading) return <p role="status">Đang tải thông tin hồ sơ...</p>;
  if (error) {
    return (
      <section className="profile-page">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => {
          setLoading(true);
          setError(null);
          setRetryCount((previous) => previous + 1);
        }}>
          Thử lại
        </button>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <header className="profile-page__header">
        <h1>Hồ Sơ Của Tôi</h1>
        <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </header>

      <div className="profile-page__body">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-row">
            <label>Tên đăng nhập</label>
            <div className="profile-row__value">{user?.username}</div>
          </div>

          <div className="profile-row">
            <label htmlFor="name">Tên</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="profile-row">
            <label>Email</label>
            <div className="profile-row__value">
              {maskEmail(user?.email)} <a href="/user/email">Thay đổi</a>
            </div>
          </div>

          <div className="profile-row">
            <label>Số điện thoại</label>
            <div className="profile-row__value">
              {maskPhone(user?.phone)} <a href="/user/phone">Thay đổi</a>
            </div>
          </div>

          <div className="profile-row">
            <label>Giới tính</label>
            <div className="profile-row__radios">
              {([["male", "Nam"], ["female", "Nữ"], ["other", "Khác"]] as const).map(
                ([value, label]) => (
                  <label key={value} className="profile-radio">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === value}
                      onChange={() => setGender(value)}
                    />
                    {label}
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="profile-row">
            <label>Ngày sinh</label>
            <div className="profile-row__selects">
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                <option value="">Ngày</option>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">Tháng</option>
                {months.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Năm</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="profile-row">
            <span />
            <button type="submit" className="profile-save">Lưu</button>
          </div>
        </form>

        {/* <AvatarUploader /> */}
      </div>
    </section>
  );
}

function maskEmail(email?: string | null) {
  if (!email) return "Chưa có";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

function maskPhone(phone?: string | null) {
  if (!phone) return "Chưa có";
  return `${"*".repeat(Math.max(phone.length - 2, 0))}${phone.slice(-2)}`;
}
