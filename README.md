# Tài Chính – Quản lý chi tiêu

Ứng dụng quản lý tài chính cá nhân: thu chi, 6 hũ tiết kiệm, tài sản, tính phương án đầu tư (vàng, nhà đất) và trợ lý **Lộc** nhắc tiết kiệm. Giao diện tối giản, Liquid Glass, tông xanh lá.

## Chạy trên máy

```bash
npm install
npm run dev        # mở http://localhost:3000
```

## Tải bản cài

Vào tab **Releases** của repo:

- **Mac**: file `.dmg` (`arm64` cho máy chip Apple, `x64` cho máy Intel). Lần đầu mở: chuột phải → Open.
- **Windows**: file `.exe`.
- **iPhone**: mở bản web bằng Safari → Chia sẻ → *Thêm vào Màn hình chính*.

Bản cài được GitHub Actions tự đóng gói mỗi khi tạo tag `v*` (xem `.github/workflows/release.yml`):

```bash
git tag v1.0.1 && git push origin v1.0.1
```

## Tự cập nhật

- **Mac / Windows (từ bản 1.0.3):** mỗi lần đẩy code lên `main`, workflow *Cập nhật giao diện* đăng gói mới ở bản phát hành `web-latest`. App tự tải khi mở (và mỗi 6 tiếng), rồi hỏi tải lại. Trên Mac còn có menu *Tài Chính → Kiểm tra cập nhật…*
- **iPhone:** bản web trên GitHub Pages tự cập nhật khi mở app.
- Chỉ khi sửa thư mục `desktop/` mới cần cài lại: tăng `version` trong `desktop/package.json` và `MIN_SHELL` trong `.github/workflows/web.yml`, rồi chạy workflow *Đóng gói app*.

## Đưa bản web lên mạng (cho iPhone)

Bật **Settings → Pages → Source: GitHub Actions** (repo cần công khai hoặc có gói GitHub Pro). Trang sẽ ở `https://vubinh262.github.io/taichinhapp/`.

Hoặc dùng dịch vụ khác:

Bản web là trang tĩnh (Vite). Có thể đưa lên Vercel / Netlify / Cloudflare Pages miễn phí:
nhập repo này, lệnh build `npm run build`, thư mục xuất `dist`.
Nếu dùng đăng nhập Google, thêm tên miền mới vào *Firebase → Authentication → Settings → Authorized domains*.

## Nhập nhanh bằng AI

Trong form *Ghi chép mới*, gõ hoặc nói: `trưa ăn phở 45k, đổ xăng 80k tiền mặt`.
Bộ phân tích tiếng Việt chạy ngay trên máy, không cần mạng. Có thể dán API key Gemini (miễn phí tại aistudio.google.com/apikey) để hiểu câu phức tạp hơn; key chỉ lưu trên thiết bị.

## Cấu trúc chính

- `src/components/HomeView.tsx` – Tổng quan, "Hôm nay được tiêu"
- `src/context/JarsContext.tsx`, `src/components/JarsView.tsx` – 6 hũ, giai đoạn lớn lên của Lộc
- `src/components/InvestView.tsx` – tính phương án đầu tư
- `src/lib/quickParse.ts`, `src/components/QuickAdd.tsx` – nhập nhanh bằng AI
- `src/components/Loc.tsx` – nhân vật Lộc
- `desktop/` – đóng gói Electron cho Mac/Windows
