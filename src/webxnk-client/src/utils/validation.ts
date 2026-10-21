export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const VIETNAM_PHONE_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const POSITIVE_INTEGER_REGEX = /^[1-9]\d*$/;

export const isValidEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim());
export const isValidVietnamPhone = (value: string): boolean => VIETNAM_PHONE_REGEX.test(value.trim());
export const isStrongPassword = (value: string): boolean => PASSWORD_REGEX.test(value);
export const isPositiveInteger = (value: string): boolean => POSITIVE_INTEGER_REGEX.test(value);

export const validateRegistration = (data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): string | null => {
  if (!data.fullName.trim()) return "Vui lòng nhập họ tên.";
  if (!isValidEmail(data.email)) return "Email không đúng định dạng.";
  if (!isValidVietnamPhone(data.phone)) return "Số điện thoại phải gồm 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.";
  if (!isStrongPassword(data.password)) return "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).";
  if (data.password !== data.confirmPassword) return "Mật khẩu nhập lại không khớp.";
  return null;
};

export const decodeJwtUserId = (token: string): string | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    const id = payload.sub ?? payload.userId ?? payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    return id === undefined || id === null || String(id).trim() === "" ? null : String(id);
  } catch {
    return null;
  }
};
