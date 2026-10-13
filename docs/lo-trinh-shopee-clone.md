# Lộ trình tự xây sàn thương mại điện tử nhiều shop

Ngày cập nhật: 07/10/2026. Căn cứ: scope.md người dùng cung cấp và tiến độ được người dùng xác nhận.

## 1. Mục tiêu và tiến độ

- Mục tiêu: tự viết một website portfolio chạy được, hiểu luồng dữ liệu, nghiệp vụ, cách kiểm thử và lý do tổ chức code.
- [x] Buổi 1: viết và review scope.md. Các điểm nghiệp vụ còn mở chưa mặc nhiên được chốt.
- [x] Buổi 2: khởi tạo React + TypeScript và Git; người dùng xác nhận hoàn thành.
- [ ] Buổi tiếp theo: **buổi 3 — tạo Express + TypeScript và API GET /health**.
- Tổng khung: **120 buổi**, gồm cả 2 buổi đã hoàn thành. Đây là đơn vị công việc, không phải hạn chót.
- Mỗi buổi khoảng 60–90 phút. Buổi khó được tách thành 2–3 buổi nhỏ, giữ số gốc như 54A, 54B.
- Nếu học 5 buổi/tuần: khung danh nghĩa là 24 tuần, khoảng 6 tháng; thời gian thực tế phụ thuộc phần ôn tập và debug.
- Mỗi chặng 5 buổi. Chỉ chuyển chặng khi chạy được kết quả và giải thích được phần mình viết.

## 2. Stack và phạm vi

Stack theo lộ trình đang học: React + Vite + TypeScript, Tailwind CSS, React Router; Node.js + Express + TypeScript; PostgreSQL + Prisma; Zod; TanStack Query; Vitest và Supertest; Docker Compose; GitHub Actions. Chốt và ghi phiên bản thực tế khi cài, giữ lockfile. Chỉ thêm thư viện quản lý state toàn cục khi có nhu cầu rõ ràng.

Phạm vi theo scope hiện tại: sàn nhiều shop, mỗi tài khoản tối đa một shop, danh mục 3 cấp, sản phẩm và biến thể, giỏ hàng, COD, thanh toán online giả lập, ví, đơn theo shop, hủy/giao thất bại/hoàn hàng, công nợ ĐVVC, phí sàn, số dư shop, đánh giá, báo cáo vi phạm, admin, mô phỏng shipper và thời gian.

Phí vận chuyển tạm 0đ. Chưa tích hợp tiền thật, rút tiền shop, chat, flash sale, xử phạt shop hoặc phân xử tranh chấp. Bật chức năng khóa tài khoản/shop chỉ sau khi thống nhất cách xử lý đơn và tiền đang tồn tại; không coi quy tắc này là đã được scope giải quyết.

## 3. Cách học mỗi buổi

1. 10 phút: đọc lại code hôm trước, giải thích bằng lời.
2. 10 phút: viết đầu vào, đầu ra, quyền truy cập và các trường hợp lỗi.
3. 30–45 phút: tự code một thay đổi nhỏ.
4. 10–20 phút: chạy thử, xem Network/log/database; viết test cho rủi ro nghiệp vụ thực tế.
5. 5 phút: ghi điều đã hiểu, lỗi đã sửa, điều còn vướng; commit phần hoàn chỉnh.

Một buổi hoàn thành khi: code chạy đúng mục tiêu, đã thử trường hợp lỗi liên quan, giải thích được phần chính, không commit secrets và đã ghi lại tiến độ. Không cần viết test cho mọi thay đổi giao diện nhỏ.

Dùng AI để giải thích, gợi ý và review. Tự thử trước khi xin toàn bộ lời giải; khi gặp lỗi, cung cấp code liên quan, lỗi nguyên văn, kết quả mong đợi và những gì đã thử.

## 4. Các mốc và điểm cần chốt

| Mốc | Kết quả |
|---|---|
| Buổi 20 | Xem sản phẩm lấy từ database qua API |
| Buổi 40 | Đăng nhập, tạo shop, quản lý sản phẩm và tìm kiếm |
| Buổi 65 | Demo COD: giỏ nhiều shop, đặt hàng, hủy, giao và trả hàng giao thất bại |
| Buổi 85 | Hoàn hàng và dòng tiền COD mô phỏng, gồm giải ngân/thu hồi |
| Buổi 95 | Thanh toán online giả lập và tác vụ tự động |
| Buổi 110 | Hoàn thiện các màn hình, đánh giá, báo cáo và admin theo phạm vi đã chốt |
| Buổi 120 | Demo online, tài liệu và video portfolio |

