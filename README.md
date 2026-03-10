# 💸 Drag Spend

> Ứng dụng theo dõi chi tiêu với giao diện kéo-thả trực quan — ghi nhận giao dịch nhanh chóng chỉ bằng một thao tác kéo.

**🌐 Live demo:** [https://drag-spend-web.vercel.app/](https://drag-spend-web.vercel.app/)

---

## ✨ Tính năng nổi bật

### 🃏 Spending Cards (Thẻ chi tiêu mẫu)

- Tạo các **thẻ chi tiêu tái sử dụng** với tên, danh mục, và nhiều mức tiền (variants)
- Ví dụ: Thẻ "Ăn sáng" có thể có các mức 25k / 35k / 50k
- Tìm kiếm và lọc thẻ nhanh chóng
- Thẻ tự động được sắp xếp theo tần suất sử dụng

### 📅 Kéo-thả lên lịch

- **Kéo thẻ vào ngày** để ghi nhận giao dịch ngay lập tức — không cần điền form
- Kéo sắp xếp lại thứ tự giao dịch trong ngày
- Phản hồi trực quan khi kéo với overlay nổi bật

### 📆 Lịch tháng

- Xem tổng thu/chi theo từng ngày trên lưới lịch
- Thanh màu trực quan thể hiện mức chi tiêu của mỗi ngày
- Điều hướng tháng trước / tháng sau

### 📊 Báo cáo

- **Biểu đồ cột**: So sánh chi tiêu và thu nhập theo ngày trong tháng
- **Biểu đồ tròn**: Phân tích cơ cấu chi tiêu theo danh mục
- Tổng hợp thu/chi theo từng danh mục

### ⚡ Tiện ích thao tác nhanh

- **Sao chép từ hôm qua**: Copy toàn bộ giao dịch của ngày trước vào ngày hiện tại
- **Lưu thành thẻ**: Biến một giao dịch thành thẻ mẫu để tái sử dụng
- **Chỉnh sửa nhanh**: Sửa tiêu đề, số tiền, danh mục trực tiếp

### 🔐 Xác thực & Bảo mật

- Đăng ký / Đăng nhập bằng email và mật khẩu
- Mỗi người dùng chỉ thấy và quản lý dữ liệu của riêng mình (Row Level Security)
- Tự động tạo danh mục mặc định (ăn uống, tiền trọ, xăng xe...) khi đăng ký lần đầu

### 📱 Responsive

- Giao diện 4 cột trên desktop
- Tab bar điều hướng cảm ứng trên mobile

---

## 🛠 Tech Stack

| Lĩnh vực        | Công nghệ                       |
| --------------- | ------------------------------- |
| Framework       | Next.js 15 (App Router)         |
| Language        | TypeScript                      |
| Styling         | Tailwind CSS v4                 |
| UI Components   | shadcn/ui + Lucide Icons        |
| Drag & Drop     | dnd-kit (core, sortable)        |
| State           | Zustand                         |
| Data Fetching   | TanStack Query (React Query v5) |
| Database & Auth | Supabase (PostgreSQL + Auth)    |
| Charts          | Recharts                        |
| Date            | date-fns (Vietnamese locale)    |
| Notifications   | Sonner                          |
| Deployment      | Vercel                          |

---

## 🚀 Chạy dự án ở local

### Yêu cầu

- Node.js 18+
- npm / yarn / pnpm
- Tài khoản [Supabase](https://supabase.com) (miễn phí)

### 1. Clone repository

```bash
git clone <repo-url>
cd drag_spend_web
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` ở thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Lấy các giá trị này từ **Supabase Dashboard → Project Settings → API**.

### 4. Khởi tạo database

Chạy các file SQL theo thứ tự trong Supabase SQL Editor:

```
supabase/schema.sql                    # Tạo bảng và RLS policies
supabase/migrations/001_update_categories.sql
supabase/migrations/002_seed_default_cards.sql
```

### 5. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt.

---

## 📁 Cấu trúc dự án

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Trang gốc (redirect theo auth)
│   ├── layout.tsx             # Root layout
│   ├── auth/
│   │   ├── login/             # Trang đăng nhập
│   │   └── register/          # Trang đăng ký
│   ├── dashboard/             # Trang dashboard chính
│   └── landing/               # Trang giới thiệu
│
├── components/
│   ├── providers.tsx          # Theme + React Query providers
│   └── dashboard/
│       ├── DashboardClient.tsx    # Layout 4 cột + drag context
│       ├── CardPanel.tsx          # Thư viện thẻ chi tiêu
│       ├── SelectedDayView.tsx    # Danh sách giao dịch trong ngày
│       ├── MonthlyView.tsx        # Lịch tháng
│       ├── ReportView.tsx         # Biểu đồ và báo cáo
│       ├── CreateCardDialog.tsx   # Tạo / chỉnh sửa thẻ
│       ├── EditTransactionDialog.tsx  # Chỉnh sửa giao dịch
│       ├── SpendingCardItem.tsx   # UI thẻ chi tiêu
│       ├── TransactionItem.tsx    # Hàng giao dịch trong ngày
│       └── CardDragOverlay.tsx    # Overlay khi kéo thẻ
│
├── hooks/
│   └── useData.ts             # Tất cả React Query hooks (fetch + mutations)
│
├── store/
│   └── useAppStore.ts         # Zustand global state
│
├── lib/
│   ├── supabase/              # Supabase client (browser, server, middleware)
│   ├── currency.ts            # Format VND
│   └── utils.ts               # cn() helper
│
└── types/
    └── index.ts               # TypeScript types
```

---

## 🗄 Database Schema

```
profiles         — Thông tin người dùng (tên, đơn vị tiền tệ)
categories       — Danh mục thu/chi (có sẵn tiếng Việt)
spending_cards   — Thẻ chi tiêu mẫu (template)
card_variants    — Các mức tiền của mỗi thẻ
transactions     — Giao dịch thực tế theo ngày
```

---

## 🤝 Contributing

Pull requests are welcome. Mở issue trước khi làm các thay đổi lớn.

---

## 📄 License

MIT
