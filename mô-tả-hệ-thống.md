Dưới đây là phiên bản viết lại rõ ràng, mạch lạc và mang tính “spec” hơn để bạn có thể dùng trao đổi với team kỹ thuật:

---

## 📌 Mô tả hệ thống Admin (Mini CRM cho Sale & Marketing)

### 1. Mục tiêu

Xây dựng một hệ thống **Admin trung tâm (mini CRM)** dùng để quản lý và vận hành toàn bộ hoạt động của đội **sale (telesale)** và **marketing (ads/content)**.

Hệ thống này đóng vai trò là **nền tảng lõi**, cho phép tích hợp và mở rộng thêm các module khác trong tương lai.

---

### 2. Phạm vi chức năng chính

#### 2.1. Quản lý tập trung các module

Hệ thống cần quản lý tổng thể các mảng hoạt động chính, bao gồm:

* **Quản trị Telesale**

  * Quản lý nhân sự sale
  * Theo dõi hiệu quả làm việc (call, chuyển đổi, doanh thu...)
* **Quản trị Ads/Marketing**

  * Quản lý chiến dịch quảng cáo
  * Theo dõi chi phí, hiệu quả (CPC, conversion...)

👉 Các module này sẽ được phát triển riêng và **kết nối vào hệ thống Admin trung tâm**.

---

#### 2.2. Phân quyền người dùng (RBAC)

Hệ thống cần có cơ chế phân quyền rõ ràng theo vai trò:

* **Nhân viên**

  * Truy cập dữ liệu và chức năng cơ bản
  * Bị giới hạn theo phạm vi công việc

* **Leader / Trưởng nhóm**

  * Xem và quản lý dữ liệu của team mình
  * Có thêm quyền chỉnh sửa / duyệt

* **Trưởng phòng / Admin cấp cao**

  * Toàn quyền truy cập hệ thống
  * Quản lý người dùng và phân quyền

👉 Cần thiết kế theo mô hình **Role-Based Access Control (RBAC)** để dễ mở rộng sau này.

---

#### 2.3. Dashboard tổng quan (Phase sau)

* Hiển thị các chỉ số quan trọng:

  * Doanh số của đội sale
  * Hiệu quả chiến dịch ads
  * Chi phí vs doanh thu
* Có thể filter theo:

  * Thời gian
  * Team / cá nhân

👉 **Lưu ý:** phần này có thể triển khai ở giai đoạn sau (phase 2).

---

### 3. Kiến trúc hệ thống (định hướng)

* Đây là **core platform (nền tảng trung tâm)**
* Các hệ thống khác (telesale, ads, automation, AI...) sẽ:

  * Kết nối vào hệ thống này qua API hoặc database
  * Sử dụng chung:

    * User management
    * Permission
    * Dashboard

---

### 4. Định hướng phát triển

* Bắt đầu từ:

  * User + Role + Permission
  * Khung admin UI
* Sau đó:

  * Tích hợp từng module (telesale → ads → dashboard)
* Cuối cùng:

  * Mở rộng thành hệ sinh thái quản trị nội bộ

---

### 5. Tóm tắt

Hệ thống này là:

> Một **Admin Platform trung tâm**, dùng để quản lý người dùng, phân quyền, và tích hợp các module vận hành (sale, marketing), đóng vai trò là nền tảng cho toàn bộ hệ thống sau này.

---

Nếu bạn muốn, mình có thể giúp bạn chuyển tiếp phần này thành:

* ✅ Sơ đồ kiến trúc (diagram như bạn đang làm Kafka/SCADA)
* ✅ Database schema (User, Role, Permission)
* ✅ Hoặc chia task backlog kiểu Jira cho dev triển khai luôn