Các mốc giữa là bản demo trong quá trình xây dựng, chưa đại diện cho toàn bộ scope đã hoàn thành. Luồng sớm dùng thao tác tay; tác vụ tự động hoàn thiện ở buổi 91–95. Không bật giải ngân sớm trên bản dùng chung khi cơ chế hoàn và thu hồi chưa hoàn chỉnh.

Các quyết định chưa chốt được đưa vào buổi 46–50, 66, 76, 81, 86 và 101. Bao gồm: checkout thành công toàn bộ hay một phần; giới hạn shop hủy; thời điểm hoàn kho; hoàn toàn đơn hay một phần; phí và làm tròn; sàn ứng tiền khi ĐVVC chưa nộp; quỹ không đủ; các mốc tính thời hạn; quyền đánh giá; và xử lý khi khóa tài khoản. Các buổi này phải cập nhật quyết định bằng văn bản trước khi code phần phụ thuộc, không tự chọn ngầm.

## 5. Lịch từng buổi

### Chặng 1 — Nền tảng và request–response (1–5)

- [x] **Buổi 1 — Scope:** mô tả người sử dụng, luồng nhiều shop và COD; ghi lại các điểm còn mở sau review.
- [x] **Buổi 2 — Frontend và Git:** chạy React + TypeScript, sửa App, hiểu file khởi động, lint/build và commit.
- [ ] **Buổi 3 — Backend đầu tiên:** tạo server Express + TypeScript, GET /health; hiểu port, method, status code và JSON.
- [ ] **Buổi 4 — Kết nối:** React dùng fetch gọi /health; hiển thị loading/success/error, quan sát Network và CORS.
- [ ] **Buổi 5 — Ôn tập:** tự tạo GET /api/categories trả dữ liệu mẫu, render danh sách; giải thích request qua từng file.

Kết quả: frontend và backend chạy độc lập, giao tiếp được. Tự trả lời: vì sao Node.js dùng ở công cụ frontend và ở server nhưng React UI vẫn chạy trong trình duyệt?

### Chặng 2 — React và giao diện sản phẩm mẫu (6–10)

- [ ] **Buổi 6 — Kiểu dữ liệu:** khai báo Product/Variant mẫu; ôn object, array, map, optional fields và TypeScript.
- [ ] **Buổi 7 — Component:** tự viết ProductCard nhận props; render nhiều sản phẩm, hiểu key và tái sử dụng.
- [ ] **Buổi 8 — Bố cục:** cài Tailwind theo phiên bản thực tế, dựng header, footer và lưới responsive bằng dữ liệu mẫu.
- [ ] **Buổi 9 — Routing:** tạo trang chủ, danh sách, chi tiết và 404 bằng React Router; lấy mã sản phẩm từ URL.
- [ ] **Buổi 10 — Chi tiết:** chọn màu/size bằng state, hiển thị giá/tồn mẫu và ảnh; tự kiểm tra lựa chọn không hợp lệ.

Kết quả: bộ giao diện đọc dữ liệu mẫu. Tự trả lời: dữ liệu nào là props, dữ liệu nào là state và dữ liệu nào có thể tính ra?

### Chặng 3 — SQL, PostgreSQL và Prisma (11–15)

- [ ] **Buổi 11 — Mô hình dữ liệu:** vẽ User, Shop, Category, Product, Variant; hiểu PK, FK, unique và quan hệ.
- [ ] **Buổi 12 — Database local:** chạy PostgreSQL bằng Docker Compose; hiểu volume, port và biến môi trường; tạo .env.example.
- [ ] **Buổi 13 — Migration:** cài Prisma, tạo schema ban đầu và migration; đọc SQL sinh ra, phân biệt schema/migration/client.
- [ ] **Buổi 14 — Seed:** tạo hai shop, danh mục ba cấp và 10–20 sản phẩm có biến thể; chạy lại seed theo cách đã thiết kế.
- [ ] **Buổi 15 — Truy vấn:** viết SELECT/JOIN đơn giản rồi truy vấn tương ứng qua ORM; giải thích dữ liệu liên kết.

Kết quả: database có dữ liệu mẫu tái tạo được. Tự trả lời: vì sao không dùng tên shop làm khóa ngoại?

### Chặng 4 — API đọc sản phẩm và kết nối UI (16–20)

