import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  StoreSettings, 
  HeldCart, 
  OrderStatus,
  PosStaffUser
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  DEFAULT_STORE_SETTINGS 
} from '../data/initialData';

interface StoreContextType {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onlineCart: CartItem[];
  posCart: CartItem[];
  heldCarts: HeldCart[];
  activeView: 'storefront' | 'pos' | 'inventory' | 'orders' | 'settings';
  setActiveView: (view: 'storefront' | 'pos' | 'inventory' | 'orders' | 'settings') => void;
  
  // UI states
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isOnlineCheckoutOpen: boolean;
  setIsOnlineCheckoutOpen: (open: boolean) => void;
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  selectedOrderForInvoice: Order | null;
  setSelectedOrderForInvoice: (order: Order | null) => void;
  isTrackingModalOpen: boolean;
  setIsTrackingModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  
  // Online Cart operations
  addToOnlineCart: (product: Product, size: string, color: Product['colors'][0], quantity?: number) => void;
  updateOnlineCartQty: (productId: string, size: string, colorName: string, quantity: number) => void;
  removeFromOnlineCart: (productId: string, size: string, colorName: string) => void;
  clearOnlineCart: () => void;
  getOnlineCartTotal: () => { subtotal: number; count: number };
  
  // POS operations & Authorized Staff
  posStaffUser: PosStaffUser | null;
  loginPosStaff: (user: PosStaffUser) => void;
  logoutPosStaff: () => void;
  posCashierName: string;
  setPosCashierName: (name: string) => void;
  posCustomerName: string;
  setPosCustomerName: (name: string) => void;
  posCustomerPhone: string;
  setPosCustomerPhone: (phone: string) => void;
  posDiscountPercent: number;
  setPosDiscountPercent: (pct: number) => void;
  addToPosCart: (product: Product, size?: string, color?: Product['colors'][0], quantity?: number) => void;
  updatePosCartItemQty: (index: number, quantity: number) => void;
  removeFromPosCart: (index: number) => void;
  clearPosCart: () => void;
  holdCurrentPosCart: (label: string) => void;
  recallPosCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;
  getPosCartTotals: () => { subtotal: number; discount: number; tax: number; total: number; count: number };
  
