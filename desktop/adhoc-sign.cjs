// Ký "ad-hoc" cho bản Mac để máy chip Apple (M1/M2/M3…) chạy được khi chưa có chứng chỉ Apple Developer.
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`ad-hoc signing ${app}`);
  execSync(`codesign --force --deep --sign - "${app}"`, { stdio: 'inherit' });
};
