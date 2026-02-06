import { createRequire } from "module";

const require = createRequire(import.meta.url);
const svc = require("./emailService.cjs");

export const sendWelcomeEmail = svc.sendWelcomeEmail || (async () => ({ success: false }));
export const sendUsageWarning = svc.sendUsageWarning || (async () => ({ success: false }));
export const sendUsageLimitReached = svc.sendUsageLimitReached || (async () => ({ success: false }));
export const sendReferralNotification = svc.sendReferralNotification || (async () => ({ success: false }));
export const sendLeadNotification = svc.sendLeadNotification || (async () => ({ success: false }));
export const sendWeeklyDelta = svc.sendWeeklyDelta || (async () => ({ success: false }));
export const sendVerifyEmail = svc.sendVerifyEmail || (async () => ({ success: false }));
export const sendResetEmail = svc.sendResetEmail || (async () => ({ success: false }));
export const sendTeamInviteEmail = svc.sendTeamInviteEmail || (async () => ({ success: false }));
export const sendUpgradeRequest = svc.sendUpgradeRequest || (async () => ({ success: false }));

export default svc;
