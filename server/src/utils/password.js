import bcrypt from "bcryptjs";

const ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Used when the account does not exist, so response time doesn't reveal it.
let dummyHash;
export const verifyAgainstDummy = async (plain) => {
  dummyHash ??= await bcrypt.hash("timing-equalizer-password", ROUNDS);
  return bcrypt.compare(plain, dummyHash);
};
