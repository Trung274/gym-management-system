const Member = require('../models/Member.model');

const EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/** True when the membership end date has passed (whatever the stored status says). */
const isMembershipExpired = (member) =>
  member.status === 'expired' || (member.endDate && member.endDate < new Date());

/** Moves active members whose endDate has passed to `expired`. Suspended members keep their status. */
const expireOverdueMembers = async () => {
  const { modifiedCount } = await Member.updateMany(
    { status: 'active', endDate: { $lt: new Date() } },
    { status: 'expired' }
  );
  if (modifiedCount > 0) {
    console.log(`Member expiry: ${modifiedCount} membership(s) marked as expired`);
  }
  return modifiedCount;
};

/**
 * Runs the expiry sweep now and then every hour. Running at startup matters on hosts
 * that sleep when idle (Render free tier), where the interval does not fire while asleep.
 */
const startMemberExpiryJob = () => {
  const run = () => expireOverdueMembers().catch(err =>
    console.error(`Member expiry job failed: ${err.message}`)
  );
  run();
  setInterval(run, EXPIRY_CHECK_INTERVAL_MS);
};

module.exports = { isMembershipExpired, expireOverdueMembers, startMemberExpiryJob };
