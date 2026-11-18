# Chuyển sang dự án Firebase riêng + tên miền riêng

## A. Tạo dự án Firebase (console.firebase.google.com)
1. **Create a project** → đặt tên (vd. `taichinh`) → có thể tắt Google Analytics.
2. **Project settings → Your apps → Web (</>)** → đặt tên app → **Register app**. Chép khối `firebaseConfig`.
3. **Authentication → Get started → Sign-in method**: bật **Google** và **Email/Password**.
4. **Firestore Database → Create database** → vị trí `asia-southeast1 (Singapore)` → **production mode**.
5. **Hosting → Get started** → bấm qua các bước (không cần cài gì).

## B. Cho GitHub quyền đưa web lên Firebase
1. **Project settings → Service accounts → Generate new private key** → tải file JSON.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Secret: dán **toàn bộ nội dung** file JSON.
3. Xoá file JSON trên máy sau khi dán. **Không gửi file này cho ai.**

## C. Tên miền riêng
1. Mua tên miền ở nhà cung cấp bất kỳ.
2. Firebase **Hosting → Add custom domain** → làm theo hướng dẫn thêm bản ghi DNS ở nơi mua tên miền.
3. **Authentication → Settings → Authorized domains → Add domain** → thêm tên miền đó.
4. Google Cloud Console → **APIs & Services → Credentials → OAuth 2.0 Client (Web client)** →
   **Authorized redirect URIs** thêm `https://<tên-miền>/__/auth/handler`.
5. Thêm tên miền vào `hostingDomains` trong `firebase-config.json`.

## D. Chuyển app sang dự án mới
1. Trên app Mac/Windows (đang đăng nhập dự án cũ), đợi dữ liệu đồng bộ xong và **Cài đặt → Sao lưu & Khôi phục → Xuất file** để dự phòng.
2. Thay nội dung `firebase-config.json` bằng cấu hình mới (`firestoreDatabaseId` để `(default)`), đẩy lên `main`.
3. App tự cập nhật. Đăng nhập lại (Google hoặc email): dữ liệu trên máy tự được tải lên dự án mới vì tài khoản mới còn trống.
