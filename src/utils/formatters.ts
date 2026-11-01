export const formatCurrency = (amount: number, currency = 'KES'): string => {
  return `${currency} ${Math.round(amount).toLocaleString('en-KE')}`;
};

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const generateMpesaCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let code = '';
  // M-Pesa codes start with letters like Q, R, S, T, U etc.
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += digits.charAt(Math.floor(Math.random() * digits.length));
  code += digits.charAt(Math.floor(Math.random() * digits.length));
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  code += digits.charAt(Math.floor(Math.random() * digits.length));
  code += digits.charAt(Math.floor(Math.random() * digits.length));
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  return code;
};