- [ ] **Buổi 16 — Tổ chức module:** tách router/controller/service vừa đủ, API danh sách sản phẩm lấy từ database.
- [ ] **Buổi 17 — Chi tiết API:** lấy sản phẩm kèm biến thể, ảnh và shop; xử lý mã không hợp lệ, không tìm thấy hoặc đã ẩn.
- [ ] **Buổi 18 — Validate và lỗi:** dùng Zod kiểm tra query/params, phân trang server, cấu trúc lỗi tập trung và status code.
- [ ] **Buổi 19 — Dữ liệu thật:** nối giao diện danh sách/chi tiết qua fetch; xử lý loading, lỗi, không có dữ liệu.
- [ ] **Buổi 20 — Cache:** đưa TanStack Query vào luồng đã hiểu; học query key, cache và refetch; cập nhật mô tả API.

Kết quả: website đọc sản phẩm thật. Tự trả lời: dữ liệu cache ở frontend khác dữ liệu trong database thế nào?

### Chặng 5 — Đăng ký và xác thực (21–25)

- [ ] **Buổi 21 — Đăng ký:** validate email/mật khẩu, hash mật khẩu, xử lý email trùng; không trả password hash qua API.
- [ ] **Buổi 22 — Đăng nhập:** kiểm tra hash, tạo access token; hiểu payload, chữ ký, thời hạn và lỗi đăng nhập.
- [ ] **Buổi 23 — Middleware:** xác thực token, viết GET /me, phân biệt 401 và 403; test truy cập không hợp lệ.
- [ ] **Buổi 24 — Refresh và logout:** thiết kế phiên refresh, rotation/revoke và cookie; chốt CSRF/CORS theo cách lưu token.
- [ ] **Buổi 25 — Kiểm thử auth:** token hết hạn, refresh lặp, logout, sai mật khẩu; thêm giới hạn tần suất cho đăng nhập.

Kết quả: API xác thực hoàn chỉnh ở mức nền tảng. Tự trả lời: tại sao có token chưa có nghĩa được quyền sửa mọi dữ liệu?

### Chặng 6 — UI tài khoản, địa chỉ và shop (26–30)

- [ ] **Buổi 26 — Form auth:** dựng đăng ký/đăng nhập, hiển thị lỗi field và trạng thái gửi; kết nối API.
- [ ] **Buổi 27 — Phiên trên UI:** tải /me, đăng xuất, refresh khi cần; xử lý nhiều request hết token mà không refresh vô hạn.
- [ ] **Buổi 28 — Địa chỉ:** API và màn hình thêm/sửa/xóa địa chỉ; chỉ chủ tài khoản được truy cập địa chỉ của mình.
- [ ] **Buổi 29 — Tạo shop:** mỗi user tối đa một shop, không cần duyệt; dựng form và trang thông tin shop.
- [ ] **Buổi 30 — Quyền và điều hướng:** menu người mua/chủ shop, route bảo vệ, test ownership; seed admin và giữ quyền admin ở server.

Kết quả: người dùng đăng nhập, quản lý địa chỉ và mở shop. Tự trả lời: ẩn nút trên giao diện đã đủ phân quyền chưa?

### Chặng 7 — Seller quản lý sản phẩm (31–35)

- [ ] **Buổi 31 — Form sản phẩm:** lấy cây danh mục ba cấp, nhập thông tin sản phẩm; định nghĩa lựa chọn danh mục hợp lệ.
- [ ] **Buổi 32 — API tạo:** tạo sản phẩm và tổ hợp biến thể, giá/tồn riêng; kiểm tra tổ hợp trùng và dữ liệu không hợp lệ.
- [ ] **Buổi 33 — Sửa sản phẩm:** nối UI sửa giá, mô tả, tồn kho; xác minh quyền sở hữu bằng dữ liệu backend.
- [ ] **Buổi 34 — Ảnh:** tích hợp upload ảnh, validate loại/kích thước và quyền upload; giữ khóa bí mật ở backend.
- [ ] **Buổi 35 — Ẩn sản phẩm:** xóa mềm, danh sách quản lý của seller; test Shop A không sửa/ẩn sản phẩm Shop B.

Kết quả: shop tự quản lý hàng hóa. Tự trả lời: tại sao không tin shopId mà trình duyệt gửi lên?

### Chặng 8 — Tìm kiếm và trải nghiệm danh mục (36–40)

