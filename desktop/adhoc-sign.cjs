// Ký "ad-hoc" cho bản Mac để máy chip Apple chạy được khi chưa có chứng chỉ Apple Developer.
// Ký từ trong ra ngoài (framework, helper, rồi app chính) – cách Apple khuyến nghị, ổn định hơn --deep.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sign = (p) => execSync(`codesign --force --sign - --timestamp=none "${p}"`, { stdio: 'inherit' });

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  const fw = path.join(app, 'Contents', 'Frameworks');
  console.log(`ad-hoc signing ${app}`);
  for (const name of fs.readdirSync(fw)) {
    const p = path.join(fw, name);
    if (name.endsWith('.framework')) {
      const libs = path.join(p, 'Versions', 'A', 'Libraries');
      if (fs.existsSync(libs)) for (const lib of fs.readdirSync(libs)) sign(path.join(libs, lib));
      const shipIt = path.join(p, 'Versions', 'A', 'Resources', 'ShipIt');
      if (fs.existsSync(shipIt)) sign(shipIt);
      const helpers = path.join(p, 'Versions', 'A', 'Helpers');
      if (fs.existsSync(helpers)) for (const h of fs.readdirSync(helpers)) sign(path.join(helpers, h));
    }
    sign(p);
  }
  sign(app);
  execSync(`codesign --verify --deep --strict --verbose=2 "${app}"`, { stdio: 'inherit' });
};
