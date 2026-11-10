import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  Crown, 
  Sparkles, 
  Image as ImageIcon,
  Check, 
  RotateCcw,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShowcaseSlide } from '../types';
import { DEFAULT_SHOWCASE_SLIDES } from '../data/initialData';

export const OwnerShowcaseManagerModal: React.FC = () => {
  const { 
    showcaseSlides, 
    updateShowcaseSlides, 
    isOwnerShowcaseModalOpen, 
    setIsOwnerShowcaseModalOpen,
    products,
    isShopOwner
  } = useStore();

  const [slides, setSlides] = useState<ShowcaseSlide[]>(showcaseSlides);
  const [activeTab, setActiveTab] = useState<'slides' | 'add' | 'catalog'>('slides');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New slide form state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('Atelier Showcase');
  const [previewError, setPreviewError] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOwnerShowcaseModalOpen) {
      setSlides(showcaseSlides);
      setSavedNotice(false);
    }
  }, [isOwnerShowcaseModalOpen, showcaseSlides]);

  if (!isOwnerShowcaseModalOpen || !isShopOwner) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewImageUrl(result);
      setPreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      alert('Please provide an image URL or upload a picture.');
      return;
    }

    const newSlide: ShowcaseSlide = {
      id: `slide-${Date.now()}`,
      imageUrl: newImageUrl.trim(),
      title: newTitle.trim() || 'Nimrah Collection Craftsmanship',
      subtitle: newSubtitle.trim() || 'Curated luxury modesty and artisanal haute parfumerie.',
      badge: newBadge.trim() || 'Atelier Heritage',
      createdAt: new Date().toISOString()
    };

    setSlides([...slides, newSlide]);
    setNewImageUrl('');
    setNewTitle('');
    setNewSubtitle('');
    setNewBadge('Atelier Showcase');
    setActiveTab('slides');
  };

  const handleAddFromProduct = (product: typeof products[0], imgUrl: string) => {
    const newSlide: ShowcaseSlide = {
      id: `slide-prod-${product.id}-${Date.now().toString().slice(-4)}`,
      imageUrl: imgUrl,
      title: product.name,
      subtitle: `${product.fabric} · Available at Shop G7 Eastleigh & Online KES ${product.price.toLocaleString()}`,
      badge: `${product.category} · ${product.collection || 'Collection'}`,
      createdAt: new Date().toISOString()
    };

    setSlides([...slides, newSlide]);
    setActiveTab('slides');
  };

  const handleUpdateSlideField = (index: number, field: keyof ShowcaseSlide, value: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...slides];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSlides(updated);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert('You must keep at least 1 picture in the showcase animation display.');
      return;
    }
    setSlides(slides.filter((_, idx) => idx !== index));
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset animation pictures back to default Atelier showcase photos?')) {
      setSlides(DEFAULT_SHOWCASE_SLIDES);
    }
  };

  const handleSave = async () => {
    if (slides.length === 0) {
      alert('Please have at least 1 slide.');
      return;
    }

    setIsSaving(true);
    const success = await updateShowcaseSlides(slides);
    setIsSaving(false);

    if (success) {
      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
        setIsOwnerShowcaseModalOpen(false);
      }, 900);
    } else {
      alert('Failed to save showcase pictures. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#101016] text-stone-100 rounded-3xl border border-amber-500/40 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-stone-950 via-[#15151f] to-amber-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-950/40">
              <Crown className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-amber-100">
                  Storefront Animation Display Manager
                </h3>
                <span className="text-[10px] font-mono uppercase bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded">
                  Shop Owner
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Put custom pictures and text for the rotating animation display on your storefront
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOwnerShowcaseModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-[#0d0d12] px-6 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'slides'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Active Display Pictures ({slides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Upload / Add New Picture</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Pick from Store Catalog</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ACTIVE SLIDES LIST */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <span>The pictures below will automatically rotate in the storefront display with smooth Ken-Burns animation:</span>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="flex items-center gap-1 text-stone-400 hover:text-amber-300 cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="space-y-3">
                {slides.map((slide, idx) => (
                  <div 
                    key={slide.id || idx}
                    className="p-3.5 rounded-2xl bg-[#16161f] border border-stone-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-24 h-18 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-black border border-stone-700 shrink-0">
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.title} 
                        className="w-full h-full object-cover" 
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono px-1.5 py-0.5 rounded text-amber-300">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Metadata Editors */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      <div>
                        <label className="text-[10px] font-mono text-stone-400 block mb-0.5">Title</label>
                        <input 
                          type="text" 
                          value={slide.title}
                          onChange={(e) => handleUpdateSlideField(idx, 'title', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#0f0f14] border border-stone-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                          placeholder="e.g. Royal Emerald Velvet Abaya"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-stone-400 block mb-0.5">Badge</label>
                        <input 
                          type="text" 
                          value={slide.badge || ''}
                          onChange={(e) => handleUpdateSlideField(idx, 'badge', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#0f0f14] border border-stone-700 rounded-lg text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                          placeholder="e.g. Atelier Heritage · Shop G7"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-mono text-stone-400 block mb-0.5">Subtitle / Description</label>
                        <input 
                          type="text" 
                          value={slide.subtitle}
                          onChange={(e) => handleUpdateSlideField(idx, 'subtitle', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#0f0f14] border border-stone-700 rounded-lg text-stone-300 focus:outline-none focus:border-amber-400"
                          placeholder="e.g. Hand-embroidered zardozi and crystalline beadwork tailored with modesty."
                        />
                      </div>
                    </div>

                    {/* Reorder and Delete Actions */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveSlide(idx, 'up')}
                        className="p-1.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Up in Animation"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === slides.length - 1}
                        onClick={() => handleMoveSlide(idx, 'down')}
                        className="p-1.5 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg disabled:opacity-30 cursor-pointer"
                        title="Move Down in Animation"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(idx)}
                        className="p-1.5 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-700 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
                        title="Remove Picture from Animation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD / ADD NEW SLIDE */}
          {activeTab === 'add' && (
            <form onSubmit={handleAddNewSlide} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Image Upload / Input */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-stone-300 font-semibold block">
                    1. Upload or Paste Picture
                  </label>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 text-center bg-[#15151e] hover:bg-[#1a1a26] transition-colors cursor-pointer space-y-2"
                  >
                    <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-xs font-semibold text-stone-200">
                      Click to choose image from your computer / phone
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Supports JPG, PNG, WebP
                    </div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden" 
                    />
                  </div>

                  <div className="text-center text-xs text-stone-500 font-mono">
                    — OR PASTE IMAGE URL —
                  </div>

                  <input 
                    type="url" 
                    value={newImageUrl}
                    onChange={(e) => {
                      setNewImageUrl(e.target.value);
                      setPreviewError(false);
                    }}
                    placeholder="https://... or /src/assets/images/..."
                    className="w-full px-3 py-2 text-xs bg-[#0f0f14] border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Live Preview Box */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-stone-300 font-semibold block">
                    Preview in Display Frame
                  </label>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-stone-800 flex items-center justify-center">
                    {newImageUrl && !previewError ? (
                      <img 
                        src={newImageUrl} 
                        alt="Preview" 
                        onError={() => setPreviewError(true)}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-center p-4 text-stone-500 space-y-1">
                        <ImageIcon className="w-8 h-8 mx-auto text-stone-600" />
                        <span className="text-xs">No picture selected yet</span>
                      </div>
                    )}

                    {newImageUrl && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-xs p-2 rounded-lg text-white space-y-0.5">
                        <span className="text-[9px] font-mono text-amber-300 block">{newBadge || 'Atelier Showcase'}</span>
                        <div className="text-xs font-serif font-bold truncate">{newTitle || 'Headline'}</div>
                        <div className="text-[10px] text-stone-300 truncate">{newSubtitle || 'Description'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Text metadata */}
              <div className="space-y-3 pt-2 border-t border-stone-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-stone-400 block mb-1">Headline / Title *</label>
                    <input 
                      type="text" 
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Royal Emerald Velvet Abaya"
                      className="w-full px-3 py-2 text-xs bg-[#0f0f14] border border-stone-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-stone-400 block mb-1">Badge Tag</label>
                    <input 
                      type="text" 
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      placeholder="e.g. Atelier Heritage · Shop G7"
                      className="w-full px-3 py-2 text-xs bg-[#0f0f14] border border-stone-700 rounded-xl text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-stone-400 block mb-1">Subtitle / Craftsmanship Story *</label>
                  <textarea 
                    required
                    rows={2}
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Hand-embroidered zardozi and crystalline beadwork tailored with modesty."
                    className="w-full px-3 py-2 text-xs bg-[#0f0f14] border border-stone-700 rounded-xl text-stone-200 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-950/40"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Animation Slides</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PICK FROM STORE CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-400 font-mono">
                Click any garment or fragrance picture below to immediately add it to your animated showcase display:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className="p-2 bg-[#16161f] rounded-xl border border-stone-800 hover:border-amber-400/80 transition-all group flex flex-col justify-between"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-black mb-2">
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <span className="absolute top-1 left-1 bg-black/80 text-amber-300 text-[9px] font-mono px-1 rounded">
                        KES {product.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1 mb-2">
                      <h4 className="text-xs font-semibold text-white truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-stone-400 truncate">
                        {product.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddFromProduct(product, product.images[0])}
                      className="w-full py-1.5 px-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Add to Animation</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-[#0d0d12] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Changes will immediately update the live showcase on your storefront.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOwnerShowcaseModalOpen(false)}
              className="px-4 py-2 text-xs text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                savedNotice 
                  ? 'bg-emerald-500 text-stone-950' 
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-amber-950/40'
              }`}
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Display Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>Save Animation Display</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
