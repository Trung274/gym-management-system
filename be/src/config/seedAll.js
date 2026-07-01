/**
 * seed:all — runs all seed scripts in dependency order
 *
 * Order matters:
 *   1. roles       — creates Permission + Role + admin User (clears old data)
 *   2. staff       — adds staff:* permissions (admin/manager), creates staff role (lễ tân)
 *   3. members     — adds member permissions, creates member role
 *   4. plans       — adds plan permissions, seeds 3 subscription plans
 *   5. trainers    — adds trainer permissions, creates trainer role
 *   6. bookings    — adds booking permissions, assigns to member role
 *   7. gym         — adds gym permissions, seeds GymInfo document
 *   8. equipment   — adds equipment permissions, seeds 5 equipment items
 *   9. classes     — adds class permissions, seeds 3 classes
 *  10. checkins    — adds check-in permissions
 *  11. dashboard   — adds dashboard:view permission
 *
 *  NOTE: seed:staff chạy trước các domain khác nên phần tạo role 'staff'
 *        có thể thiếu permissions (sẽ hiện ⚠). Đây là trade-off chấp nhận được
 *        vì idempotent: chạy lại seed:staff sau khi seed:all sẽ cập nhật đầy đủ.
 */

require('dotenv').config();
const { execSync } = require('child_process');

const seeds = [
  'seed:roles',     // 1. xóa sạch Permission+Role+User, tạo lại admin+user
  'seed:staff',     // 2. staff:* permissions + role manager + role staff (lễ tân)
  'seed:members',   // 3. xóa Members → member permissions + role member
  'seed:plans',     // 4. xóa SubscriptionPlans → plan permissions + 3 sample plans
  'seed:trainers',  // 5. xóa Trainers → trainer permissions + role trainer
  'seed:bookings',  // 6. xóa Bookings → booking permissions
  'seed:gym',       // 7. xóa GymInfo → gym permissions + default GymInfo
  'seed:equipment', // 8. xóa Equipment → equipment permissions + 5 sample items
  'seed:classes',   // 9. xóa Bookings+Classes → class permissions + 3 sample classes
  'seed:checkins',  // 10. xóa CheckinLogs → checkin permissions
  'seed:dashboard', // 11. dashboard:view permission
  'seed:staff-role',// 12. tạo role staff (lễ tân) — chạy CUỐI sau khi đủ permissions
];


console.log('🚀 Running all seeds in order...\n');
console.log('='.repeat(50));

let failed = [];

for (const script of seeds) {
  console.log(`\n▶ npm run ${script}`);
  console.log('-'.repeat(50));
  try {
    execSync(`npm run ${script}`, { stdio: 'inherit', cwd: __dirname + '/../..' });

    console.log(`✅ ${script} — OK`);
  } catch (err) {
    console.error(`❌ ${script} — FAILED`);
    failed.push(script);
  }
  console.log('='.repeat(50));
}

console.log('\n📊 Summary:');
if (failed.length === 0) {
  console.log('   All seeds completed successfully! 🎉');
} else {
  console.log(`   Failed: ${failed.join(', ')}`);
  process.exit(1);
}