- [ ] **Buổi 36 — Tìm kiếm server:** lọc tên sản phẩm, danh mục và shop; validate tham số và loại sản phẩm không được bán.
- [ ] **Buổi 37 — Giá và sắp xếp:** thống nhất cách lọc giá theo biến thể, whitelist sort, phân trang ổn định.
- [ ] **Buổi 38 — URL bộ lọc:** đồng bộ từ khóa, danh mục, giá và trang vào URL; kiểm tra back/forward của trình duyệt.
- [ ] **Buổi 39 — Trang shop:** hiển thị thông tin shop và sản phẩm; gallery, chọn biến thể, phản hồi khi hết hàng.
- [ ] **Buổi 40 — Hoàn thiện catalog:** skeleton, empty/error, responsive; kiểm tra tìm kiếm kết hợp nhiều bộ lọc.

Kết quả: tìm và chọn đúng biến thể để mua. Tự trả lời: vì sao chỉ lọc dữ liệu của trang hiện tại trên frontend có thể cho kết quả sai?

### Chặng 9 — Giỏ hàng nhiều shop (41–45)

- [ ] **Buổi 41 — Cart schema:** thiết kế cart/cart item theo user và variant, ràng buộc tránh dòng trùng.
- [ ] **Buổi 42 — API giỏ hàng:** thêm, cập nhật, xóa; validate số lượng, quyền chủ giỏ và cấm mua hàng shop mình.
- [ ] **Buổi 43 — UI giỏ:** nhóm theo shop, đổi số lượng, xóa, cập nhật cache sau thao tác thành công.
- [ ] **Buổi 44 — Chọn mua:** chọn từng dòng/cả shop, tính tổng hiển thị; Mua ngay đi tới checkout đúng biến thể.
- [ ] **Buổi 45 — Biến động dữ liệu:** xử lý sản phẩm bị ẩn, giá đổi, tồn giảm; các dòng chưa chọn vẫn ở giỏ.

Kết quả: giỏ lưu trên server và chọn được phần muốn mua. Tự trả lời: giá trong giỏ có được dùng làm nguồn tin cậy để tạo đơn không?

### Chặng 10 — Chốt nghiệp vụ checkout và đơn (46–50)

- [ ] **Buổi 46 — Checkout:** chốt toàn bộ hay một phần khi có lỗi, xác nhận giá thay đổi, quyền mua và ý nghĩa Mua ngay.
- [ ] **Buổi 47 — Trạng thái:** viết bảng trạng thái đơn, quyền chuyển, mốc thời gian; tách thanh toán, vận chuyển và quyết toán.
- [ ] **Buổi 48 — Hủy/hoàn kho:** chốt giới hạn shop hủy, xử lý yêu cầu hủy, giao thất bại và lúc nhận hàng về; cập nhật scope.
- [ ] **Buổi 49 — Schema đơn:** thiết kế nhóm checkout, đơn theo shop, dòng hàng, bản sao giá/địa chỉ và lịch sử; tạo migration.
- [ ] **Buổi 50 — Hợp đồng API:** mô tả request/response, viết ví dụ và test nghiệp vụ dự kiến; lập tài liệu OpenAPI/Swagger cho phần đã có.

Kết quả: tài liệu quyết định đủ rõ để code đơn COD. Tự trả lời: sự kiện nào được phép thay đổi trạng thái nào, và ai được thực hiện?

### Chặng 11 — Checkout COD an toàn (51–55)

- [ ] **Buổi 51 — Tính tiền server:** đọc giá/tồn hiện tại, kiểm tra địa chỉ và sản phẩm; tạo kết quả kiểm tra trước đặt hàng.
- [ ] **Buổi 52 — Tạo đơn:** nhóm theo shop, lưu snapshot và tạo nhóm checkout/đơn/dòng hàng trong transaction theo quyết định buổi 46.
- [ ] **Buổi 53 — Tồn kho đồng thời:** dùng cập nhật có điều kiện/khóa phù hợp; rollback khi thiếu tồn, test hai khách mua món cuối.
- [ ] **Buổi 54 — Chống tạo trùng:** định nghĩa idempotency key, ràng buộc lưu trữ và retry; test bấm lại hoặc mất response.
- [ ] **Buổi 55 — UI checkout:** chọn địa chỉ/COD, đặt hàng, trang kết quả; chỉ xóa dòng giỏ đã mua, xử lý lỗi giá/tồn thay đổi.

Kết quả: đặt được nhiều đơn COD an toàn. Tự trả lời: transaction giải quyết điều gì và vì sao vẫn cần chống request trùng?

### Chặng 12 — Xác nhận và hủy đơn (56–60)

