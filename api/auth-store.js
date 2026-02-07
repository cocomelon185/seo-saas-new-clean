import { createRequire } from "module";

const require = createRequire(import.meta.url);
const store = require("./auth-store.cjs");

export const getAccountSettings = store.getAccountSettings;
export const updateRequireVerified = store.updateRequireVerified;
export const updateToolAccess = store.updateToolAccess;
export const updatePassword = store.updatePassword;
export const getTeamAdmin = store.getTeamAdmin;
export const setVerified = store.setVerified;
export const createUser = store.createUser;
export const getUserByEmail = store.getUserByEmail;
export const verifyUserPassword = store.verifyUserPassword;
export const acceptInvite = store.acceptInvite;

export default store;
