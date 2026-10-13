# SCOPE: WEBSITE THƯƠNG MẠI ĐIỆN TỬ (SÀN NHIỀU SHOP)

> **Quy ước:** ĐVVC = đơn vị vận chuyển. Sàn = hệ thống website.

---

## 1. Tổng quan

- Website phục vụ người mua và người bán, có admin quản trị.
- Người dùng có thể mua hàng và tạo shop để bán hàng.
- Người dùng tìm kiếm sản phẩm và mua từ nhiều shop trong cùng một lần đặt hàng.
- Mỗi lần đặt hàng được tách thành một **đơn con** cho mỗi shop. Mỗi đơn con có trạng thái, vận chuyển và tiền riêng.
- Phí giao hàng hiện tại để 0đ (làm sau).

---

## 2. Phạm vi

**Làm trong phiên bản này**
- Tài khoản, địa chỉ, shop, danh mục, sản phẩm và biến thể
- Giỏ hàng, đặt hàng, thanh toán COD và thanh toán online (giả lập)
- Trạng thái đơn, hủy đơn, giao thất bại, hoàn đơn
- Dòng tiền: sàn giữ tiền, giải ngân cho shop, phí sàn, ví người dùng, công nợ ĐVVC
- Đánh giá sản phẩm
- Mô phỏng ĐVVC (cron job, trang shipper, demo tua nhanh)
- Admin cơ bản

**Chưa làm**
- Chat
- Flash Sale
- Phí vận chuyển (tạm để 0đ)
- Rút tiền của shop
- Quét QR và nạp tiền thật (hiện chỉ giả lập)
- Tranh chấp đơn hoàn (admin phân xử)
- Xử lý đơn đang chạy và tiền đang giữ khi khóa shop
- Phạt shop khi hủy đơn sau khi đã xác nhận

---

## 3. Người dùng và tài khoản

**Địa chỉ**
- Mỗi địa chỉ gồm: tên người nhận + số điện thoại + địa chỉ (một bản ghi).
- Một người dùng có thể lưu nhiều địa chỉ.
- Phải có ít nhất một địa chỉ mới mua hàng được.
- Khi đặt hàng, địa chỉ được lưu bản sao vào đơn để việc khách sửa hoặc xóa địa chỉ sau này không làm hỏng đơn cũ.

**Shop**
- Mỗi người dùng tạo được tối đa 1 shop.
- Tạo shop không cần admin duyệt.
- Shop không được mua sản phẩm của chính mình.

**Ví người dùng trên web**
- Mỗi người dùng có một ví trên web để thanh toán online và nhận tiền hoàn.
- Nạp tiền vào ví hiện làm giả lập.

**Tài khoản admin**
- Tạo bằng seed script.

---

## 4. Danh mục và sản phẩm

**Danh mục**

Danh mục do sàn cung cấp. Shop khi đăng sản phẩm phải chọn danh mục gồm 3 cấp:

| Cấp | Tên | Mô tả | Ví dụ |
|---|---|---|---|
| 1 | Danh mục gốc | Các nhóm ngành lớn | Thời trang nam, Mỹ phẩm, Nhà cửa & Đời sống, Thiết bị điện tử |
| 2 | Danh mục con | Chia nhỏ từ cấp 1 | Trong Thời trang nam: Áo khoác, Quần jeans, Áo thun |
| 3 | Danh mục chi tiết | Chia nhỏ sâu nhất, dùng để hiển thị bộ lọc thuộc tính | Trong Quần jeans: Quần jeans ống suông, Quần jeans skinny |

- Người mua tìm kiếm và lọc sản phẩm theo danh mục.

**Sản phẩm (người bán)**
- Shop có thể thêm, sửa, xóa sản phẩm để người mua nhìn thấy và mua.
- Mỗi sản phẩm có các option mở rộng: màu, size, biến thể (màu × size).
- Mỗi biến thể có giá và số lượng tồn kho riêng.
- Xóa sản phẩm là **xóa mềm** (ẩn đi), vì đã có đơn hàng tham chiếu đến nó.

---

## 5. Giỏ hàng và đặt hàng

**Giỏ hàng**
- Thêm vào giỏ để mua sau, hoặc bấm "Mua ngay" tại trang shop.
- Trong giỏ, chọn các sản phẩm muốn mua ngay. Sản phẩm chưa chọn vẫn được lưu trong giỏ.
- Giá trong giỏ cập nhật theo giá thực tế hiện tại của shop.

**Khi bấm đặt hàng**
- Kiểm tra lại giá và tồn kho hiện tại.
- Shop không được đặt sản phẩm của chính mình.
- Đặt hàng thành công thì trừ tồn kho của biến thể ngay.
- Việc kiểm tra và trừ tồn kho nằm trong **cùng một giao dịch database**.
- Giỏ có sản phẩm của nhiều shop thì tách thành nhiều đơn con. Với thanh toán online, một lần thanh toán chứa nhiều đơn con; hủy và hoàn tiền xử lý theo từng đơn con.