- [ ] **Buổi 56 — Đơn của người mua:** danh sách/chi tiết nhóm và đơn con, snapshot, trạng thái; kiểm tra quyền xem.
- [ ] **Buổi 57 — Đơn của seller:** chỉ thấy đơn của shop mình; xác nhận/từ chối qua service chuyển trạng thái.
- [ ] **Buổi 58 — Hủy trực tiếp:** khách hủy trước xác nhận, shop hủy trong giới hạn đã chốt; hoàn tồn đúng một lần.
- [ ] **Buổi 59 — Yêu cầu hủy:** gửi một yêu cầu, shop đồng ý/từ chối; ghi deadline và lịch sử, UI cho hai phía.
- [ ] **Buổi 60 — Đua trạng thái:** test xác nhận/hủy và timeout đồng thời; viết hàm xử lý hết hạn để scheduler dùng sau.

Kết quả: hủy có điều kiện, không cộng kho hai lần. Tự trả lời: nếu hai request cùng đọc một trạng thái cũ, làm sao chỉ một chuyển trạng thái hợp lệ được áp dụng?

### Chặng 13 — Shipper giả lập và giao thất bại (61–65)

- [ ] **Buổi 61 — Quyền giả lập:** tạo API và trang shipper demo với quyền rõ ràng; lấy hàng thông qua service chung.
- [ ] **Buổi 62 — Lấy hàng:** cập nhật đang giao theo tên đã chốt; từ chối yêu cầu hủy còn treo một cách nhất quán.
- [ ] **Buổi 63 — Kết quả giao:** giao thành công/thất bại, lưu thời điểm và sự kiện COD đã thu; không đồng nhất với sàn đã nhận tiền.
- [ ] **Buổi 64 — Hàng về shop:** theo dõi giao thất bại và vận chuyển ngược; xác nhận hàng về, hoàn tồn theo quy tắc đã chốt.
- [ ] **Buổi 65 — Demo COD:** chạy hai shop, một giao thành công/một thất bại; kiểm tra kho, quyền và sự kiện giao lặp.

Kết quả: demo mua bán COD xuyên suốt. Đây chưa phải mốc hoàn thiện thu hộ/hoàn tiền. Tự trả lời: hàng đang quay về shop đã được phép đưa vào tồn bán được chưa?

### Chặng 14 — Nền tảng ghi nhận tiền và ví (66–70)

- [ ] **Buổi 66 — Quy tắc tiền:** chốt đơn vị VND, phí 6%, thời điểm chụp tỷ lệ, cách làm tròn, quỹ mô phỏng và ý nghĩa số dư.
- [ ] **Buổi 67 — Sổ giao dịch:** thiết kế bút toán/lịch sử tăng giảm ví, tham chiếu nghiệp vụ và ràng buộc chống ghi trùng.
- [ ] **Buổi 68 — Cập nhật số dư:** transaction ghi lịch sử và số dư nhất quán; test lỗi giữa chừng và hai cập nhật đồng thời.
- [ ] **Buổi 69 — Màn hình ví:** người mua/shop xem số dư và lịch sử đúng quyền; phân biệt chờ giải ngân, khả dụng và khoản âm.
- [ ] **Buổi 70 — Kiểm tra số liệu:** test đối chiếu số dư với lịch sử; không sửa/xóa giao dịch đã ghi để che sai lệch, dùng giao dịch điều chỉnh.

Kết quả: nền tảng ví mô phỏng có thể truy vết. Tự trả lời: chỉ có một cột balance thì tìm nguyên nhân sai số bằng cách nào?

### Chặng 15 — Thu hộ COD và công nợ ĐVVC (71–75)

- [ ] **Buổi 71 — Khoản phải thu:** tạo công nợ từ sự kiện COD thu thành công, không tạo công nợ thu hộ cho đơn online.
- [ ] **Buổi 72 — Nộp tiền:** giả lập ĐVVC nộp tiền, liên kết khoản thu với đơn/công nợ; chốt có hỗ trợ nộp một phần hay không.
- [ ] **Buổi 73 — Chống đối soát trùng:** ghi nhận sàn thực nhận và giảm công nợ nhất quán; test gửi lại chứng từ mô phỏng.
- [ ] **Buổi 74 — Admin công nợ:** bảng đã thu/chưa nộp/đã nộp/quá hạn; chốt nghĩa chính xác của hạn 1 ngày trong scope.
- [ ] **Buổi 75 — Tình huống COD:** giao thất bại không phát sinh thu hộ; COD đã thu nhưng chưa nộp vẫn là công nợ khi có hoàn hàng.

