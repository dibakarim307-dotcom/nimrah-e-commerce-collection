import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  StoreSettings, 
  HeldCart, 
  OrderStatus,
  PosStaffUser,
  ShowcaseSlide
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  DEFAULT_STORE_SETTINGS,
  DEFAULT_SHOWCASE_SLIDES 
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
  posPortalIntent: 'owner' | 'admin';
  setPosPortalIntent: (intent: 'owner' | 'admin') => void;
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
  clearAllOrders: () => void;

  // Shop Owner Product Management Global Controls
  isOwnerProductModalOpen: boolean;
  setIsOwnerProductModalOpen: (open: boolean) => void;
  ownerModalInitialMode: 'add' | 'delete' | 'inventory';
  setOwnerModalInitialMode: (mode: 'add' | 'delete' | 'inventory') => void;
  productForDeletion: Product | null;
  setProductForDeletion: (product: Product | null) => void;
  openAddProductModal: () => void;
  openDeleteProductModal: (product?: Product | null) => void;
  isShopOwner: boolean;

  // Storefront Animation Showcase Display
  showcaseSlides: ShowcaseSlide[];
  updateShowcaseSlides: (slides: ShowcaseSlide[]) => Promise<boolean>;
  isOwnerShowcaseModalOpen: boolean;
  setIsOwnerShowcaseModalOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'nimrah_products_v1',
  DELETED_PRODUCTS: 'nimrah_deleted_products_v1',
  ORDERS: 'nimrah_orders_real_v2',
  SETTINGS: 'nimrah_settings_v1',
  ONLINE_CART: 'nimrah_online_cart_v1',
  POS_CART: 'nimrah_pos_cart_v1',
  HELD_CARTS: 'nimrah_held_carts_v1',
  POS_STAFF: 'nimrah_pos_staff_v1',
  SHOWCASE_SLIDES: 'nimrah_showcase_slides_v1'
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track permanently deleted products persisted in localStorage so sync never resurrects them
  const deletedProductIds = useRef<Set<string>>((() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_PRODUCTS);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  })());

  // Load products (strictly excluding any deleted items)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const deletedStored = localStorage.getItem(STORAGE_KEYS.DELETED_PRODUCTS);
      const deletedSet = deletedStored ? new Set<string>(JSON.parse(deletedStored)) : new Set<string>();
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const initial: Product[] = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
      return initial.filter(p => !deletedSet.has(p.id));
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load orders (pristine empty space strictly reserved for real incoming orders)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      // Clear any legacy mock order storage
      localStorage.removeItem('nimrah_orders_v1');
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) {
        const parsed: Order[] = JSON.parse(stored);
        // Exclude any dummy orders
        return parsed.filter(o => 
          o.customer?.name !== 'Amina Hassan' && 
          o.customer?.name !== 'Zainab Omar' &&
          o.id !== 'NC-2026-7841' &&
          o.id !== 'NC-2026-7840'
        );
      }
      return [];
    } catch {
      return [];
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

  // Storefront Animation Showcase Slides
  const [showcaseSlides, setShowcaseSlides] = useState<ShowcaseSlide[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHOWCASE_SLIDES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_SHOWCASE_SLIDES;
    } catch {
      return DEFAULT_SHOWCASE_SLIDES;
    }
  });
  const [isOwnerShowcaseModalOpen, setIsOwnerShowcaseModalOpen] = useState(false);

  const DEFAULT_SHOP_OWNER: PosStaffUser = {
    id: "staff-owner-001",
    name: "Diba Karim (Shop Owner)",
    email: "dibakarim307@gmail.com",
    role: "Shop Owner",
    branch: "Eastleigh Luxury Boutique G7",
    badgeNumber: "OWN-001"
  };

  // POS staff auth session
  const [posPortalIntent, setPosPortalIntent] = useState<'owner' | 'admin'>('owner');
  const [posStaffUser, setPosStaffUser] = useState<PosStaffUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POS_STAFF);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.POS_STAFF, JSON.stringify(DEFAULT_SHOP_OWNER));
      return DEFAULT_SHOP_OWNER;
    } catch {
      return DEFAULT_SHOP_OWNER;
    }
  });

  // Shop Owner Product Management Global Modal State
  const [isOwnerProductModalOpen, setIsOwnerProductModalOpen] = useState(false);
  const [ownerModalInitialMode, setOwnerModalInitialMode] = useState<'add' | 'delete' | 'inventory'>('add');
  const [productForDeletion, setProductForDeletion] = useState<Product | null>(null);

  const openAddProductModal = () => {
    setProductForDeletion(null);
    setOwnerModalInitialMode('add');
    setIsOwnerProductModalOpen(true);
  };

  const openDeleteProductModal = (product?: Product | null) => {
    if (product) {
      setProductForDeletion(product);
    }
    setOwnerModalInitialMode('delete');
    setIsOwnerProductModalOpen(true);
  };

  const isShopOwner = posStaffUser?.role === 'Shop Owner';

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

  // Synchronize live catalog with server & cross-tab broadcast channel
  // Authoritative server sync: deleted products never resurrect
  useEffect(() => {
    let isMounted = true;

    const fetchLiveProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && isMounted) {
            // Strictly exclude any locally or server marked deleted products
            const activeServerProducts = data.products.filter(
              (p: Product) => !deletedProductIds.current.has(p.id)
            );
            setProducts(activeServerProducts);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(activeServerProducts));
          }
        }
      } catch (err) {
        // Fallback to local storage if offline
      }
    };

    fetchLiveProducts();

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('nimrah_products_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_PRODUCTS' && Array.isArray(event.data?.products)) {
          const active = event.data.products.filter(
            (p: Product) => !deletedProductIds.current.has(p.id)
          );
          setProducts(active);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(active));
        }
      };
    }

    // Auto-refresh every 3.5s to catch new owner uploads across devices
    const interval = setInterval(fetchLiveProducts, 3500);

    const onFocus = () => fetchLiveProducts();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if (channel) channel.close();
    };
  }, []);

  // Fetch live showcase slides from server on mount
  useEffect(() => {
    fetch('/api/showcase')
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.slides) && data.slides.length > 0) {
          setShowcaseSlides(data.slides);
          localStorage.setItem(STORAGE_KEYS.SHOWCASE_SLIDES, JSON.stringify(data.slides));
        }
      })
      .catch(err => console.error('Error fetching showcase slides:', err));
  }, []);

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
          const newStock = Math.max(0, currentStock - cartItem.quantity);
          updated[prodIndex] = {
            ...updated[prodIndex],
            stock: newStock
          };

          // Synchronize stock deduction with server
          fetch(`/api/products/${cartItem.productId}/stock`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: newStock })
          }).catch(err => console.error('Failed to update stock after order:', err));
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
    const finalStock = Math.max(0, newStock);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: finalStock } : p));

    fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: finalStock })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('nimrah_products_channel');
            ch.postMessage({ type: 'SYNC_PRODUCTS', products: data.products });
            ch.close();
          }
        }
      })
      .catch(err => console.error('Failed to sync stock to server:', err));
  };

  const addProduct = (product: Omit<Product, 'id'>): Product => {
    if (!isShopOwner) {
      console.error('[SECURITY] Unauthorized: Only the Shop Owner is authorized to add products.');
      throw new Error('Unauthorized: Only Shop Owner can add products.');
    }

    const newId = `prod-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = { ...product, id: newId };
    
    // In case this ID was previously marked deleted, unmark it since the owner explicitly recreated it
    if (deletedProductIds.current.has(newId)) {
      deletedProductIds.current.delete(newId);
      try {
        localStorage.setItem(
          STORAGE_KEYS.DELETED_PRODUCTS,
          JSON.stringify(Array.from(deletedProductIds.current))
        );
      } catch {}
    }

    // Immediate optimistic local update so POS and UI respond instantly
    setProducts(prev => [newProduct, ...prev.filter(p => p.id !== newId)]);

    // Send to server with Shop Owner authorization headers
    const staffRole = posStaffUser?.role || 'Shop Owner';
    const staffEmail = posStaffUser?.email || 'dibakarim307@gmail.com';

    fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-staff-role': staffRole,
        'x-staff-email': staffEmail
      },
      body: JSON.stringify({
        product: newProduct,
        staffRole,
        staffEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          const filtered = data.products.filter((p: Product) => !deletedProductIds.current.has(p.id));
          setProducts(filtered);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('nimrah_products_channel');
            ch.postMessage({ type: 'SYNC_PRODUCTS', products: filtered });
            ch.close();
          }
        }
      })
      .catch(err => console.error('Failed to save uploaded product to server:', err));

    return newProduct;
  };

  const updateProduct = (updatedProduct: Product) => {
    if (!isShopOwner) {
      console.error('[SECURITY] Unauthorized: Only the Shop Owner is authorized to modify products.');
      return;
    }

    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

    const staffRole = posStaffUser?.role || 'Shop Owner';
    const staffEmail = posStaffUser?.email || 'dibakarim307@gmail.com';

    fetch(`/api/products/${updatedProduct.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-staff-role': staffRole,
        'x-staff-email': staffEmail
      },
      body: JSON.stringify({
        product: updatedProduct,
        staffRole,
        staffEmail
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('nimrah_products_channel');
            ch.postMessage({ type: 'SYNC_PRODUCTS', products: data.products });
            ch.close();
          }
        }
      })
      .catch(err => console.error('Failed to update product on server:', err));
  };

  const deleteProduct = (productId: string) => {
    if (!isShopOwner) {
      console.error('[SECURITY] Unauthorized: Only the Shop Owner is authorized to delete products.');
      return;
    }

    // Permanently record in memory and localStorage so it can NEVER resurrect
    deletedProductIds.current.add(productId);
    try {
      localStorage.setItem(
        STORAGE_KEYS.DELETED_PRODUCTS,
        JSON.stringify(Array.from(deletedProductIds.current))
      );
    } catch (e) {
      console.error('Failed to persist deletedProductIds', e);
    }

    // Immediately remove from current state
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== productId);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(remaining));
      return remaining;
    });

    const staffRole = posStaffUser?.role || 'Shop Owner';
    const staffEmail = posStaffUser?.email || 'dibakarim307@gmail.com';

    fetch(`/api/products/${productId}?staffRole=${encodeURIComponent(staffRole)}&staffEmail=${encodeURIComponent(staffEmail)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-role': staffRole,
        'x-staff-email': staffEmail
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          const filtered = data.products.filter((p: Product) => !deletedProductIds.current.has(p.id));
          setProducts(filtered);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('nimrah_products_channel');
            ch.postMessage({ type: 'SYNC_PRODUCTS', products: filtered });
            ch.close();
          }
        }
      })
      .catch(err => console.error('Failed to delete product on server:', err));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const openInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  const clearAllOrders = () => {
    setOrders([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem('nimrah_orders_v1');
    } catch {}
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
      posPortalIntent,
      setPosPortalIntent,
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
      openInvoice,
      clearAllOrders,
      isOwnerProductModalOpen,
      setIsOwnerProductModalOpen,
      ownerModalInitialMode,
      setOwnerModalInitialMode,
      productForDeletion,
      setProductForDeletion,
      openAddProductModal,
      openDeleteProductModal,
      isShopOwner,
      showcaseSlides,
      updateShowcaseSlides: async (slides: ShowcaseSlide[]): Promise<boolean> => {
        try {
          setShowcaseSlides(slides);
          localStorage.setItem(STORAGE_KEYS.SHOWCASE_SLIDES, JSON.stringify(slides));
          const res = await fetch('/api/showcase', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-staff-role': posStaffUser?.role || 'Shop Owner',
              'x-staff-email': posStaffUser?.email || 'dibakarim307@gmail.com'
            },
            body: JSON.stringify({ 
              slides,
              staffRole: posStaffUser?.role || 'Shop Owner',
              staffEmail: posStaffUser?.email || 'dibakarim307@gmail.com'
            })
          });
          const data = await res.json();
          return data?.success === true;
        } catch (err) {
          console.error('Failed to sync showcase slides to server:', err);
          return false;
        }
      },
      isOwnerShowcaseModalOpen,
      setIsOwnerShowcaseModalOpen
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