**Dữ liệu lưu trong đơn**
- Bản sao tên, ảnh, biến thể và giá tại lúc đặt. Shop đổi giá sau đó thì đơn cũ không bị ảnh hưởng.
- Bản sao địa chỉ giao hàng.

---

## 6. Thanh toán

**COD**
- Khách trả tiền mặt cho ĐVVC khi nhận hàng.
- Khi giao thành công, ĐVVC có trách nhiệm nộp tiền thu được cho sàn (xem mục 12).

**Thanh toán online**
- Khách thanh toán trước bằng quét QR hoặc ví trên web. Hiện giả lập, làm thật sau.
- Khi nhận hàng, khách không cần trả thêm tiền.
- Tiền khách thanh toán được sàn giữ, rồi giải ngân cho shop theo mục 10.
- Đơn online chờ thanh toán quá 30 phút (có thể chỉnh) thì tự hủy và cộng lại kho.

---

## 7. Trạng thái đơn hàng (đơn con)

**Đơn COD**

```
Chờ người bán xác nhận
  -> Đang chuẩn bị hàng     (người bán đã xác nhận)
  -> Chờ giao hàng          (ĐVVC đã lấy hàng; giả lập shipper bấm "Đã lấy hàng")
  -> Giao thành công        (ĐVVC bấm khi giao cho khách)
  -> Hoàn tất               (sau 15 ngày kể từ lúc giao thành công mà khách không yêu cầu hoàn đơn)
```

**Đơn thanh toán online**

```
Chờ thanh toán
  -> Thanh toán thành công
  -> Chờ người bán xác nhận
  -> Đang chuẩn bị hàng -> Chờ giao hàng -> Giao thành công -> Hoàn tất   (giống đơn COD)
```

**Các nhánh khác**

| Tình huống | Kết quả |
|---|---|
| Khách hủy, shop từ chối, shop không xác nhận quá 12 giờ, hoặc quá hạn thanh toán | Đã hủy |
| Khách không nhận hàng (bom hàng) | Giao thất bại, hàng về shop |
| Khách yêu cầu hoàn đơn | Yêu cầu hoàn -> Đang hoàn về shop -> Đã hoàn đơn |

**Quy tắc chung**
- Người bán xác nhận hoặc từ chối đơn ở bước "Chờ người bán xác nhận". Quá 12 giờ không xác nhận thì tự hủy.
- "Khách bấm Đã nhận hàng" là một **sự kiện** (giải ngân sớm, xem mục 10), không phải một trạng thái.
- Trạng thái "Hoàn tất" do cron job chuyển khi hết 15 ngày kể từ lúc giao thành công và không có yêu cầu hoàn đang mở.

---

## 8. Hủy đơn

**Khách hủy đơn**
- Khi đơn ở "Chờ thanh toán" (đơn online) hoặc "Chờ người bán xác nhận": khách tự hủy ngay, không cần shop duyệt.
- Khi đơn ở "Đang chuẩn bị hàng": khách gửi yêu cầu hủy và cần shop đồng ý. Shop từ chối thì đơn đi tiếp bình thường. Nếu quá 12 giờ shop không phản hồi thì cho phép hủy đơn.
- Mỗi đơn chỉ được gửi 1 yêu cầu hủy.
- Khi ĐVVC bấm "Đã lấy hàng" (đơn sang "Chờ giao hàng"): yêu cầu hủy đang chờ tự bị từ chối, và từ đây khách không hủy được nữa.

**Shop hủy đơn**
- Shop từ chối đơn ở bước "Chờ người bán xác nhận".
- Shop đã xác nhận đơn nhưng gặp sự cố (hết hàng, hỏng hàng) vẫn được phép hủy. Việc phạt shop khi hủy làm sau, hiện tại chưa làm.

**Quy tắc chung khi đơn chuyển sang Đã hủy**
- Cộng lại tồn kho cho shop.
- Nếu đã thanh toán online: hoàn tiền vào ví của người dùng trên web.

**Các trường hợp dẫn tới Đã hủy:** khách tự hủy, shop từ chối đơn, shop hủy sau khi đã xác nhận, shop không xác nhận quá 12 giờ, đơn online quá hạn thanh toán, shop đồng ý yêu cầu hủy (hoặc quá 12 giờ không phản hồi).

---

## 9. Giao thất bại

- Áp dụng khi khách không nhận hàng (bom hàng).
- Đơn chuyển sang Giao thất bại, hàng hoàn về người bán, tồn kho được cộng lại.
- Đơn online: hoàn lại tiền vào ví người mua.
- Đơn COD: không có tiền để giữ hay hoàn.

---

## 10. Dòng tiền và giải ngân (mô phỏng)

**Quy tắc giải ngân**
- Khi ĐVVC giao thành công, hệ thống ghi nhận tiền của đơn và giữ **4 ngày**.
- Sau 4 ngày, sàn trừ phí sàn rồi chuyển vào số dư shop.
- Nếu khách bấm "Đã nhận hàng" trước đó thì giải ngân cho shop ngay.
- Giải ngân **không phụ thuộc ĐVVC**: nếu ĐVVC chưa nộp công nợ, sàn tự ứng tiền quỹ để giải ngân cho shop.