Kết quả: theo dõi được tiền ĐVVC giữ và tiền sàn thực nhận. Tự trả lời: vì sao hoàn tiền khách không tự xóa khoản ĐVVC đã thu nhưng chưa nộp?

### Chặng 16 — Yêu cầu hoàn và trả hàng (76–80)

- [ ] **Buổi 76 — Chốt hoàn hàng:** toàn đơn hay từng dòng; hạn 15 ngày, ảnh/lý do, điều kiện nhận hàng và quy tắc cộng kho.
- [ ] **Buổi 77 — Yêu cầu hoàn:** API/UI khách gửi yêu cầu đúng quyền, đúng hạn; lưu một hồ sơ và chặn xử lý trùng.
- [ ] **Buổi 78 — Vận chuyển ngược:** shipper nhận và giao hàng về shop; lưu mốc hàng về làm căn cứ timeout.
- [ ] **Buổi 79 — Nhận hàng hoàn:** shop xác nhận và xử lý kho theo quy tắc đã chốt; chuẩn bị xử lý tự xác nhận sau 12 giờ.
- [ ] **Buổi 80 — Hoàn trước giải ngân:** đóng băng khoản chưa giải ngân, hoàn vào ví khách bằng sổ giao dịch; test đúng tổng tiền và một lần.

Kết quả: hoàn hàng trước giải ngân chạy được; nếu ĐVVC chưa nộp, dùng quy tắc quỹ đã chốt hoặc để trạng thái chờ rõ ràng. Tự trả lời: hoàn hàng vật lý và hoàn tiền có phải cùng một sự kiện không?

### Chặng 17 — Giải ngân và thu hồi sau hoàn (81–85)

- [ ] **Buổi 81 — Chốt giải ngân:** giữ 4 ngày/nhận hàng sớm, điều kiện chặn, quỹ ứng COD và xử lý quỹ không đủ; ghi rõ chỉ ghi có ví shop.
- [ ] **Buổi 82 — Khoản shop được hưởng:** tính phí theo snapshot, ghi có số dư shop đúng một lần; test đổi cấu hình không sửa đơn cũ.
- [ ] **Buổi 83 — Giải ngân sớm:** sự kiện khách xác nhận đã nhận, kiểm tra giao thành công và hồ sơ hoàn; dùng cùng service giải ngân.
- [ ] **Buổi 84 — Hoàn sau giải ngân:** thu hồi phần shop đã nhận, đảo phí tương ứng; xử lý số dư âm và bù từ các lần giải ngân sau.
- [ ] **Buổi 85 — Test dòng tiền:** hoàn và giải ngân đồng thời, ĐVVC nộp muộn, thiếu quỹ và retry; chỉ bật luồng sớm khi toàn chuỗi an toàn.

Kết quả: hoàn thiện dòng tiền COD mô phỏng theo quy tắc đã chốt. Tự trả lời: đơn 100.000đ, phí 6.000đ, shop nhận 94.000đ thì hoàn toàn bộ đảo những khoản nào?

### Chặng 18 — Thanh toán online giả lập (86–90)

- [ ] **Buổi 86 — Thiết kế payment:** một lần trả cho nhiều đơn; chốt hủy một đơn khi chưa trả, số tiền phải trả và payment đến muộn.
- [ ] **Buổi 87 — Nạp ví demo:** thao tác giả lập có quyền và nhãn rõ ràng, tạo giao dịch chống trùng; UI ví người mua.
- [ ] **Buổi 88 — Trả bằng ví:** kiểm tra và trừ số dư an toàn, cập nhật payment/đơn; test hai lần mua đồng thời và ví không đủ.
- [ ] **Buổi 89 — QR giả lập:** tạo màn hình mã/tham chiếu demo, xác nhận trả bằng endpoint được kiểm soát; không dùng mã nhận tiền thật.
- [ ] **Buổi 90 — Hủy/hoàn online:** quá 30 phút, thanh toán sát hết hạn, hủy từng đơn và giao thất bại; hoàn đúng phần đã trả vào ví.

Kết quả: COD và online mô phỏng dùng chung nền tảng đơn/tiền; chức năng đang phát triển được giữ chưa khả dụng cho tới khi xử lý hoàn đủ. Tự trả lời: vì sao callback thanh toán lặp không được trừ ví/tạo tiền lần hai?

### Chặng 19 — Tác vụ tự động và thời gian demo (91–95)

