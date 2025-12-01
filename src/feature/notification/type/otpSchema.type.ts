export type TOtp = {
  number: number;
  otp: number;
  isBlocked?: boolean;
  sendRetryCount?: number;
  verifyRetryCount?: number;
};
