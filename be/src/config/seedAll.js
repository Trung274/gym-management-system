/**
 * seed:all — runs all seed scripts in dependency order
 *
 * Order matters:
 *   1. roles       — creates Permission + Role + admin User (clears old data)
 *   2. staff       — adds staff:* permissions, creates manager role
 *   3. members     — adds member permissions, creates member role
 *   4. plans       — adds plan permissions, seeds 3 subscription plans
 *   5. trainers    — adds trainer permissions, creates trainer role (profile only — see 13)
 *   6. bookings    — adds booking permissions, assigns to member role
 *   7. gym         — adds gym permissions, seeds GymInfo document
 *   8. equipment   — adds equipment permissions, seeds 5 equipment items
 *   9. classes     — adds class permissions, seeds 3 classes
 *  10. checkins    — adds check-in permissions
 *  11. dashboard   — adds dashboard:view permission
 *  12. staff-role  — role staff (lễ tân): gom permissions từ nhiều domain
 *  13. trainer-role — quyền role trainer: dashboard, lịch PT của mình, lớp học, hội viên
 *
 *  NOTE: staff-role và trainer-role gom permissions từ nhiều domain nên phải chạy CUỐI.
 *        Cả hai idempotent — có thể chạy lại riêng bất kỳ lúc nào để reset quyền của role.
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
  'seed:classes',   // 9. xóa Classes → class permissions + 3 sample classes
  'seed:checkins',  // 10. xóa CheckinLogs → checkin permissions
  'seed:dashboard', // 11. dashboard:view permission
  'seed:staff-role',  // 12. role staff (lễ tân) — cần permissions của mọi domain
  'seed:trainer-role',// 13. quyền role trainer — cần permissions của mọi domain
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