- [ ] **Buổi 91 — Đồng hồ ứng dụng:** gom cách lấy thời gian và cấu hình deadline; không rải thời gian demo khắp code hay đổi đồng hồ hệ điều hành.
- [ ] **Buổi 92 — Hết hạn:** scheduler gọi các service đã viết: payment 30 phút, shop xác nhận 12 giờ, yêu cầu hủy 12 giờ.
- [ ] **Buổi 93 — Hoàn/giải ngân:** tự xác nhận nhận hàng hoàn, giải ngân sau 4 ngày, hoàn tất sau 15 ngày nếu đủ điều kiện.
- [ ] **Buổi 94 — Mô phỏng vận chuyển:** tự lấy/giao hàng bằng cùng service với trang shipper; chặn job và thao tác tay xử lý trùng.
- [ ] **Buổi 95 — Demo tua nhanh:** cấu hình thời gian demo và dữ liệu riêng; test job chạy lại, khởi động lại, cạnh tranh và ranh giới deadline.

Kết quả: đủ cả thao tác tay và tự động. Tự trả lời: cron chạy hai lần hoặc app có hai tiến trình thì tại sao tiền và kho vẫn phải đúng?

### Chặng 20 — Đánh giá và báo cáo vi phạm (96–100)

- [ ] **Buổi 96 — Quy tắc đánh giá:** chốt trạng thái được đánh giá, một lần theo dòng mua hay sản phẩm, sửa/xóa và xử lý sau hoàn.
- [ ] **Buổi 97 — API review:** xác minh người mua sở hữu dòng hàng đủ điều kiện, lưu sao/bình luận, chống đánh giá trùng theo quy tắc.
- [ ] **Buổi 98 — UI review:** form đánh giá và danh sách có phân trang, điểm trung bình; chỉ thêm ảnh review nếu scope được mở rộng rõ.
- [ ] **Buổi 99 — Báo cáo:** form loại/mô tả/ảnh cho sản phẩm hoặc shop; validate, kiểm soát upload và quyền xem báo cáo.
- [ ] **Buổi 100 — Admin xử lý:** danh sách, chi tiết, trạng thái xử lý báo cáo và lịch sử quyết định; test dữ liệu người dùng nhập.

Kết quả: có đánh giá từ người mua và báo cáo vi phạm. Tự trả lời: biết productId có đủ để được đánh giá sản phẩm đó không?

### Chặng 21 — Quản trị và giới hạn bán hàng (101–105)

- [ ] **Buổi 101 — Chốt khóa:** quyết định quyền truy cập, đơn đang chạy, hoàn hàng và tiền khi khóa shop/user; cập nhật scope trước triển khai.
- [ ] **Buổi 102 — Admin catalog:** danh mục ba cấp, gỡ sản phẩm, quản lý shop/user; lưu người thao tác và lý do.
- [ ] **Buổi 103 — Trạng thái tài khoản/shop:** triển khai phương án buổi 101, kiểm tra cả API và phiên hiện có; xử lý đơn cũ theo quy tắc.
- [ ] **Buổi 104 — Trang quản trị tiền:** xem công nợ, tiền giữ, phí, giải ngân và hoàn tiền; phân biệt số dư với tiền thực nhận mô phỏng.
- [ ] **Buổi 105 — Test quản trị:** user/seller không gọi API admin; trạng thái khóa không gây mất khả năng xử lý đơn/tiền theo thiết kế.

Kết quả: admin có quyền rõ và audit trail. Nếu chưa chốt buổi 101, giữ khóa chưa khả dụng và chỉ hoàn thiện chức năng quản trị độc lập.

### Chặng 22 — Hoàn thiện trải nghiệm và CI (106–110)

- [ ] **Buổi 106 — Luồng người mua:** rà soát đăng nhập, tìm kiếm, giỏ, checkout, đơn, ví và hoàn; sửa màn hình còn thiếu liên kết.
- [ ] **Buổi 107 — Luồng seller/admin:** menu, trạng thái, thông báo và chi tiết giao dịch; sửa trải nghiệm sai quyền hoặc thiếu thông tin.
- [ ] **Buổi 108 — Mobile:** kiểm tra header, filter, form, bảng và checkout trên màn hình hẹp; hỗ trợ bàn phím và nhãn input.
- [ ] **Buổi 109 — Trạng thái UI:** loading/error/empty, chống gửi lặp, retry hợp lý và thông báo lỗi dễ hiểu trên các luồng chính.
- [ ] **Buổi 110 — CI:** chạy lint, typecheck, test và build bằng GitHub Actions; dựng database test khi cần, cập nhật tài liệu API.

