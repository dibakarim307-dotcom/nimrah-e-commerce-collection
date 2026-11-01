import { CartItem, Product, StoreSettings, Order } from '../types';
import { formatCurrency } from './formatters';

export const cleanPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.substring(1);
  }
  if (!digits.startsWith('254') && digits.length === 9) {
    return '254' + digits;
  }
  return digits;
};

export const buildWhatsAppOrderUrl = (
  items: CartItem[], 
  customer: { name?: string; phone?: string; address?: string; notes?: string },
  total: number,
  settings: StoreSettings
): string => {
  const number = cleanPhoneNumber(settings.whatsappNumber);
  
  let text = `Salam / Hello *${settings.storeName}* ✨\n\n`;
  text += `I would like to place an order from your collection:\n\n`;
  
  items.forEach((item, idx) => {
    text += `${idx + 1}. *${item.product.name}*\n`;
    text += `   • Size: ${item.selectedSize}\n`;
    text += `   • Color: ${item.selectedColor.name}\n`;
    text += `   • Qty: ${item.quantity} x ${formatCurrency(item.unitPrice, settings.currency)}\n`;
    text += `   • Line Total: ${formatCurrency(item.unitPrice * item.quantity, settings.currency)}\n\n`;
  });

  text += `--------------------------\n`;
  text += `*Order Total: ${formatCurrency(total, settings.currency)}*\n`;
  text += `*M-Pesa Till Number: ${settings.mpesaTillNumber}* (${settings.mpesaStoreName})\n\n`;

  if (customer.name) {
    text += `*Customer Details:*\n`;
    text += `• Name: ${customer.name}\n`;
    if (customer.phone) text += `• Phone: ${customer.phone}\n`;
    if (customer.address) text += `• Delivery Address: ${customer.address}\n`;
    if (customer.notes) text += `• Special Notes: ${customer.notes}\n`;
  }

  text += `\nPlease confirm availability and payment verification. Thank you!`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const buildWhatsAppInquiryUrl = (
  product: Product,
  settings: StoreSettings,
  selectedSize?: string,
  selectedColor?: string
): string => {
  const number = cleanPhoneNumber(settings.whatsappNumber);
  
  let text = `Salam / Hello *${settings.storeName}* Concierge ✨\n\n`;
  text += `I am inquiring about the following piece:\n`;
  text += `• *${product.name}*\n`;
  text += `• SKU: ${product.sku}\n`;
  text += `• Price: ${formatCurrency(product.price, settings.currency)}\n`;
  if (selectedSize) text += `• Size: ${selectedSize}\n`;
  if (selectedColor) text += `• Color: ${selectedColor}\n`;
  text += `\nCould you please assist me with sizing advice, fabric details, and availability at your Eastleigh Shop G7 boutique?`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const buildWhatsAppTrackUrl = (
  orderId: string,
  settings: StoreSettings
): string => {
  const number = cleanPhoneNumber(settings.whatsappNumber);
  const text = `Salam *${settings.storeName}*, I would like to track my order:\n\n*Order Reference: #${orderId}*\n\nPlease let me know the current status and estimated delivery time. Thank you!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const buildWhatsAppInvoiceShareUrl = (
  order: Order,
  settings: StoreSettings
): string => {
  const number = cleanPhoneNumber(settings.whatsappNumber);
  let text = `✨ *${settings.storeName} - Official Tax Invoice*\n\n`;
  text += `*Invoice Ref:* #${order.id}\n`;
  text += `*Customer:* ${order.customer.name}\n`;
  text += `*Amount Paid:* ${formatCurrency(order.total, settings.currency)}\n`;
  if (order.payment.mpesaDetails) {
    text += `*M-Pesa Till:* ${order.payment.mpesaDetails.tillNumber}\n`;
    text += `*M-Pesa Transaction Code:* ${order.payment.mpesaDetails.transactionCode}\n`;
  }
  text += `*Status:* Completed & Verified\n\n`;
  text += `*Items:*\n`;
  order.items.forEach(it => {
    text += `• ${it.quantity}x ${it.product.name} (${it.selectedSize}) - ${formatCurrency(it.unitPrice * it.quantity, settings.currency)}\n`;
  });
  text += `\nThank you for shopping with Nimrah Collection!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};
