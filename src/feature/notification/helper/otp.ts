export const generateOtp = (length: number): number => {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    if (i === 0) {
      // First digit must not be 0 → pick from 1–9
      otp += digits.charAt(Math.floor(Math.random() * 9) + 1);
    } else {
      // Other digits can be 0–9
      otp += digits.charAt(Math.floor(Math.random() * 10));
    }
  }

  return Number(otp);
};