**Phí sàn**
- Trước tiên thu **6%** cho mỗi sản phẩm bán ra, tính trên tổng giá trị sản phẩm, không tính phí ship.
- Mức phí này sau này sẽ đổi, nên lưu tỷ lệ phí ở dạng cấu hình, không viết cứng trong code.

**Đóng băng tiền**
- Nếu khách yêu cầu hoàn đơn khi tiền chưa giải ngân, tiền bị đóng băng (dừng giải ngân) cho đến khi xử lý xong việc hoàn đơn.

**Ví shop bị âm**
- Ví shop được phép âm (xem mục 11). Thu hồi bằng cách trừ vào các lần giải ngân sau.

**Chưa làm:** rút tiền cho shop.

---

## 11. Hoàn đơn

**Điều kiện**
- Khách được yêu cầu hoàn đơn trong **15 ngày** kể từ lúc giao thành công, nếu không ưng sản phẩm.
- Khách có thể yêu cầu hoàn từ lúc đơn ở trạng thái Giao thành công.
- Khách nêu lý do (và đính kèm ảnh) khi yêu cầu hoàn.
- Hết 15 ngày mà khách không yêu cầu hoàn thì đơn chuyển sang Hoàn tất (xem mục 7).

**Luồng hoàn hàng**

```
Khách yêu cầu hoàn
  -> Giao cho ĐVVC
  -> ĐVVC giao về shop
  -> Shop kiểm tra và xác nhận đã nhận lại hàng
  -> Hoàn tiền vào ví của người mua trên web
  -> Đơn chuyển sang "Đã hoàn đơn"
```

- Hàng hoàn về shop mà shop không bấm xác nhận: sau 12 giờ đơn tự xác nhận và đi tiếp bước hoàn tiền.
- Hiện tại shop chưa có quyền từ chối nhận hàng hoàn. Trường hợp shop từ chối sẽ chuyển sang Tranh chấp để admin quyết định (chức năng làm sau).

**Nguồn tiền hoàn cho khách**

| Tình trạng tiền | Cách xử lý |
|---|---|
| Chưa giải ngân (sàn đang giữ) | Dùng số tiền sàn đang giữ để hoàn cho khách. Tiền bị đóng băng trong lúc xử lý. |
| Đã giải ngân cho shop | Trừ trực tiếp số tiền hoàn từ ví shop trên web. Nếu ví không đủ tiền thì trừ âm (thu hồi theo mục 10). Sàn trừ 94% đã giải ngân cho shop và hoàn lại 6% phí đã thu của shop, để khách nhận đủ 100%. |

---

## 12. Công nợ ĐVVC

- Khi ĐVVC chuyển đơn sang Giao thành công, hệ thống tạo công nợ cho ĐVVC.
- ĐVVC phải nộp đủ công nợ trong vòng 1 ngày.
- Công nợ quá hạn 1 ngày: hiện tại chỉ cảnh báo trên trang admin.
- Đơn đã thanh toán online thì công nợ bằng 0.
- Bước đầu mô phỏng việc ĐVVC nộp tiền vào công nợ.

---

## 13. Đánh giá sản phẩm

- Khách mua hàng xong có thể đánh giá sản phẩm và để lại bình luận.

---

## 14. Quản trị (Admin)

**Làm trong phiên bản này**
- Nhận báo cáo: sản phẩm vi phạm, shop lừa đảo. Người dùng gửi báo cáo bằng form (loại, mô tả, ảnh).
- Khóa shop hoặc tài khoản, gỡ sản phẩm.
- Xem cảnh báo công nợ ĐVVC quá hạn.
- Tài khoản admin tạo bằng seed script.

**Làm sau**
- Nhận và phân xử tranh chấp đơn (khi shop từ chối nhận hàng hoàn).
- Quy tắc xử lý đơn đang chạy và tiền đang giữ khi khóa shop.

---

## 15. Cách mô phỏng ĐVVC

Làm cả hai cách, cộng thêm chế độ demo:

- **Cron job** tự chuyển trạng thái.
- **Trang giả lập "shipper"** để bấm tay (lấy hàng, giao thành công, giao thất bại...).
- **Chế độ demo tua nhanh thời gian** (ví dụ 4 ngày thành 4 phút).

---

## 16. Các điểm còn mở / nên cân nhắc

- [ ] Thêm trường "lý do hoàn" dạng danh sách chọn (hàng lỗi, sai mô tả, đổi ý...).
- [ ] Thêm tự hủy khi đơn ở "Đang chuẩn bị hàng" quá hạn mà ĐVVC không đến lấy (ví dụ 3 ngày).
- [ ] Hàng hoàn về shop có được cộng lại kho không? (Gợi ý: shop chọn "cộng lại kho" hoặc "không cộng - hàng lỗi" khi xác nhận nhận lại hàng, mặc định là cộng.)
- [ ] Tên trạng thái "Chờ giao hàng" đang mang nghĩa ĐVVC đã lấy hàng và đang đi giao. Có thể đổi thành "Đang giao hàng" cho dễ hiểu.