Kết quả: ứng dụng có thể demo xuyên suốt và CI bảo vệ thay đổi. Tự trả lời: nút bị disable có thay thế được chống trùng ở backend không?

### Chặng 23 — Kiểm thử, bảo mật và hiệu năng (111–115)

- [ ] **Buổi 111 — Tích hợp COD:** test từ giỏ đến giao/thu hộ/giải ngân/hoàn; kiểm tra hai shop độc lập và số liệu cuối.
- [ ] **Buổi 112 — Tích hợp online:** test ví/QR demo, hết hạn, hủy/hoàn từng đơn; mở lại lỗi cụ thể nếu còn sai dữ liệu.
- [ ] **Buổi 113 — Bảo mật:** rà soát ownership, cookie/CSRF/CORS, rate limit, header bảo mật, upload, secrets và quyền chức năng demo.
- [ ] **Buổi 114 — Database:** đo truy vấn, sửa N+1, thêm index theo nhu cầu; kiểm tra phân trang và seed dữ liệu lớn vừa đủ.
- [ ] **Buổi 115 — Frontend:** đo bundle/ảnh, lazy loading và code splitting khi có ích; chạy lại các luồng bị tác động.

Kết quả: xử lý các rủi ro đã xác định. Test được viết từ các chặng trước; chặng này kiểm tra toàn chuỗi, không đợi tới đây mới test tiền/kho/quyền.

### Chặng 24 — Deploy và portfolio (116–120)

- [ ] **Buổi 116 — Tái tạo môi trường:** README chạy local, .env.example, Docker app/DB nếu phù hợp; thử từ một checkout sạch, không xóa dữ liệu đang dùng.
- [ ] **Buổi 117 — Chọn và cấu hình hosting:** kiểm tra lựa chọn/chi phí tại thời điểm triển khai, HTTPS, secrets, database và migration.
- [ ] **Buổi 118 — Deploy demo:** triển khai FE/BE/DB, cấu hình scheduler và storage; smoke test auth/upload/checkout, tài khoản demo hạn chế quyền.
- [ ] **Buổi 119 — README portfolio:** ảnh, sơ đồ kiến trúc/ERD, API, tính năng, phần giả lập, giới hạn và các quyết định kỹ thuật đã xử lý.
- [ ] **Buổi 120 — Video và giải thích:** quay demo 2–3 phút, trình bày checkout nhiều shop, tồn kho đồng thời, idempotency và dòng tiền; ghi backlog.

Kết quả: link demo và repo đủ rõ để nhà tuyển dụng dùng thử. Không công khai credentials quản trị không hạn chế hoặc cho khách demo ghi nhận tiền thật.

## 6. Nhật ký và tiêu chí tự đánh giá

Dùng bảng sau cho mỗi buổi; ghi cụ thể thay vì chỉ đánh dấu đã xong.

| Mục | Nội dung tự điền |
|---|---|
| Buổi/ngày | |
| Mục tiêu nhỏ | |
| File/API thay đổi | |
| Dữ liệu đi qua những đâu? | |
| Điều mới hiểu được | |
| Trường hợp lỗi đã thử | |
| Điều còn chưa hiểu | |
| Commit | |
| Việc đầu tiên buổi sau | |

Trước khi đánh dấu hoàn thành một tính năng, tự trả lời:

1. Ai được dùng tính năng, dữ liệu đầu vào đến từ đâu?
2. Backend có kiểm tra dữ liệu và quyền độc lập với frontend không?
3. Thành công thay đổi những bản ghi nào? Thất bại giữa chừng thì sao?
4. Hai request cùng lúc hoặc cùng request gửi lại có làm sai tiền/kho không?
5. Tôi có giải thích và tự sửa một thay đổi nhỏ mà không chép toàn bộ lời giải không?

## 7. Cách tiếp tục cùng người hướng dẫn

Gửi: “Tiếp tục buổi N theo lộ trình. Giải thích mục tiêu và kiến thức cần biết, chia từng bước nhỏ để tôi tự code. Sau đó review phần tôi làm.”

Nếu buổi có nhiều khái niệm mới, hoàn thành một bước rồi gửi kết quả. Giữ code style hiện có, commit nhỏ, comments ngắn bằng tiếng Anh. Mọi thay đổi nghiệp vụ so với scope phải được nêu rõ và cập nhật quyết định trước khi triển khai.

**Điểm bắt đầu tiếp theo: buổi 3 — Express + TypeScript và GET /health.**
