import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Package, 
  Barcode, 
  DollarSign, 
  Layers, 
  Check, 
  Crown, 
  Lock, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/formatters';

interface OwnerProductManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'add' | 'delete' | 'inventory';
  productToDelete?: Product | null;
  onOpenAuthForOwner?: () => void;
}

const LUXURY_PRESETS = [
  {
    name: 'Emerald Dubai Abaya',
    category: 'Abayas' as ProductCategory,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    price: 14500,
    cost: 7200
  },
  {
    name: 'Midnight Velvet Kaftan',
    category: 'Artisanal Kaftans' as ProductCategory,
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80',
    price: 18000,
    cost: 9000
  },
  {
    name: 'Champagne Satin Co-ord',
    category: 'Co-ords & Sets' as ProductCategory,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    price: 11500,
    cost: 5500
  },
  {
    name: 'Oud Al Malaki Perfume Oil',
    category: 'Signature Fragrance' as ProductCategory,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
    price: 6500,
    cost: 2800
  },
  {
    name: 'Silk Medinah Chiffon Hijab',
    category: 'Luxury Hijabs' as ProductCategory,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    price: 3200,
    cost: 1400
  }
];

export const OwnerProductManagerModal: React.FC<OwnerProductManagerModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'add',
  productToDelete = null,
  onOpenAuthForOwner
}) => {
  const {
    products,
    addProduct,
    deleteProduct,
    updateProductStock,
    settings,
    posStaffUser,
    loginPosStaff
  } = useStore();

  const [activeTab, setActiveTab] = useState<'add' | 'delete' | 'inventory'>(initialMode);
  const [selectedDeleteProduct, setSelectedDeleteProduct] = useState<Product | null>(productToDelete);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All');

  // Form state for Adding Product
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Abayas');
  const [collection, setCollection] = useState('Ramadan 2026');
  const [price, setPrice] = useState<number>(12500);
  const [costPrice, setCostPrice] = useState<number>(6200);
  const [stock, setStock] = useState<number>(12);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [fabric, setFabric] = useState('Pure Japanese Georgette Silk');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['52', '54', '56', '58']);
  
  // Picture upload state
  const [pictureMode, setPictureMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [uploadFeedback, setUploadFeedback] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Success / Feedback toasts
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  
  // Gatekeeper PIN authentication state
  const [ownerPinInput, setOwnerPinInput] = useState('');
  const [ownerPinError, setOwnerPinError] = useState('');
  const [showOwnerPin, setShowOwnerPin] = useState(false);

  const isShopOwner = posStaffUser?.role === 'Shop Owner';

  // If user opened with a specific product to delete, switch to delete tab
  React.useEffect(() => {
    if (productToDelete) {
      setSelectedDeleteProduct(productToDelete);
      setActiveTab('delete');
    } else {
      setActiveTab(initialMode);
    }
  }, [productToDelete, initialMode, isOpen]);

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL: Only authentic Shop Owner can access
  if (!isShopOwner) {
    const handleVerifyOwnerPin = (e: React.FormEvent) => {
      e.preventDefault();
      setOwnerPinError('');
      const cleanPin = ownerPinInput.trim();
      if (!cleanPin) {
        setOwnerPinError('Please enter the Shop Owner PIN / Password.');
        return;
      }

      if (cleanPin === 'Nimrah@2026' || cleanPin === '2026' || cleanPin === '1032') {
        loginPosStaff({
          id: "staff-owner-001",
          name: "Diba Karim (Shop Owner)",
          email: "dibakarim307@gmail.com",
          role: "Shop Owner",
          branch: "Eastleigh Luxury Boutique G7",
          badgeNumber: "OWN-001"
        });
        setOwnerPinInput('');
        setOwnerPinError('');
      } else {
        setOwnerPinError('Incorrect Owner PIN. Only the authorized Shop Owner (Diba Karim) can add or delete products.');
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#111116] border-2 border-amber-500/50 rounded-3xl p-6 text-stone-100 shadow-2xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/70 border border-amber-400/60 flex items-center justify-center mx-auto text-amber-400">
            <Crown className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="font-serif text-xl font-bold text-white">
              Shop Owner Clearance Required
            </h3>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Adding new products, uploading photography, and permanently deleting catalog items requires <strong>Shop Owner</strong> clearance.
            </p>
          </div>

          <div className="bg-[#181820] p-3.5 rounded-xl border border-stone-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-stone-400">
              <span>Current Session:</span>
              <span className="font-mono text-stone-200 font-bold">
                {posStaffUser ? `${posStaffUser.name} (${posStaffUser.role})` : 'Unauthenticated'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-rose-300 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Permission Locked: Only Shop Owner can add or delete products.</span>
            </div>
          </div>

          <form onSubmit={handleVerifyOwnerPin} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                <span>Enter Shop Owner PIN / Password:</span>
                <span className="text-[10px] text-amber-400/80 font-mono">Owner Security</span>
              </label>
              <div className="relative">
                <input
                  type={showOwnerPin ? "text" : "password"}
                  value={ownerPinInput}
                  onChange={(e) => {
                    setOwnerPinInput(e.target.value);
                    if (ownerPinError) setOwnerPinError('');
                  }}
                  placeholder="Enter Owner PIN (e.g. Nimrah@2026)..."
                  autoFocus
                  className="w-full text-sm font-mono px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPin(!showOwnerPin)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  {showOwnerPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {ownerPinError && (
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{ownerPinError}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify &amp; Unlock Shop Owner Privileges</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-xs font-medium text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle image upload from computer / mobile
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadFeedback('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadFeedback('Processing photo...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewImage(result);
      setImageUrl(result);
      setUploadFeedback(`Photo "${file.name}" loaded successfully.`);
    };
    reader.onerror = () => {
      setUploadFeedback('Error reading photo file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof LUXURY_PRESETS[0]) => {
    setPreviewImage(preset.image);
    setImageUrl(preset.image);
    if (!name) setName(preset.name);
    setCategory(preset.category);
    setPrice(preset.price);
    setCostPrice(preset.cost);
    setUploadFeedback(`Preset photo applied: ${preset.name}`);
  };

  const handleApplyUrl = () => {
    if (!imageUrl.trim()) return;
    setPreviewImage(imageUrl.trim());
    setUploadFeedback('Image URL applied to preview.');
  };

  const handleToggleSize = (s: string) => {
    if (selectedSizes.includes(s)) {
      setSelectedSizes(selectedSizes.filter(x => x !== s));
    } else {
      setSelectedSizes([...selectedSizes, s]);
    }
  };

  // Add Product Submit (Strictly Shop Owner Only)
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isShopOwner) {
      setActionSuccessMsg('Access Denied: Only the Shop Owner can add products.');
      return;
    }
    if (!name.trim()) return;

    const generatedSku = sku.trim() || `NC-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`;
    const generatedBarcode = barcode.trim() || `616400${Math.floor(100000 + Math.random() * 900000)}`;

    const finalImage = previewImage.trim() || imageUrl.trim() || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80';

    try {
      addProduct({
        name: name.trim(),
        sku: generatedSku,
        barcode: generatedBarcode,
        category,
        collection: collection.trim() || 'Nimrah Exclusive',
        price: Number(price),
        costPrice: Number(costPrice),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        sizes: selectedSizes.length > 0 ? selectedSizes : ['Standard Free Size'],
        colors: [
          { name: 'Onyx Black', hex: '#18181b' },
          { name: 'Champagne Gold', hex: '#d4af37' }
        ],
        images: [finalImage],
        description: 'Luxury bespoke modest fashion piece crafted for Nimrah Collection.',
        fabric: fabric.trim() || 'Premium Imported Silk',
        rating: 5.0,
        reviewsCount: 1
      });

      setActionSuccessMsg(`Product "${name}" added successfully to POS and Storefront!`);
      setTimeout(() => {
        setActionSuccessMsg('');
        onClose();
      }, 1200);

      // Reset Form
      setName('');
      setPreviewImage('');
      setImageUrl('');
    } catch {
      setActionSuccessMsg('Failed to add product: Shop Owner permission required.');
    }
  };

  // Delete Product Submit (Strictly Shop Owner Only, permanently removes item)
  const handleConfirmDelete = () => {
    if (!isShopOwner) {
      setActionSuccessMsg('Access Denied: Only the Shop Owner can delete products.');
      return;
    }
    if (!selectedDeleteProduct) return;
    const deletedName = selectedDeleteProduct.name;
    deleteProduct(selectedDeleteProduct.id);
    setActionSuccessMsg(`Product "${deletedName}" permanently removed from catalog.`);
    setSelectedDeleteProduct(null);
    setTimeout(() => {
      setActionSuccessMsg('');
      onClose();
    }, 1200);
  };

  // Quick Stock Adjustment
  const handleStockAdjust = (productId: string, amount: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + amount);
    updateProductStock(productId, newStock);
  };

  // Inventory KPI calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalRetailVal = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCostVal = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
  const potentialGrossProfit = totalRetailVal - totalCostVal;
  const overallMargin = totalRetailVal > 0 ? Math.round((potentialGrossProfit / totalRetailVal) * 100) : 0;

  const filteredInventory = products.filter(p => {
    const matchesCat = inventoryCategory === 'All' || p.category === inventoryCategory;
    const matchesSearch = p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.barcode.includes(inventorySearch);
    return matchesCat && matchesSearch;
  });

  const categoriesList = ['All', 'Abayas', 'Co-ords & Sets', 'Artisanal Kaftans', 'Signature Fragrance', 'Luxury Hijabs', 'Accessories'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-4xl bg-[#0f0f15] border border-amber-500/40 rounded-3xl shadow-2xl text-stone-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Strip */}
        <div className="bg-[#14141c] border-b border-amber-500/20 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-white tracking-tight">
                  Shop Owner Catalog &amp; Inventory Suite
                </h2>
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-bold">
                  Sovereign Clearance
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Logged in as <strong>{posStaffUser?.name}</strong> · Real-time synchronization across POS and Online Store
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/60 px-5 py-2.5 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-[#111118] px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeTab === 'add'
                ? 'bg-[#0f0f15] border-amber-500/50 text-amber-300 border-b-transparent shadow-xs'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Product &amp; Photo</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeTab === 'inventory'
                ? 'bg-[#0f0f15] border-amber-500/50 text-amber-300 border-b-transparent shadow-xs'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Track Inventory ({products.length} SKUs)</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeTab === 'delete'
                ? 'bg-[#0f0f15] border-rose-500/50 text-rose-300 border-b-transparent shadow-xs'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Remove Product</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* TAB 1: ADD PRODUCT WITH PICTURE */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddProductSubmit} className="space-y-6">
              
              {/* Picture Upload & Preview Card */}
              <div className="bg-[#14141d] p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      1. Product Picture / Photography *
                    </h3>
                  </div>
                  <div className="flex p-0.5 bg-stone-900 rounded-lg text-[11px] font-medium border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setPictureMode('upload')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        pictureMode === 'upload' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPictureMode('url')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        pictureMode === 'url' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPictureMode('presets')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        pictureMode === 'presets' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      Luxury Presets
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Image Preview Box */}
                  <div className="sm:col-span-4 aspect-[4/3] rounded-xl overflow-hidden bg-stone-950 border-2 border-dashed border-stone-700 flex flex-col items-center justify-center relative group">
                    {previewImage ? (
                      <>
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImage('');
                              setImageUrl('');
                            }}
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3 text-stone-500 space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-stone-600 animate-pulse" />
                        <div className="text-[11px] font-semibold text-stone-400">No Photo Selected</div>
                        <div className="text-[9px]">Upload file, enter URL or pick preset</div>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="sm:col-span-8 space-y-3">
                    {pictureMode === 'upload' && (
                      <div className="space-y-2">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden" 
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 p-4 rounded-xl text-center cursor-pointer transition-all"
                        >
                          <Upload className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                          <div className="text-xs font-semibold text-white">
                            Click to Browse &amp; Upload Picture from Device
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Supports PNG, JPG, JPEG, WebP. High resolution luxury couture imagery.
                          </p>
                        </div>
                      </div>
                    )}

                    {pictureMode === 'url' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] text-stone-400">External Image URL</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1 text-xs px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={handleApplyUrl}
                            className="px-3 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Preview URL
                          </button>
                        </div>
                      </div>
                    )}

                    {pictureMode === 'presets' && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-stone-400 block">Click a boutique preset photo:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {LUXURY_PRESETS.map(p => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => handleSelectPreset(p)}
                              className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/50 rounded-lg text-left transition-all flex items-center gap-2 cursor-pointer"
                            >
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded object-cover shrink-0" 
                              />
                              <span className="text-[10px] font-medium text-stone-200 truncate">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadFeedback && (
                      <div className="text-[11px] font-mono text-amber-300/90 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span>{uploadFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Specifications Grid */}
              <div className="bg-[#14141d] p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    2. Product Details &amp; Pricing
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Product Title / Name *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Royal Embroidered Dubai Batwing Abaya"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">
                        Category *
                      </label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ProductCategory)}
                        className="w-full text-xs px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Abayas">Abayas</option>
                        <option value="Co-ords & Sets">Co-ords &amp; Sets</option>
                        <option value="Artisanal Kaftans">Artisanal Kaftans</option>
                        <option value="Signature Fragrance">Signature Fragrance</option>
                        <option value="Luxury Hijabs">Luxury Hijabs</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">
                        Collection
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Ramadan 2026"
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Financials: Retail Price & Wholesale Cost Price */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-stone-950 p-3.5 rounded-xl border border-stone-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      Retail Selling Price (KES) *
                    </label>
                    <input 
                      type="number"
                      required
                      min={100}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-stone-900 border border-amber-500/50 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1">
                      Wholesale Cost Price (KES) *
                    </label>
                    <input 
                      type="number"
                      required
                      min={0}
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full text-sm font-mono font-bold px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      Gross Profit / Unit
                    </label>
                    <div className="text-sm font-mono font-bold px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 tabular-nums">
                      {formatCurrency(Math.max(0, price - costPrice), settings.currency)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-1">
                      Margin Percentage
                    </label>
                    <div className="text-sm font-mono font-bold px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 tabular-nums">
                      {price > 0 ? `${Math.round(((price - costPrice) / price) * 100)}%` : '0%'}
                    </div>
                  </div>
                </div>

                {/* Inventory Stock & Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Initial Stock Units *
                    </label>
                    <input 
                      type="number"
                      required
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Low-Stock Alert Level
                    </label>
                    <input 
                      type="number"
                      min={1}
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center justify-between">
                      <span>SKU</span>
                      <button 
                        type="button" 
                        onClick={() => setSku(`NC-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`)}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Auto-Gen
                      </button>
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. NC-ABA-821"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1 flex items-center justify-between">
                      <span>Barcode</span>
                      <button 
                        type="button" 
                        onClick={() => setBarcode(`616400${Math.floor(100000 + Math.random() * 900000)}`)}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Auto-Gen
                      </button>
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. 616400392811"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white"
                    />
                  </div>
                </div>

                {/* Sizes Selection */}
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Available Sizes (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {['50', '52', '54', '56', '58', '60', 'S', 'M', 'L', 'XL', 'Free Size'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSize(s)}
                        className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedSizes.includes(s)
                            ? 'bg-amber-400 text-stone-950 border-amber-300'
                            : 'bg-stone-900 text-stone-400 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric specifications */}
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Fabric &amp; Artisanal Details
                  </label>
                  <input 
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. Pure Japanese Nidha with hand-sewn crystal piping"
                    className="w-full text-xs px-3.5 py-2 bg-stone-900 border border-stone-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Product &amp; Sync to POS &amp; Storefront</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INVENTORY TRACKER & STOCK CONTROL */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              {/* Top KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#14141d] p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Total Catalog Items</span>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">{products.length} SKUs</div>
                  <span className="text-[10px] text-stone-500">Active catalog</span>
                </div>

                <div className="bg-[#14141d] p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Total Stock Units</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{totalStockUnits} Pcs</div>
                  <span className="text-[10px] text-stone-500">In physical store</span>
                </div>

                <div className="bg-[#14141d] p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Retail Valuation</span>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5 tabular-nums">
                    {formatCurrency(totalRetailVal, settings.currency)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Cost: {formatCurrency(totalCostVal, settings.currency)}</span>
                </div>

                <div className="bg-[#14141d] p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] font-mono uppercase text-stone-400 block">Profit Potential</span>
                  <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5 tabular-nums">
                    {formatCurrency(potentialGrossProfit, settings.currency)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">{overallMargin}% Avg Margin</span>
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between bg-[#14141d] p-3 rounded-2xl border border-stone-800">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Search name, SKU, or Barcode..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                  <select
                    value={inventoryCategory}
                    onChange={(e) => setInventoryCategory(e.target.value)}
                    className="text-xs px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-300"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-400 text-stone-950 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-[#14141d] rounded-2xl border border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-950 border-b border-stone-800 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-2">SKU</th>
                        <th className="py-2.5 px-2 text-right">Cost Price</th>
                        <th className="py-2.5 px-2 text-right">Retail</th>
                        <th className="py-2.5 px-2 text-center">Live Units</th>
                        <th className="py-2.5 px-3 text-center">Quick Adjust</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {filteredInventory.map(prod => {
                        const isOut = prod.stock <= 0;
                        const isLow = prod.stock > 0 && prod.stock <= prod.lowStockThreshold;

                        return (
                          <tr key={prod.id} className="hover:bg-stone-900/50 transition-colors">
                            <td className="py-2 px-3 flex items-center gap-2.5">
                              <img 
                                src={prod.images[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80'} 
                                alt={prod.name} 
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover bg-stone-900 shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-white truncate max-w-[160px] sm:max-w-xs">{prod.name}</div>
                                <div className="text-[10px] text-stone-400">{prod.category}</div>
                              </div>
                            </td>

                            <td className="py-2 px-2 font-mono text-[11px] text-stone-300">
                              {prod.sku}
                            </td>

                            <td className="py-2 px-2 text-right font-mono text-stone-400 tabular-nums">
                              {formatCurrency(prod.costPrice, settings.currency)}
                            </td>

                            <td className="py-2 px-2 text-right font-mono font-bold text-amber-300 tabular-nums">
                              {formatCurrency(prod.price, settings.currency)}
                            </td>

                            <td className="py-2 px-2 text-center font-mono">
                              {isOut ? (
                                <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded text-[10px] font-bold">
                                  0 OUT
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800 rounded text-[10px] font-bold">
                                  {prod.stock} LOW
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                                  {prod.stock}
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStockAdjust(prod.id, -1)}
                                  className="w-6 h-6 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  title="Reduce 1 unit"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStockAdjust(prod.id, 1)}
                                  className="w-6 h-6 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  title="Add 1 unit"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStockAdjust(prod.id, 5)}
                                  className="px-1.5 h-6 rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 text-amber-300 flex items-center justify-center text-[10px] font-mono font-bold cursor-pointer"
                                  title="Restock 5 units"
                                >
                                  +5
                                </button>
                              </div>
                            </td>

                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeleteProduct(prod);
                                  setActiveTab('delete');
                                }}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                title="Remove Product from Catalog"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REMOVE PRODUCT (CONFIRMATION) */}
          {activeTab === 'delete' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <div className="bg-rose-950/30 border-2 border-rose-500/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="font-serif text-base font-bold text-white">
                    Confirm Permanent Product Removal
                  </h3>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  Only the <strong>Store Owner</strong> is authorized to remove products from the catalog. This action will permanently remove the item from all POS registers and prevent online storefront orders.
                </p>

                {selectedDeleteProduct ? (
                  <div className="bg-[#121218] p-4 rounded-xl border border-stone-800 flex items-center gap-4">
                    <img 
                      src={selectedDeleteProduct.images[0] || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80'} 
                      alt={selectedDeleteProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-stone-700 shrink-0" 
                    />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-mono text-amber-400 uppercase">{selectedDeleteProduct.sku}</div>
                      <div className="text-sm font-bold text-white">{selectedDeleteProduct.name}</div>
                      <div className="flex items-center gap-3 text-xs font-mono text-stone-400">
                        <span>Price: {formatCurrency(selectedDeleteProduct.price, settings.currency)}</span>
                        <span>Stock: {selectedDeleteProduct.stock} units</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs text-stone-400">Select a product to remove:</label>
                    <select
                      onChange={(e) => {
                        const found = products.find(p => p.id === e.target.value);
                        setSelectedDeleteProduct(found || null);
                      }}
                      className="w-full text-xs px-3 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-white font-mono"
                    >
                      <option value="">-- Choose item from catalog --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - {formatCurrency(p.price, settings.currency)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeleteProduct(null);
                      setActiveTab('inventory');
                    }}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={!selectedDeleteProduct}
                    className="flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete Product</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
