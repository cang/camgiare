# Kiến trúc BE/FE trong project này

Điểm quan trọng nhất cần hiểu: đây **KHÔNG PHẢI** 2 project tách biệt (1 backend Node.js riêng + 1 frontend React riêng) như nhiều web thông thường. Đây là **1 project Next.js duy nhất**, trong đó Payload CMS (backend) được "nhúng" chung vào cùng ứng dụng. Cả BE và FE chạy chung 1 lệnh (`npm run dev`), chung 1 process.

```
d:\PhuGiaCat\src\
└── src/app/
    ├── (payload)/   ← BACKEND (admin + API)
    └── (app)/       ← FRONTEND (site khách hàng thấy)
```

## Phần BACKEND (Payload CMS)

**Việc của nó:** lưu trữ dữ liệu (sản phẩm, dịch vụ, đơn hàng...) và cho bạn giao diện quản trị để nhập liệu — giống như "trang quản trị" của WordPress vậy.

| Thư mục/file | Vai trò |
|---|---|
| `src/collections/Products`, `Services`, `Categories`, `Media`, `Users` | Định nghĩa **cấu trúc dữ liệu** — ví dụ Products có field gì (tên, giá, ảnh...), Services có field gì |
| `src/globals/Header.ts`, `Footer.ts` | Cấu hình chung toàn site (menu nav, footer) mà bạn sửa trong admin |
| `src/access/*` | Quy định **quyền hạn** — ai được xem/sửa/xoá gì (vd: chỉ admin mới xoá được sản phẩm) |
| `src/plugins/index.ts` | Các "gói mở rộng" cắm vào: plugin bán hàng (giỏ hàng/đơn hàng), plugin SEO, plugin form liên hệ |
| `src/payload.config.ts` | File **trung tâm** ghép tất cả collections + plugins lại thành 1 hệ thống |
| MongoDB | Nơi dữ liệu thật sự được lưu (chạy native local trên máy dev) |

**Bạn tương tác với BE qua đâu:** trang `/admin` — nơi bạn đăng nhập, thêm/sửa sản phẩm và dịch vụ.

## Phần FRONTEND (Next.js storefront)

**Việc của nó:** hiển thị dữ liệu từ BE thành trang web đẹp cho khách xem — trang chủ, trang sản phẩm, trang dịch vụ, giỏ hàng...

| Thư mục/file | Vai trò |
|---|---|
| `src/app/(app)/page.tsx` | Trang chủ |
| `src/app/(app)/shop/page.tsx` | Trang danh sách sản phẩm |
| `src/app/(app)/products/[slug]/page.tsx` | Trang chi tiết 1 sản phẩm |
| `src/app/(app)/services/`, `services/[slug]/` | Trang danh sách và chi tiết dịch vụ |
| `src/components/*` | Các mảnh UI tái sử dụng (Header, Footer, khung sản phẩm...) |
| `src/blocks/*` | Các "khối nội dung" linh hoạt (CallToAction, Form...) mà bạn kéo-thả khi soạn trang trong admin |

## Chúng nối với nhau như thế nào?

Vì cùng 1 process, FE **gọi thẳng** vào BE bằng code (không qua mạng internet), rất nhanh. Ví dụ khi khách vào trang sản phẩm:

```
Khách mở /products/dau-ghi-ip-8-kenh-kbvision-kx-a8128n2
        ↓
Next.js chạy code trong products/[slug]/page.tsx
        ↓
Code gọi payload.find({ collection: 'products', ... })  ← đây là BE
        ↓
Payload lấy dữ liệu từ MongoDB, trả về
        ↓
Next.js render thành HTML đẹp, gửi cho trình duyệt khách  ← đây là FE
```

Và chiều ngược lại — khi bạn thêm/sửa sản phẩm trong `/admin` (BE), nó lưu vào MongoDB, thì ngay lập tức trang FE tương ứng cũng hiển thị dữ liệu mới đó khi khách load lại trang.

## API có dùng được cho app khác ngoài FE này không?

**Câu hỏi:** Ngoài trang web (FE) hiện tại, tôi có thể viết một web app/app khác dùng chung API của backend này không?

**Trả lời:** Được, đây chính là điểm mạnh của Payload CMS (nó là "headless CMS").

Payload **tự động sinh ra** REST API (`/api/products`, `/api/services`...) và GraphQL API (`/api/graphql`) cho **mọi collection** — đây chính là API đã dùng để test lúc tạo sản phẩm KBVISION (`/api/products?where[slug][equals]=...`). Trang Next.js storefront hiện tại chỉ là **một trong nhiều** ứng dụng có thể "ăn" dữ liệu từ backend này. Có thể viết thêm:

- Một web app khác (React/Vue/Next.js riêng)
- App mobile (React Native, Flutter...)
- Dashboard nội bộ riêng cho nhân viên

...tất cả gọi chung vào 1 backend Payload + MongoDB này, y hệt cách FE hiện tại đang làm — chỉ khác là app mới sẽ gọi API qua HTTP thật sự (không dùng local API như FE trong cùng process).

**Hai điều cần lưu ý khi làm việc này:**

1. **Quyền truy cập (access control)** — mỗi collection đã có rule riêng (`src/access/*`), ví dụ sản phẩm published thì ai cũng đọc được, nhưng sửa/xoá thì cần đăng nhập admin. App mới vẫn phải tuân theo các rule này, không có "cửa sau" nào khác.
2. **CORS** — hiện `payload.config.ts` **chưa cấu hình CORS**, nghĩa là mặc định chỉ chấp nhận request cùng origin (cùng domain/port). Nếu app mới chạy ở domain/port khác (vd `localhost:5173` cho 1 React app riêng), cần thêm cấu hình `cors` trong `payload.config.ts` để cho phép domain đó gọi API — nếu không trình duyệt sẽ chặn request.

