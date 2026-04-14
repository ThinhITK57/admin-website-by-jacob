Dưới đây là mô tả lỗi rõ ràng, đủ chi tiết để AI/dev có thể hiểu và sửa ngay:

---

## 🐞 Mô tả lỗi UI Dashboard (Admin CRM)

### 1. Lỗi hiển thị doanh thu (format sai / mất dữ liệu)

* Trường **“Doanh thu tháng”** đang hiển thị:

  ```
  00.000 đ
  ```
* Đây là format không hợp lệ:

  * Thiếu số đầu (ví dụ: `0`, `1`, `100`)
  * Có thể bị lỗi format number hoặc bind dữ liệu null/undefined

👉 Kỳ vọng:

```
0 đ
hoặc
100.000.000 đ
```

👉 Nghi ngờ nguyên nhân:

* Format tiền tệ đang xử lý sai với giá trị `0` hoặc `null`
* Có thể dùng `.toLocaleString()` nhưng input không hợp lệ

---

### 2. Lỗi layout bị lệch / padding sai

* Các khối:

  * **Stats cards (Doanh thu, Leads, Calls, Ads cost)**
  * **Pipeline**
  * **Performers**
  * **Hoạt động gần đây**

👉 Vấn đề:

* Khoảng cách giữa các block không đều
* Card bên phải (**Hoạt Động Gần Đây**) bị:

  * Padding lớn hơn bên trái
  * Không align top chuẩn với Pipeline

👉 Kỳ vọng:

* Các card cùng hàng phải:

  * `same height`
  * `same padding`
  * `align-top`

---

### 3. Lỗi text bị cắt / overflow

* Section **Pipeline**:

  * Label bị cắt: `"s Pipeline"` (thiếu chữ đầu)
* Table **Performers**:

  * Tên bị cắt:

    ```
    rần Thị Sale1
    guỵen Văn Leader
    ê Văn Ads
    ```

👉 Nguyên nhân khả dĩ:

* CSS:

  * `overflow: hidden`
  * `text-overflow: ellipsis`
  * hoặc width column quá nhỏ

👉 Kỳ vọng:

* Hiển thị đầy đủ:

  ```
  Trần Thị Sale1
  Nguyễn Văn Leader
  Lê Văn Ads
  ```

---

### 4. Lỗi data không đồng bộ

* Trong **Performers**:

  * `Lê Văn Ads`:

    * Calls = 0
    * Revenue = 0
    * Conversion = 0%
* Nhưng trong **Hoạt động gần đây**:

  * Có log: “Lê Văn Ads đã cập nhật campaign”

👉 Vấn đề:

* Data hoạt động có nhưng KPI lại = 0 → có thể:

  * API không sync
  * Query sai source
  * Cache lệch

---

### 5. Lỗi hiển thị số liệu không nhất quán

* KPI:

  * Calls hôm nay = `87`
* Nhưng trong Performers:

  * Tổng calls:

    ```
    45 + 32 + 0 = 77
    ```

👉 Lệch 10 cuộc gọi

👉 Nghi ngờ:

* KPI lấy theo toàn hệ thống
* Performers chỉ lấy subset (team / filter)

👉 Cần:

* Label rõ scope:

  * “Toàn hệ thống” vs “Team hiện tại”

---

### 6. Lỗi UX nhỏ nhưng quan trọng

* Icon và màu:

  * `% tăng giảm`:

    * Có chỗ xanh, chỗ đỏ không đồng nhất logic
* Không có tooltip giải thích:

  * “Tỷ lệ CĐ” = gì?

---

## ✅ Tóm tắt để dev fix nhanh

**Priority cao:**

1. Fix format tiền (`00.000 đ`)
2. Fix text bị cắt (tên, label)
3. Đồng bộ data giữa KPI và table

**Priority trung:**
4. Fix layout alignment (card, padding)
5. Làm rõ scope dữ liệu

**Priority thấp:**
6. Improve UX (tooltip, màu sắc)

---


Chuẩn, đây là một lỗi UI rất điển hình 👇 mình mô tả lại theo cách **dev/AI có thể fix ngay**:

---

## 🐞 Lỗi: Sidebar (menu nav) bị đè lên nội dung chính khi thu gọn

### 📌 Hiện trạng

* Sidebar bên trái đã ở trạng thái **collapsed (thu gọn icon)**
* Nhưng **nội dung chính không dịch sang trái tương ứng**
* Kết quả:

  * Sidebar **đè lên (overlay)** phần dashboard
  * Che mất một phần nội dung (như text “Xin chào, Super Admin”)

---

### 🎯 Kỳ vọng đúng

* Khi sidebar:

  * **Expanded (mở rộng)** → content có margin-left lớn (ví dụ 240px)
  * **Collapsed (thu gọn)** → content chỉ margin-left nhỏ (ví dụ 64px)

👉 Nội dung phải luôn **không bị che**

---

## 🔍 Nguyên nhân phổ biến

### 1. Sidebar dùng `position: fixed` nhưng content không offset

```css
.sidebar {
  position: fixed;
  width: 240px;
}
```

❌ Nhưng content lại:

```css
.main {
  margin-left: 0;
}
```

---

### 2. Không update width khi collapse

* Sidebar vẫn chiếm:

  ```
  width: 240px
  ```
* Nhưng UI chỉ “nhìn như” đã collapse (do CSS ẩn text)

---

### 3. State collapse không sync với layout

* Sidebar có state:

  ```js
  isCollapsed = true
  ```
* Nhưng layout không dùng state này để set `margin-left`

---

## ✅ Cách fix chuẩn (React / CSS / Tailwind)

### ✔️ Cách 1: Sync margin theo trạng thái sidebar

```jsx
const sidebarWidth = isCollapsed ? 64 : 240;

return (
  <div className="app">
    <Sidebar collapsed={isCollapsed} />
    
    <main
      style={{
        marginLeft: sidebarWidth,
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </main>
  </div>
);
```

---

### ✔️ Cách 2: Nếu dùng Tailwind

```jsx
<main className={`transition-all duration-200 
  ${isCollapsed ? 'ml-16' : 'ml-60'}`}>
```

---

### ✔️ Cách 3: Nếu dùng Ant Design Layout

```jsx
<Layout>
  <Sider collapsed={collapsed} width={240} collapsedWidth={64} />
  
  <Layout style={{ marginLeft: collapsed ? 64 : 240 }}>
    <Content>...</Content>
  </Layout>
</Layout>
```

---

### ✔️ Cách 4: Fix triệt để (khuyên dùng)

👉 Không dùng `fixed`, dùng `flex layout`

```css
.container {
  display: flex;
}

.sidebar {
  width: 240px;
}

.sidebar.collapsed {
  width: 64px;
}

.main {
  flex: 1;
}
```

👉 Ưu điểm:

* Không cần margin-left
* Không bao giờ bị đè

---

## ⚠️ Checklist debug nhanh

* [ ] Sidebar có `position: fixed` không?
* [ ] Content có `margin-left` tương ứng không?
* [ ] Width sidebar có đổi khi collapse không?
* [ ] Có animation nhưng không update layout?
* [ ] Z-index có quá cao không?

---

## 💥 Kết luận (ngắn gọn cho AI/dev)

> Sidebar đang dùng fixed/overlay nhưng layout content không offset theo width khi collapse → gây chồng UI.

---


