# 🏢 Hệ thống Quản lý Bán hàng & Kinh doanh

> Hệ thống quản lý nội bộ toàn diện dành cho doanh nghiệp, tích hợp quản lý đơn hàng, tồn kho, sản xuất, công nợ, nguyên vật liệu và báo cáo doanh thu chuyên sâu.

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cách thức hoạt động & Quy trình nghiệp vụ](#-cách-thức-hoạt-động--quy-trình-nghiệp-vụ)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Phân quyền (RBAC)](#-phân-quyền)

---

## 🎯 Tổng quan

**Quản lý Bán hàng Kinh doanh** là một hệ thống ERP nội bộ được xây dựng với kiến trúc **Client-Server**, tách biệt Backend (API) và Frontend (SPA). Hệ thống hỗ trợ toàn bộ quy trình kinh doanh từ khâu nhận đơn hàng, kiểm tra tồn kho, lên kế hoạch sản xuất (bao gồm cả tính toán nhu cầu nguyên vật liệu theo định mức - BOM), đến khi giao hàng hoàn tất, đồng thời quản lý sát sao công nợ khách hàng và hiệu suất nhân viên.

### Điểm nổi bật
- ✅ **Quy trình đơn hàng khép kín** — Từ tạo đơn → duyệt → sản xuất → xuất kho → hoàn tất.
- ✅ **Quản lý tồn kho & Nguyên vật liệu** — Quản lý cả thành phẩm và nguyên vật liệu (Raw Materials), định mức sản xuất (BOM).
- ✅ **Quản lý công nợ khách hàng** — Theo dõi thanh toán, ghi nhận nợ và nhắc nợ.
- ✅ **Phân quyền nâng cao (RBAC)** — Quản trị Role & Permission linh hoạt, áp dụng Guard cho từng endpoint.
- ✅ **Báo cáo chuyên sâu** — Doanh thu theo kênh, khách hàng, nhân viên và phân tích sản phẩm.
- ✅ **Hệ thống thông báo** — Cảnh báo theo thời gian thực về tồn kho, đơn hàng, công nợ.

---

## ✨ Tính năng

### 1. Quản lý Đơn hàng & Công nợ
- Tạo và xử lý đơn hàng chuyên nghiệp.
- Ghi nhận trạng thái thanh toán và tự động tính toán công nợ (Customer Debts) nếu khách hàng chưa thanh toán đủ.
- Theo dõi lịch sử thanh toán công nợ chi tiết.

### 2. Quản lý Sản xuất & Nguyên vật liệu (BOM)
- Thiết lập Định mức nguyên vật liệu (Bill of Materials - BOM) cho từng sản phẩm.
- Tính toán nhu cầu nguyên vật liệu để sản xuất (Material Requirement Calculator).
- Quản lý nhập/xuất nguyên vật liệu.
- Tự động sinh kế hoạch sản xuất và theo dõi tiến độ.

### 3. Quản lý Tồn kho
- Quản lý tồn kho thành phẩm theo thời gian thực.
- Cảnh báo tồn kho dưới ngưỡng an toàn (Low stock alerts).
- Lịch sử xuất/nhập/điều chỉnh (Inventory Logs).

### 4. Báo cáo & Thống kê Nâng cao
- Thống kê doanh thu theo kênh bán hàng, theo nhân viên, và theo khách hàng.
- Phân tích hiệu suất sản phẩm (Product Analytics).
- Dashboard tổng quan với các biểu đồ trực quan (Recharts).

### 5. Phân quyền & Bảo mật (RBAC)
- Quản lý User, Role và Permission động.
- Middleware / Guard bảo vệ các endpoint API dựa trên quyền hạn.

---

## 🛠 Công nghệ sử dụng

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy (ORM), MySQL, JWT, Alembic.
- **Frontend:** React 18 (TypeScript), Vite, Ant Design 5, Tailwind CSS, Zustand, Recharts, Axios.
- **Kiến trúc:** RESTful API, Service Repository Pattern (áp dụng ở Backend).

---

## 🏗 Kiến trúc hệ thống

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                              │
│ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│ │Dashboard│ │ Orders  │ │Inventory │ │   BOM   │ │  Debts  │ │ Analytics │ │
│ └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └────┬────┘ └─────┬─────┘ │
│      └───────────┴───────────┴────────────┴───────────┴────────────┘       │
│                                  │ Axios                                   │
└──────────────────────────────────┼─────────────────────────────────────────┘
                                   │ HTTP/REST
┌──────────────────────────────────┼─────────────────────────────────────────┘
│                              Backend (FastAPI)                             │
│                    ┌───────────────────────────────┐                       │
│                    │     Guards & Middlewares      │ (RBAC, Auth)          │
│                    └─────────────┬─────────────────┘                       │
│  ┌─────────┐ ┌─────────┐ ┌───────┴──┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Orders  │ │Inventory│ │Production│ │ Raw Mat │ │  Debts  │ │ Reports │  │
│  │ Router  │ │ Router  │ │  Router  │ │ Router  │ │ Router  │ │ Router  │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │           │           │            │           │           │       │
│  ┌────┴────┐ ┌────┴────┐ ┌────┴─────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐  │
│  │ Order   │ │Inventory│ │Production│ │ BOM/Raw │ │ Debt    │ │ Report  │  │
│  │ Service │ │ Service │ │ Service  │ │ Service │ │ Service │ │ Service │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       └───────────┴───────────┴────────────┴───────────┴───────────┘       │
│                                  │ SQLAlchemy                              │
└──────────────────────────────────┼─────────────────────────────────────────┘
                            ┌──────┴──────┐
                            │    MySQL    │
                            └─────────────┘
```

---

## 📁 Cấu trúc dự án

### Backend (`/backend`)
Được tổ chức theo mô hình Controller - Service - Repository (thông qua SQLAlchemy), giúp tách biệt rõ ràng Business Logic.
```
backend/
├── app/
│   ├── main.py               # Entry point, đăng ký routers, middlewares
│   ├── config.py             # Cấu hình môi trường (.env)
│   ├── database.py           # Thiết lập kết nối MySQL
│   ├── models/               # Định nghĩa các bảng CSDL (SQLAlchemy models)
│   ├── schemas/              # Pydantic Schemas (Validation In/Out)
│   ├── routers/              # Controllers (Định nghĩa các API endpoints)
│   │   ├── auth.py, users.py, orders.py, products.py...
│   │   ├── bom.py            # Quản lý Định mức nguyên vật liệu
│   │   ├── raw_materials.py  # Quản lý nguyên vật liệu
│   │   ├── customer_debts.py # Quản lý công nợ khách hàng
│   │   ├── reports.py, stats.py, product_analytics.py # Báo cáo thống kê
│   │   └── admin_roles.py    # Quản lý phân quyền
│   ├── services/             # Lớp xử lý nghiệp vụ (Business Logic)
│   │   ├── bom_service.py
│   │   ├── debt_service.py
│   │   └── ...
│   └── utils/                # Tiện ích chung
│       ├── security.py       # Hash mật khẩu, tạo token
│       ├── guards.py         # Decorators kiểm tra quyền (RBAC)
│       └── notifications.py  # Xử lý tạo thông báo
├── seed.py & run_seed.py     # Script tạo dữ liệu mẫu ban đầu
└── requirements.txt          # Các thư viện phụ thuộc
```

### Frontend (`/frontend`)
Được chia theo cấu trúc Feature-based, quản lý State tập trung bằng Zustand.
```
frontend/
├── src/
│   ├── components/           # UI components dùng chung
│   ├── pages/                # Các trang chức năng của ứng dụng
│   │   ├── Dashboard.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── ProductionPlanManagement.tsx
│   │   ├── ProductBOM.tsx              # Cấu hình Định mức NVL
│   │   ├── RawMaterials.tsx            # Quản lý Kho NVL
│   │   ├── MaterialRequirementCalculator.tsx # Tính nhu cầu NVL
│   │   ├── CustomerDebts.tsx           # Danh sách công nợ
│   │   ├── CustomerDebtDetail.tsx      # Chi tiết & Thanh toán công nợ
│   │   ├── PermissionManagement.tsx    # Quản lý quyền
│   │   └── ... (Các trang báo cáo doanh thu, nhân viên, v.v.)
│   ├── services/             # API Client (Sử dụng Axios để gọi Backend)
│   ├── store/                # Zustand stores quản lý Global State (Auth,...)
│   ├── utils/                # Formatters, helpers
│   ├── types/                # TypeScript Interfaces/Types
│   └── index.css & main.tsx  # Global styles và điểm khởi chạy
├── package.json              # Cấu hình npm
└── vite.config.ts            # Cấu hình Vite builder
```

---

## 🔄 Cách thức hoạt động & Quy trình nghiệp vụ

Hệ thống hoạt động thông qua sự tương tác chặt chẽ giữa các phân hệ (Modules), đảm bảo quy trình kinh doanh diễn ra xuyên suốt và không bị ngắt quãng.

### 1. Quy trình Đơn hàng & Công nợ (Order to Cash)

Luồng xử lý từ khi nhận yêu cầu của khách hàng cho đến khi thu được tiền:

```mermaid
flowchart TD
    A([Tạo Đơn Hàng]) --> B{Kiểm tra tồn kho}
    B -- Đủ hàng --> C[Trừ Tồn Kho Thành Phẩm]
    B -- Thiếu hàng --> D[Cảnh báo & Gợi ý tạo KH Sản Xuất]
    C --> E[Giao Hàng]
    E --> F{Thanh toán}
    F -- 100% --> G([Hoàn Tất Đơn Hàng])
    F -- Trả góp / Nợ --> H[Ghi nhận Công Nợ]
    H --> I[Theo dõi & Nhắc nợ]
    I --> J[Khách Hàng Trả Nợ]
    J --> K{Hết Nợ?}
    K -- Chưa --> I
    K -- Rồi --> G
```

- **Xử lý công nợ:** Hệ thống theo dõi tại `CustomerDebts`. Khi khách hàng chuyển khoản bổ sung, kế toán thực hiện "Thu nợ", cập nhật số dư nợ và lưu lại lịch sử chi tiết.

### 2. Quy trình Sản xuất & Quản lý Nguyên vật liệu (BOM & Production)

Quy trình khép kín để đảm bảo luôn có đủ nguồn lực sản xuất và tối ưu hóa hàng hóa tồn kho:

```mermaid
flowchart TD
    A([Tạo Kế Hoạch Sản Xuất]) --> B[Hệ thống đọc Định mức BOM]
    B --> C[Tính tổng nhu cầu Nguyên Vật Liệu]
    C --> D{So sánh với Kho NVL}
    D -- Thiếu --> E[Cảnh báo & Yêu cầu Nhập thêm NVL]
    D -- Đủ --> F[Bắt đầu Sản xuất]
    E -. Nhập xong NVL .-> F
    F --> G[Trừ Kho Nguyên Vật Liệu Thực Tế]
    G --> H[Theo dõi Tiến độ]
    H --> I([Hoàn thành & Nhập Kho Thành Phẩm])
```

- **Material Requirement Calculator:** Tính năng tự động quét qua danh sách cần sản xuất và BOM để lập bảng dự trù số lượng Nguyên vật liệu (Raw Materials) cần có.

### 3. Phân quyền và Bảo mật (RBAC Flow)

Mọi thao tác của người dùng đều bị kiểm soát nghiêm ngặt bởi mô hình Role-Based Access Control:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Guards (Backend)
    participant Database

    User->>Frontend: Click "Tạo Đơn Hàng"
    Frontend->>Guards (Backend): POST /orders (Header: Bearer JWT)
    Guards (Backend)->>Database: Truy vấn User & Role
    Database-->>Guards (Backend): Trả về Permissions (vd: `order:create`)
    alt Có quyền
        Guards (Backend)->>Database: Thực thi lưu Đơn Hàng
        Database-->>Frontend: 200 OK
        Frontend-->>User: Hiển thị thông báo Thành Công
    else Không có quyền
        Guards (Backend)-->>Frontend: 403 Forbidden
        Frontend-->>User: Hiển thị lỗi "Không có quyền thao tác"
    end
```

- Frontend tự động ẩn các menu và nút chức năng nếu User hiện tại không có quyền tương ứng trong mảng `Permissions` lưu ở State Store (Zustand).

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- Python 3.10+
- Node.js 16+
- MySQL 8.0+

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```
Tạo file `backend/.env` với nội dung:
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/sales_management
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
Khởi tạo database và chạy Server:
```bash
python run_seed.py  # Tạo bảng & dữ liệu mẫu (có sẵn User admin/admin)
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Truy cập hệ thống tại: `http://localhost:5173`
API Swagger Docs: `http://localhost:8000/docs`

---
> **Dự án đồ án tốt nghiệp** — Hệ thống Quản lý Bán hàng & Kinh doanh nội bộ
> Người thực hiện: Nguyễn Nhật Anh - MSSV: 2280600083
