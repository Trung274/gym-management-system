/**
 * seed:all — runs all seed scripts in dependency order
 *
 * Order matters:
 *   1. roles       — creates Permission + Role + admin User (clears old data)
 *   2. staff       — adds staff permissions, creates manager role
 *   3. members     — adds member permissions, creates member role
 *   4. plans       — adds plan permissions, seeds 3 subscription plans
 *   5. trainers    — adds trainer permissions, creates trainer role
 *   6. bookings    — adds booking permissions, assigns to member role
 *   7. gym         — adds gym permissions, seeds GymInfo document
 *   8. equipment   — adds equipment permissions, seeds 5 equipment items
 *   9. classes     — adds class permissions, seeds 3 classes
 *  10. checkins    — adds check-in permissions
 */

require('dotenv').config();
const { execSync } = require('child_process');

const seeds = [
  'seed:roles',
  'seed:staff',
  'seed:members',
  'seed:plans',
  'seed:trainers',
  'seed:bookings',
  'seed:gym',
  'seed:equipment',
  'seed:classes',
  'seed:checkins',
];

console.log('🚀 Running all seeds in order...\n');
console.log('='.repeat(50));

let failed = [];

for (const script of seeds) {
  console.log(`\n▶ npm run ${script}`);
  console.log('-'.repeat(50));
  try {
    execSync(`npm run ${script}`, { stdio: 'inherit', cwd: __dirname + '/../../..' });
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
