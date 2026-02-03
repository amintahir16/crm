// Pakistani currency formatting utilities

export const formatPKR = (amount: number): string => {
  if (amount === 0) return 'Rs 0';
  
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  let formatted = '';
  
  if (absAmount >= 10000000) { // 1 Crore or more
    const crores = absAmount / 10000000;
    formatted = `${crores.toFixed(crores >= 100 ? 0 : 1)} Cr`;
  } else if (absAmount >= 100000) { // 1 Lakh or more
    const lakhs = absAmount / 100000;
    formatted = `${lakhs.toFixed(lakhs >= 100 ? 0 : 1)} Lac`;
  } else if (absAmount >= 1000) { // 1 Thousand or more
    const thousands = absAmount / 1000;
    formatted = `${thousands.toFixed(thousands >= 100 ? 0 : 1)}K`;
  } else {
    formatted = absAmount.toLocaleString('en-PK');
  }
  
  return `${isNegative ? '-' : ''}Rs ${formatted}`;
};

export const formatPKRDetailed = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('PKR', 'Rs');
};

export const formatPKRCompact = (amount: number): string => {
  if (amount === 0) return 'Rs 0';
  
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  if (absAmount >= 10000000) { // 1 Crore
    return `${isNegative ? '-' : ''}Rs ${(absAmount / 10000000).toFixed(1)}Cr`;
  } else if (absAmount >= 100000) { // 1 Lakh
    return `${isNegative ? '-' : ''}Rs ${(absAmount / 100000).toFixed(1)}L`;
  } else if (absAmount >= 1000) { // 1 Thousand
    return `${isNegative ? '-' : ''}Rs ${(absAmount / 1000).toFixed(0)}K`;
  }
  
  return `${isNegative ? '-' : ''}Rs ${absAmount.toLocaleString('en-PK')}`;
};

export const parsePKR = (value: string): number => {
  // Remove currency symbols and convert back to number
  const cleanValue = value.replace(/[Rs,\s]/g, '');
  
  if (cleanValue.includes('Cr')) {
    return parseFloat(cleanValue.replace('Cr', '')) * 10000000;
  } else if (cleanValue.includes('L') || cleanValue.includes('Lac')) {
    return parseFloat(cleanValue.replace(/L|Lac/g, '')) * 100000;
  } else if (cleanValue.includes('K')) {
    return parseFloat(cleanValue.replace('K', '')) * 1000;
  }
  
  return parseFloat(cleanValue) || 0;
};

export const formatCNIC = (cnic: string): string => {
  // Remove all non-digits
  const digits = cnic.replace(/\D/g, '');
  
  // Format as 00000-0000000-0
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
};

export const formatPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle Pakistani phone number formatting
  if (digits.startsWith('92')) {
    return `+${digits}`;
  } else if (digits.startsWith('0')) {
    return digits.replace(/(\d{4})(\d{7})/, '$1-$2');
  } else if (digits.length === 10) {
    return `0${digits}`.replace(/(\d{4})(\d{7})/, '$1-$2');
  }
  
  return phone;
};
