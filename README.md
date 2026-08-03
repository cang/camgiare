# Payload Ecommerce Template

Template này đang ở giai đoạn **BETA**.

Đây là [Payload Ecommerce Template](https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce) chính thức. Repo này bao gồm một backend hoạt động đầy đủ, trang quản trị (admin panel) cấp doanh nghiệp, và một website thương mại điện tử được thiết kế đẹp mắt, sẵn sàng cho production.

Template này phù hợp nếu bạn đang xây dựng một dự án thương mại điện tử hoặc cửa hàng với Payload.

Các tính năng chính:

- [Payload Config được cấu hình sẵn](#cách-hoạt-động)
- [Xác thực người dùng (Authentication)](#tài-khoản-người-dùng)
- [Kiểm soát truy cập (Access Control)](#kiểm-soát-truy-cập)
- [Layout Builder](#layout-builder)
- [Xem trước bản nháp (Draft Preview)](#xem-trước-bản-nháp)
- [Xem trước trực tiếp (Live Preview)](#xem-trước-trực-tiếp)
- [Revalidation theo yêu cầu](#revalidation-theo-yêu-cầu)
- [SEO](#seo)
- [Tìm kiếm & Bộ lọc](#tìm-kiếm)
- [Jobs và lịch xuất bản](#jobs-và-lịch-xuất-bản)
- [Website](#website)
- [Sản phẩm & Biến thể](#sản-phẩm-và-biến-thể)
- [Tài khoản người dùng](#tài-khoản-người-dùng)
- [Giỏ hàng](#giỏ-hàng)
- [Thanh toán không cần tài khoản (Guest checkout)](#khách-không-đăng-nhập)
- [Đơn hàng & Giao dịch](#đơn-hàng-và-giao-dịch)
- [Thanh toán qua Stripe](#stripe)
- [Đơn vị tiền tệ](#đơn-vị-tiền-tệ)
- [Kiểm thử tự động](#kiểm-thử)

## Bắt đầu nhanh

Để khởi chạy ví dụ này ở máy local, thực hiện các bước sau:

### Clone

Nếu chưa làm, bạn cần có một bản copy độc lập của repo này trên máy. Nếu đã clone rồi, bỏ qua và chuyển tới [Development](#phát-triển).

Dùng CLI `create-payload-app` để clone template này trực tiếp về máy:

```bash
pnpx create-payload-app my-project -t ecommerce
```

### Phát triển

1. Đầu tiên [clone repo](#clone) nếu chưa làm
1. `cd my-project && cp .env.example .env` để copy các biến môi trường mẫu
1. `pnpm install && pnpm dev` để cài dependencies và khởi động dev server
1. Mở `http://localhost:3000` để mở app trên trình duyệt

Vậy là xong! Mọi thay đổi trong `./src` sẽ được phản ánh ngay trên app. Làm theo hướng dẫn trên màn hình để đăng nhập và tạo user admin đầu tiên. Sau đó xem [Production](#production) khi bạn sẵn sàng build và chạy app, và [Deployment](#deployment) khi sẵn sàng go-live.

## Cách hoạt động

Payload config được thiết kế riêng cho nhu cầu của hầu hết các website. Nó được cấu hình sẵn theo các cách sau:

### Collections

Xem tài liệu [Collections](https://payloadcms.com/docs/configuration/collections) để biết chi tiết cách mở rộng chức năng này.

- #### Users (Xác thực)

  Users là collection có bật xác thực (auth-enabled), có quyền truy cập admin panel và nội dung chưa publish. Xem [Kiểm soát truy cập](#kiểm-soát-truy-cập) để biết thêm chi tiết.

  Để được hỗ trợ thêm, xem [Auth Example](https://github.com/payloadcms/payload/tree/3.x/examples/auth) chính thức hoặc tài liệu [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview).

- #### Pages

  Tất cả các trang đều bật Layout Builder nên bạn có thể tạo layout riêng cho từng trang bằng các block dựng layout, xem [Layout Builder](#layout-builder) để biết thêm chi tiết. Pages cũng bật draft nên bạn có thể xem trước trước khi publish lên website, xem [Xem trước bản nháp](#xem-trước-bản-nháp) để biết thêm chi tiết.

- #### Media

  Đây là collection bật upload, được dùng bởi pages, posts và projects để chứa media như hình ảnh, video, file tải xuống và các asset khác. Có sẵn các kích thước được cấu hình trước, focal point và khả năng resize thủ công để quản lý hình ảnh.

- #### Categories

  Một hệ phân loại (taxonomy) dùng để nhóm các sản phẩm lại với nhau.

- ### Giỏ hàng (Carts)

  Dùng để theo dõi giỏ hàng của user và khách (guest) trong Payload. Được thêm bởi [plugin ecommerce](https://payloadcms.com/docs/ecommerce/plugin#carts).

- ### Địa chỉ (Addresses)

  Lưu địa chỉ của user để thanh toán nhanh hơn ở các lần sau. Được thêm bởi [plugin ecommerce](https://payloadcms.com/docs/ecommerce/plugin#addresses).

- ### Đơn hàng (Orders)

  Theo dõi đơn hàng khi một giao dịch hoàn tất thành công. Được thêm bởi [plugin ecommerce](https://payloadcms.com/docs/ecommerce/plugin#orders).

- ### Giao dịch (Transactions)

  Theo dõi giao dịch từ lúc khởi tạo tới khi hoàn tất, khi hoàn tất sẽ có một Order tương ứng. Được thêm bởi [plugin ecommerce](https://payloadcms.com/docs/ecommerce/plugin#transactions).

- ### Sản phẩm và Biến thể (Products and Variants)

  Collection chính cho chi tiết sản phẩm như giá theo từng loại tiền tệ, và tùy chọn hỗ trợ biến thể (variants) cho mỗi sản phẩm. Được thêm bởi [plugin ecommerce](https://payloadcms.com/docs/ecommerce/plugin#products).

### Globals

Xem tài liệu [Globals](https://payloadcms.com/docs/configuration/globals) để biết chi tiết cách mở rộng chức năng này.

- `Header`

  Dữ liệu cần thiết cho phần header ở front-end như các link điều hướng (nav links).

- `Footer`

  Tương tự như trên nhưng dành cho phần footer của site.

## Kiểm soát truy cập

Đã cấu hình sẵn kiểm soát truy cập cơ bản để giới hạn truy cập vào nội dung dựa trên trạng thái publish.

- `users`: User có role `admin` có thể truy cập admin panel và tạo/sửa nội dung, user có role `customer` chỉ có thể truy cập front-end và các item collection liên quan tới chính họ.
- `pages`: Ai cũng có thể truy cập các trang đã publish, nhưng chỉ user admin mới có thể tạo, cập nhật hoặc xóa.
- `products` `variants`: Ai cũng có thể truy cập sản phẩm đã publish, nhưng chỉ user admin mới có thể tạo, cập nhật hoặc xóa.
- `carts`: Customer có thể truy cập giỏ hàng đã lưu của chính mình, guest có thể truy cập bất kỳ giỏ hàng nào chưa được nhận (unclaimed) theo ID.
- `addresses`: Customer có thể truy cập địa chỉ của chính mình để lưu trữ.
- `transactions`: Chỉ admin mới truy cập được vì đây là dữ liệu theo dõi nội bộ.
- `orders`: Chỉ admin và user sở hữu đơn hàng mới truy cập được. Guest cần có `accessToken` hợp lệ (gửi qua email) cùng với email của đơn hàng để xem chi tiết đơn hàng.

Để biết thêm chi tiết cách mở rộng chức năng này, xem tài liệu [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control).

## Tài khoản người dùng

User đã đăng ký có thể đăng nhập để xem lịch sử đơn hàng, quản lý địa chỉ đã lưu, và theo dõi đơn hàng đang xử lý ngay từ trang tài khoản (account dashboard) của họ.

## Khách không đăng nhập (Guests)

Thanh toán không cần tài khoản (guest checkout) cho phép user hoàn tất mua hàng mà không cần tạo tài khoản. Khi guest đặt hàng:

1. Đơn hàng được gắn với địa chỉ email của họ
2. Một `accessToken` duy nhất được tạo ra để tra cứu đơn hàng an toàn
3. Một email xác nhận đơn hàng được gửi đi, chứa link an toàn để xem đơn hàng

Để tra cứu đơn hàng với tư cách khách, user truy cập `/find-order`, nhập email và mã đơn hàng, và sẽ nhận được email chứa link truy cập an toàn. Cách này giúp ngăn chặn tấn công dò số thứ tự đơn hàng (order enumeration), khi kẻ xấu có thể thử lần lượt các ID đơn hàng liên tiếp để truy cập thông tin đơn hàng của khách khác.

## Layout Builder

Tạo layout trang riêng cho bất kỳ loại nội dung nào bằng một layout builder mạnh mẽ. Template này được cấu hình sẵn với các block dựng layout sau:

- Hero
- Content
- Media
- Call To Action
- Archive

Mỗi block đều được thiết kế và tích hợp đầy đủ vào website front-end đi kèm với template này. Xem [Website](#website) để biết thêm chi tiết.

## Lexical editor

Một trải nghiệm biên tập chuyên sâu, cho phép tự do hoàn toàn để tập trung vào việc viết nội dung mà không bị ngắt mạch, với hỗ trợ sẵn cho Payload blocks, media, link và nhiều tính năng khác. Xem tài liệu [Lexical](https://payloadcms.com/docs/rich-text/overview).

## Xem trước bản nháp

Tất cả sản phẩm và trang đều bật draft nên bạn có thể xem trước trước khi publish lên website. Để làm được điều này, các collection này dùng [Versions](https://payloadcms.com/docs/configuration/collections#versions) với `drafts` được đặt là `true`. Nghĩa là khi bạn tạo một sản phẩm hoặc trang mới, nó sẽ được lưu dưới dạng bản nháp và sẽ không hiển thị trên website cho tới khi bạn publish. Điều này cũng có nghĩa bạn có thể xem trước bản nháp trước khi publish lên website. Để làm điều này, chúng tôi tự động tạo một URL tùy chỉnh, redirect về front-end để lấy phiên bản nháp của nội dung một cách an toàn.

Vì front-end của template này được generate tĩnh (statically generated), điều này cũng có nghĩa là các trang, sản phẩm, và project sẽ cần được generate lại mỗi khi có thay đổi trên tài liệu đã publish. Để làm điều đó, chúng tôi dùng hook `afterChange` để generate lại front-end khi một tài liệu thay đổi và `_status` của nó là `published`.

Để biết thêm chi tiết cách mở rộng chức năng này, xem [Draft Preview Example](https://github.com/payloadcms/payload/tree/3.x/examples/draft-preview) chính thức.

## Xem trước trực tiếp

Ngoài xem trước bản nháp, bạn cũng có thể bật live preview để xem trang kết quả cuối cùng ngay khi đang chỉnh sửa nội dung, có hỗ trợ đầy đủ cho render SSR. Xem [tài liệu Live preview](https://payloadcms.com/docs/live-preview/overview) để biết thêm chi tiết.

## Revalidation theo yêu cầu

Chúng tôi đã thêm hook vào các collection và global để mọi thay đổi trên trang, sản phẩm, footer, hoặc header sẽ tự động được cập nhật ở front-end thông qua on-demand revalidation được Next.js hỗ trợ.

> Lưu ý: nếu một hình ảnh đã bị thay đổi, ví dụ đã được crop, bạn cần publish lại trang đang dùng hình ảnh đó để có thể revalidate cache hình ảnh của Next.js.

## SEO

Template này được cấu hình sẵn với [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) chính thức để kiểm soát SEO toàn diện ngay từ admin panel. Toàn bộ dữ liệu SEO được tích hợp đầy đủ vào website front-end đi kèm với template này. Xem [Website](#website) để biết thêm chi tiết.

## Tìm kiếm

Template này đi kèm các tính năng tìm kiếm SSR, có thể dễ dàng triển khai trong Next.js với Payload. Xem [Website](#website) để biết thêm chi tiết.

## Đơn hàng và Giao dịch

Transaction dùng để lưu lại bất kỳ khoản thanh toán nào, do đó sẽ chứa thông tin về đơn hàng hoặc địa chỉ thanh toán được dùng hoặc phương thức thanh toán và số tiền. Chỉ admin mới truy cập được transaction.

Một đơn hàng chỉ được tạo khi một transaction hoàn tất thành công. Đây là bản ghi mà user đã hoàn tất giao dịch có quyền truy cập để theo dõi lịch sử của họ.

### Truy cập đơn hàng dành cho khách

Guest user có thể truy cập đơn hàng của họ một cách an toàn qua trang `/find-order`:

1. Guest nhập địa chỉ email và mã đơn hàng
2. Nếu đơn hàng tồn tại và khớp với email, một link truy cập sẽ được gửi tới email đó
3. Link chứa một `accessToken` an toàn, cấp quyền truy cập tạm thời để xem đơn hàng

Luồng xác minh qua email này ngăn chặn truy cập trái phép vào chi tiết đơn hàng. `accessToken` là một UUID duy nhất được tạo khi đơn hàng được tạo, và cần thiết (cùng với email) để xem chi tiết đơn hàng với tư cách khách.

**Lưu ý bảo mật:** Email xác nhận đơn hàng nên bao gồm mã đơn hàng để guest có thể dùng tính năng "Tìm đơn hàng". Access token chỉ được gửi qua email xác minh để ngăn chặn tấn công dò số thứ tự.

## Đơn vị tiền tệ

Mặc định, template chỉ hỗ trợ USD, tuy nhiên bạn có thể thay đổi các loại tiền tệ được hỗ trợ qua [cấu hình plugin](https://payloadcms.com/docs/ecommerce/plugin#currencies). Bạn cần đảm bảo các loại tiền tệ được hỗ trợ trong Payload cũng được cấu hình trong nền tảng thanh toán của bạn.

## Stripe

Mặc định chúng tôi đi kèm adapter Stripe đã cấu hình sẵn, nên bạn cần thiết lập `secretKey`, `publishableKey` và `webhookSecret` từ dashboard Stripe của bạn. Làm theo [hướng dẫn của Stripe](https://docs.stripe.com/get-started/api-request?locale=en-GB) để thiết lập.

## Kiểm thử

Chúng tôi cung cấp sẵn các bài test tự động cho cả E2E và Int cùng với template này. Chúng được chạy trong CI của chúng tôi để đảm bảo độ ổn định của template theo thời gian. Bạn có thể tích hợp chúng vào CI của bạn hoặc chạy ở local qua:

Để chạy Int test với Vitest:

```bash
pnpm test:int
```

Để chạy E2E với Playwright:

```bash
pnpm test:e2e
```

hoặc

```bash
pnpm test
```

Để chạy cả hai.

## Jobs và lịch xuất bản

Chúng tôi đã cấu hình [Scheduled Publish](https://payloadcms.com/docs/versions/drafts#scheduled-publish), dùng [jobs queue](https://payloadcms.com/docs/jobs-queue/jobs) để publish hoặc gỡ publish nội dung của bạn vào một thời điểm định trước. Các task chạy theo lịch cron và cũng có thể chạy như một instance riêng nếu cần.

> Lưu ý: Khi deploy trên Vercel, tùy theo gói dịch vụ, bạn có thể chỉ được giới hạn cron chạy hàng ngày.

## Website

Template này bao gồm một front-end được thiết kế đẹp mắt, sẵn sàng cho production, xây dựng bằng [Next.js App Router](https://nextjs.org), chạy cùng với app Payload của bạn trong cùng một instance. Điều này giúp bạn có thể deploy cả backend và website ở bất cứ đâu bạn cần.

Các tính năng chính:

- [Next.js App Router](https://nextjs.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Hook Form](https://react-hook-form.com)
- [Payload Admin Bar](https://github.com/payloadcms/payload/tree/3.x/packages/admin-bar)
- [Styling với TailwindCSS](https://tailwindcss.com/)
- [Component shadcn/ui](https://ui.shadcn.com/)
- Tài khoản người dùng và xác thực
- Blog đầy đủ tính năng
- Quy trình xuất bản (publication workflow)
- Chế độ tối (dark mode)
- Các block dựng layout dựng sẵn
- SEO
- Tìm kiếm
- Xem trước trực tiếp (live preview)
- Thanh toán qua Stripe

### Cache

Mặc dù Next.js đã có sẵn một bộ chiến lược caching mạnh mẽ, Payload Cloud vẫn proxy và cache tất cả file thông qua Cloudflare bằng [Official Cloud Plugin](https://www.npmjs.com/package/@payloadcms/payload-cloud). Nghĩa là caching của Next.js là không cần thiết và bị tắt mặc định. Nếu bạn host app ở ngoài Payload Cloud, bạn có thể dễ dàng bật lại cơ chế caching của Next.js bằng cách gỡ directive `no-store` khỏi tất cả các fetch request trong `./src/app/_api`, sau đó gỡ tất cả các dòng `export const dynamic = 'force-dynamic'` khỏi các file page, ví dụ như `./src/app/(pages)/[slug]/page.tsx`. Để biết thêm chi tiết, xem [tài liệu Caching của Next.js](https://nextjs.org/docs/app/building-your-application/caching) chính thức.

## Phát triển

Để khởi chạy ví dụ này ở local, làm theo [Bắt đầu nhanh](#bắt-đầu-nhanh). Sau đó [Seed](#seed) database với một vài trang, bài viết, và project.

### Làm việc với Postgres

Postgres và các database SQL khác tuân theo một schema chặt chẽ để quản lý dữ liệu. So với adapter MongoDB của chúng tôi, điều này có nghĩa là sẽ có thêm vài bước khi làm việc với Postgres.

Lưu ý rằng khi thực hiện các thay đổi schema lớn, bạn có thể gặp rủi ro mất dữ liệu nếu không migrate thủ công.

#### Phát triển ở local

Chúng tôi khuyến nghị bạn nên chạy một bản copy database ở local để việc cập nhật schema diễn ra nhanh nhất có thể. Mặc định, adapter Postgres có `push: true` cho môi trường phát triển (development). Điều này cho phép bạn thêm, sửa, xóa field và collection mà không cần chạy migration dữ liệu.

Nếu database của bạn trỏ tới production, bạn nên đặt `push: false`, nếu không bạn sẽ gặp rủi ro mất dữ liệu hoặc làm migration bị lệch (out of sync).

#### Migrations

[Migrations](https://payloadcms.com/docs/database/migrations) về cơ bản là các phiên bản mã SQL dùng để theo dõi schema của bạn. Khi deploy với Postgres, bạn cần đảm bảo tạo và chạy các migration của mình.

Tạo migration ở local

```bash
pnpm payload migrate:create
```

Lệnh này tạo ra các file migration mà bạn cần push cùng với cấu hình mới của bạn.

Trên server, sau khi build và trước khi chạy `pnpm start`, bạn cần chạy migration của mình

```bash
pnpm payload migrate
```

Lệnh này sẽ kiểm tra các migration chưa được chạy, cố gắng chạy chúng, và lưu lại lịch sử các migration đã chạy trong database.

### Docker

Ngoài ra, bạn có thể dùng [Docker](https://www.docker.com) để khởi chạy template này ở local. Để làm vậy, thực hiện các bước sau:

1. Làm theo [bước 1 và 2 ở trên](#phát-triển), file docker-compose sẽ tự động dùng file `.env` ở thư mục gốc dự án của bạn
1. Tiếp theo chạy `docker-compose up`
1. Làm theo [bước 4 và 5 ở trên](#phát-triển) để đăng nhập và tạo user admin đầu tiên

Vậy là xong! Docker instance sẽ giúp bạn khởi động nhanh chóng, đồng thời chuẩn hóa môi trường phát triển giữa các thành viên trong team.

### Seed

Để seed database với một vài trang, sản phẩm, và đơn hàng, bạn có thể click vào link 'seed database' từ admin panel.

Script seed cũng sẽ tạo một user demo chỉ dùng cho mục đích trình diễn:

- Demo Customer
  - Email: `customer@example.com`
  - Mật khẩu: `password`

> LƯU Ý: seed database là một thao tác phá hủy (destructive) vì nó xóa database hiện tại của bạn để tạo một database mới từ template seed. Chỉ chạy lệnh này nếu bạn đang bắt đầu một dự án mới hoặc có thể chấp nhận mất dữ liệu hiện tại.

## Production

Để chạy Payload ở môi trường production, bạn cần build và khởi động Admin panel. Để làm vậy, thực hiện các bước sau:

1. Chạy script `next build` bằng cách chạy `pnpm build` hoặc `npm run build` ở thư mục gốc dự án. Lệnh này tạo thư mục `.next` chứa bundle admin sẵn sàng cho production.
1. Cuối cùng chạy `pnpm start` hoặc `npm run start` để chạy Node ở môi trường production và phục vụ Payload từ thư mục `.build`.
1. Khi bạn sẵn sàng go-live, xem phần Deployment bên dưới để biết thêm chi tiết.

### Deploy lên Vercel

Template này cũng có thể được deploy lên Vercel miễn phí. Bạn có thể bắt đầu bằng cách chọn Vercel DB adapter trong quá trình thiết lập template, hoặc cài đặt và cấu hình thủ công:

```bash
pnpm add @payloadcms/db-vercel-postgres
```

```ts
// payload.config.ts
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'

export default buildConfig({
  // ...
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || '',
    },
  }),
  // ...
```

Chúng tôi cũng hỗ trợ Vercel blob storage:

```bash
pnpm add @payloadcms/storage-vercel-blob
```

```ts
// payload.config.ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  // ...
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
  // ...
```

### Self-hosting

Trước khi deploy app, bạn cần:

1. Đảm bảo app của bạn build và chạy được ở production. Xem [Production](#production) để biết thêm chi tiết.
2. Sau đó bạn có thể deploy Payload như bất kỳ ứng dụng Node.js hoặc Next.js nào khác, trực tiếp trên VPS, DigitalOcean's Apps Platform, qua Coolify hoặc các nền tảng khác. Sẽ có thêm hướng dẫn trong thời gian tới.

Bạn cũng có thể deploy app thủ công, xem [tài liệu deployment](https://payloadcms.com/docs/production/deployment) để biết chi tiết đầy đủ.

## Câu hỏi

Nếu bạn có bất kỳ vấn đề hoặc câu hỏi nào, liên hệ với chúng tôi trên [Discord](https://discord.com/invite/payload) hoặc tạo một [GitHub discussion](https://github.com/payloadcms/payload/discussions).