  // Order & Inventory operations
  createOrder: (orderPayload: Omit<Order, 'id' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateSettings: (newSettings: StoreSettings) => void;
  openInvoice: (order: Order) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'nimrah_products_v1',
  ORDERS: 'nimrah_orders_v1',
  SETTINGS: 'nimrah_settings_v1',
  ONLINE_CART: 'nimrah_online_cart_v1',
  POS_CART: 'nimrah_pos_cart_v1',
  HELD_CARTS: 'nimrah_held_carts_v1',
  POS_STAFF: 'nimrah_pos_staff_v1'
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return stored ? JSON.parse(stored) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Load settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_STORE_SETTINGS,
          ...parsed,
          brandLogoUrl: DEFAULT_STORE_SETTINGS.brandLogoUrl,
          whatsappNumber: DEFAULT_STORE_SETTINGS.whatsappNumber,
          storePhone: DEFAULT_STORE_SETTINGS.storePhone,
        };
      }
      return DEFAULT_STORE_SETTINGS;
    } catch {
      return DEFAULT_STORE_SETTINGS;
    }
  });

  // Online cart
  const [onlineCart, setOnlineCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ONLINE_CART);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // POS cart
  const [posCart, setPosCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POS_CART);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Held carts for POS
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HELD_CARTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Views & UI states
  const [activeView, setActiveView] = useState<'storefront' | 'pos' | 'inventory' | 'orders' | 'settings'>('storefront');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isOnlineCheckoutOpen, setIsOnlineCheckoutOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // POS staff auth session
  const [posStaffUser, setPosStaffUser] = useState<PosStaffUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POS_STAFF);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const loginPosStaff = (user: PosStaffUser) => {
    setPosStaffUser(user);
    setPosCashierName(`${user.name} (${user.badgeNumber})`);
    localStorage.setItem(STORAGE_KEYS.POS_STAFF, JSON.stringify(user));
  };

  const logoutPosStaff = () => {
    setPosStaffUser(null);
    localStorage.removeItem(STORAGE_KEYS.POS_STAFF);
  };

  // POS cashier details
  const [posCashierName, setPosCashierName] = useState(() => {
    if (posStaffUser) return `${posStaffUser.name} (${posStaffUser.badgeNumber})`;
    return 'Fatuma K. (Eastleigh G7)';
  });
  const [posCustomerName, setPosCustomerName] = useState('Walk-in Client');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posDiscountPercent, setPosDiscountPercent] = useState<number>(0);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONLINE_CART, JSON.stringify(onlineCart));
  }, [onlineCart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POS_CART, JSON.stringify(posCart));
  }, [posCart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HELD_CARTS, JSON.stringify(heldCarts));
  }, [heldCarts]);

  // Online Cart Methods
  const addToOnlineCart = (
    product: Product, 
    size: string, 
    color: Product['colors'][0], 
    quantity = 1
  ) => {
    setOnlineCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && 
                item.selectedSize === size && 
                item.selectedColor.name === color.name
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        // Check stock availability
        if (newQty <= product.stock) {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      } else {
        const itemQty = Math.min(quantity, Math.max(1, product.stock));
        return [...prev, {
          productId: product.id,
          product,
          selectedSize: size,
          selectedColor: color,
          quantity: itemQty,
          unitPrice: product.price
        }];
      }
    });
    setIsCartDrawerOpen(true);
  };

  const updateOnlineCartQty = (productId: string, size: string, colorName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOnlineCart(productId, size, colorName);
      return;
    }
    setOnlineCart(prev => prev.map(item => {
      if (item.productId === productId && item.selectedSize === size && item.selectedColor.name === colorName) {
        const stockLimit = item.product.stock;
        return { ...item, quantity: Math.min(quantity, stockLimit) };
      }
      return item;
    }));
  };

  const removeFromOnlineCart = (productId: string, size: string, colorName: string) => {
    setOnlineCart(prev => prev.filter(item => 
      !(item.productId === productId && item.selectedSize === size && item.selectedColor.name === colorName)
    ));
  };

  const clearOnlineCart = () => {
    setOnlineCart([]);
  };

  const getOnlineCartTotal = () => {
    const subtotal = onlineCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const count = onlineCart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, count };
  };

  // POS Cart Methods
  const addToPosCart = (
    product: Product, 
    size?: string, 
    color?: Product['colors'][0], 
    quantity = 1
  ) => {
    const chosenSize = size || (product.sizes.length > 0 ? product.sizes[0] : 'Standard');
    const chosenColor = color || (product.colors.length > 0 ? product.colors[0] : { name: 'Default', hex: '#000000' });

    setPosCart(prev => {
      const existingIdx = prev.findIndex(item => 
        item.productId === product.id && 
        item.selectedSize === chosenSize && 
        item.selectedColor.name === chosenColor.name
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        if (newQty <= product.stock) {
          updated[existingIdx].quantity = newQty;
        }
        return updated;
      } else {
        const qty = Math.min(quantity, Math.max(1, product.stock));
        return [...prev, {
          productId: product.id,
          product,
          selectedSize: chosenSize,
          selectedColor: chosenColor,
          quantity: qty,
          unitPrice: product.price
        }];
      }
    });
  };

  const updatePosCartItemQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromPosCart(index);
      return;
    }
    setPosCart(prev => {
      const updated = [...prev];
      if (updated[index]) {
        const maxStock = updated[index].product.stock;
        updated[index] = { ...updated[index], quantity: Math.min(quantity, maxStock) };
      }
      return updated;
    });
  };

  const removeFromPosCart = (index: number) => {
    setPosCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearPosCart = () => {
    setPosCart([]);
    setPosDiscountPercent(0);
  };

  const holdCurrentPosCart = (label: string) => {
    if (posCart.length === 0) return;
    const newHeld: HeldCart = {
      id: `HELD-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: label.trim() || `Ticket #${heldCarts.length + 1}`,
      items: [...posCart],
      customerName: posCustomerName || 'Walk-in Client'
    };
    setHeldCarts(prev => [newHeld, ...prev]);
    clearPosCart();
  };

  const recallPosCart = (id: string) => {
    const target = heldCarts.find(h => h.id === id);
    if (!target) return;
    setPosCart(target.items);
    if (target.customerName) setPosCustomerName(target.customerName);
    setHeldCarts(prev => prev.filter(h => h.id !== id));
  };

  const deleteHeldCart = (id: string) => {
    setHeldCarts(prev => prev.filter(h => h.id !== id));
  };

  const getPosCartTotals = () => {
    const subtotal = posCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discount = (subtotal * posDiscountPercent) / 100;
    const netAmount = Math.max(0, subtotal - discount);
    // 16% VAT calculation (VAT inclusive)
    const tax = netAmount - (netAmount / (1 + settings.vatRate));
    const total = netAmount;
    const count = posCart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, discount, tax, total, count };
  };

  // Order Creation & Live Inventory Deduction
  const createOrder = (orderPayload: Omit<Order, 'id' | 'createdAt'>): Order => {
    const orderNumber = `NC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      ...orderPayload,
      id: orderNumber,
      createdAt: new Date().toISOString()
    };

    // Deduct stock in real-time from inventory for each item
    setProducts(currentProducts => {
      const updated = [...currentProducts];
      orderPayload.items.forEach(cartItem => {
        const prodIndex = updated.findIndex(p => p.id === cartItem.productId);
        if (prodIndex > -1) {
          const currentStock = updated[prodIndex].stock;
          updated[prodIndex] = {
            ...updated[prodIndex],
            stock: Math.max(0, currentStock - cartItem.quantity)
          };
        }
      });
      return updated;
    });

    // Save order
    setOrders(prev => [newOrder, ...prev]);

    // Set as active order for invoice modal and show it!
    setSelectedOrderForInvoice(newOrder);
    setIsInvoiceModalOpen(true);

    // Clear respective cart
    if (orderPayload.source === 'pos') {
      clearPosCart();
      setPosCustomerName('Walk-in Client');
      setPosCustomerPhone('');
    } else {
      clearOnlineCart();
      setIsOnlineCheckoutOpen(false);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrderForInvoice?.id === orderId) {
      setSelectedOrderForInvoice(prev => prev ? { ...prev, status } : null);
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p));
  };

  const addProduct = (product: Omit<Product, 'id'>): Product => {
    const newId = `prod-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = { ...product, id: newId };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const openInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  return (
    <StoreContext.Provider value={{
      products,
      orders,
      settings,
      onlineCart,
      posCart,
      heldCarts,
      activeView,
      setActiveView,
      selectedProductForModal,
      setSelectedProductForModal,
      isCartDrawerOpen,
      setIsCartDrawerOpen,
      isOnlineCheckoutOpen,
      setIsOnlineCheckoutOpen,
      isInvoiceModalOpen,
      setIsInvoiceModalOpen,
      selectedOrderForInvoice,
      setSelectedOrderForInvoice,
      isTrackingModalOpen,
      setIsTrackingModalOpen,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      isAiAssistantOpen,
      setIsAiAssistantOpen,
      addToOnlineCart,
      updateOnlineCartQty,
      removeFromOnlineCart,
      clearOnlineCart,
      getOnlineCartTotal,
      posStaffUser,
      loginPosStaff,
      logoutPosStaff,
      posCashierName,
      setPosCashierName,
      posCustomerName,
      setPosCustomerName,
      posCustomerPhone,
      setPosCustomerPhone,
      posDiscountPercent,
      setPosDiscountPercent,
      addToPosCart,
      updatePosCartItemQty,
      removeFromPosCart,
      clearPosCart,
      holdCurrentPosCart,
      recallPosCart,
      deleteHeldCart,
      getPosCartTotals,
      createOrder,
      updateOrderStatus,
      updateProductStock,
      addProduct,
      updateProduct,
      deleteProduct,
      updateSettings,
      openInvoice
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
