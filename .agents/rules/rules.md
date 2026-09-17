---
trigger: always_on
---

# Project Rules & Coding Standards

Dự án: **VNDOCTOR** (Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Redux Toolkit, Shadcn UI).

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

- **Ngắn gọn & Tối giản (KISS)**: Viết code ngắn gọn, đơn giản nhất có thể. Tránh over-engineering, không tạo lớp trừu tượng (abstraction layer) hoặc wrapper khi chưa cần thiết.
- **Dễ bảo trì & Rõ ràng**: Code tự giải thích ngắn gọn 1 dòng (self-documenting), không lạm dụng comment cho logic hiển nhiên. Giữ hàm nhỏ, đơn nhiệm.
- **TypeScript chuẩn**: Khai báo type rõ ràng cho props và API responses. Tận dụng type inference.
- **Tuyệt đối không sử dụng type any** : Trong quá trình code không được phép sử dụng type any.

---

## 2. Cấu Trúc Thư Mục Chuẩn (Folder Structure)

Tuân thủ nghiêm ngặt cấu trúc thư mục sau khi tạo file mới:

```text
tmt-vndoctor/
├── app/                  # Next.js App Router (chỉ chứa route handlers, layout, page wrappers)
│   ├── (routes)/         # Nhóm route theo logic nếu cần
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Trang chủ
├── features/             # Quản lý theo module/tính năng (Feature-based)
│   └── [feature-name]/
│       ├── components/   # UI components riêng của tính năng
│       ├── hooks/        # Custom hooks riêng của tính năng (nếu có)
│       └── types/        # Types/Interfaces nội bộ tính năng
├── components/           # Components dùng chung
│   ├── ui/               # Base UI / Shadcn components (button, dialog, input...)
│   └── common/           # Shared components đa tính năng (header, sidebar, empty-state...)
├── store/                # Redux Toolkit & RTK Query
│     - store.ts          # Store configuration & RootState/AppDispatch
│     - hooks.ts          # useAppDispatch, useAppSelector typed hooks
│     - slices/           # Redux slices hoặc RTK Query API endpoints
│     - apis/             # RTK Query service definitions
├── hooks/                # Custom hooks dùng chung toàn dự án
├── lib/                  # Utilities và helper functions (cn, formatters, constants)
│   └── utils.ts
└── types/                # Global types / DTOs dùng chung
```

---

## 3. Quy Chuẩn Viết Code (Coding Guidelines)

### A. Next.js & React 19

- **Server Components (RSC) mặc định**: Giữ component ở server bất cứ khi nào có thể để tối ưu hiệu năng.
- **Client Components**: Chỉ thêm `'use client'` khi bắt buộc (dùng hooks `useState`, `useEffect`, event listeners hoặc browser API). Luôn đẩy `'use client'` xuống component lá (leaf component) nhỏ nhất.
- **Early Returns**: Ưu tiên kiểm tra điều kiện và return sớm (guard clauses) để tránh lồng ghép `if-else` sâu.

### B. Styling (Tailwind CSS v4)

- Sử dụng các component của shadcn
- Viết utility classes trực tiếp trong `className`.
- Dùng hàm `cn()` từ `@/lib/utils` khi nối class hoặc xử lý conditional class.
- Tận dụng biến màu và design tokens đã cấu hình trong `globals.css`.
- Cỡ chữ hệ thống sử dụng text-sm

### C. State Management & Data Fetching

- **Server State / API**: Ưu tiên dùng RTK Query cho data fetching, caching và optimistic updates.
- **Global UI State**: Dùng Redux Slice khi state thực sự cần chia sẻ giữa nhiều component xa nhau.
- **Local State**: Dùng `useState`, `useReducer` cho state cục bộ. Tránh đẩy local state vào Redux store.

### D. Form & Validation

- Dùng `react-hook-form` kết hợp `zod` (`@hookform/resolvers/zod`).
- Định nghĩa schema Zod ngắn gọn, tách biệt với UI component nếu schema phức tạp.

---

## 4. Quy Tắc Đặt Tên (Naming Conventions)

- **File & Folder**:
   - Components: `kebab-case.tsx` (nhất quán theo thư mục).
   - Hooks: `use-[name].ts` (ví dụ: `use-disclosure.ts`).
   - Utils / Config: `kebab-case.ts` (ví dụ: `date-utils.ts`).
- **Biến & Hàm**: `camelCase` (ví dụ: `handleSubmit`, `isLoading`).
- **Component / Type / Interface**: `PascalCase` (ví dụ: `UserProfileCard`, `PatientRecord`).
- **Hằng số / Enums**: `UPPER_SNAKE_CASE` (ví dụ: `API_ENDPOINTS`, `DEFAULT_PAGE_SIZE`).

---

## 5. Yêu Cầu Khi AI Tạo Hoặc Chỉnh Sửa Code

1. **Kiểm tra trước khi tạo**: Luôn kiểm tra thư mục hiện có để đặt file đúng vị trí quy định.
2. **Không thêm boilerplate dư thừa**: Chỉ viết code cần thiết để giải quyết yêu cầu, không sinh code thừa hoặc các interface/hàm giả định chưa dùng đến.
3. **Giữ nguyên định dạng & ngữ cảnh**: Khi sửa file hiện hữu, chỉ cập nhật phần liên quan, tôn trọng style code đã có trong file.
