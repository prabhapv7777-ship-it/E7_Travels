import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Building, 
  User, 
  Calendar, 
  Hash, 
  IndianRupee, 
  FileSignature, 
  Type, 
  Briefcase,
  Sparkles,
  Mail,
  Phone,
  FileBadge,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { Vehicle, Company } from '../types';
import { formatDate, getTodayDateString } from '../lib/dateUtils';

interface DocumentViewsProps {
  vehicles: Vehicle[];
  companies: Company[];
  activeSubView: 'Tax Invoice' | 'Letter Head';
  customLogo?: string | null;
  onUpdateLogo?: (logo: string | null) => void;
}

// Indian Rupees Number to Words converter (supports Lakhs and Crores perfectly)
function numberToWords(num: number): string {
  if (num === 0) return 'zero';
  
  const singleDigits = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teenDigits = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const doubleDigits = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const formatGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 10 && n < 20) {
      str += teenDigits[n - 10] + ' ';
    } else if (n >= 20) {
      str += doubleDigits[Math.floor(n / 10)] + ' ' + singleDigits[n % 10] + ' ';
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remaining = Math.round(num);

  if (crore > 0) {
    words += formatGroup(crore) + ' crore ';
  }
  if (lakh > 0) {
    words += formatGroup(lakh) + ' lakh ';
  }
  if (thousand > 0) {
    words += formatGroup(thousand) + ' thousand ';
  }
  if (remaining > 0) {
    words += formatGroup(remaining);
  }

  const result = words.trim().replace(/\s+/g, ' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Resizes a raster image down to a maximum bounding box to protect localStorage quota.
const resizeImage = (base64Str: string, maxWidth: number, maxHeight: number, callback: (resizedBase64: string) => void) => {
  if (base64Str.startsWith('data:image/svg+xml')) {
    callback(base64Str);
    return;
  }
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    let width = img.width;
    let height = img.height;
    if (width <= maxWidth && height <= maxHeight) {
      callback(base64Str);
      return;
    }
    if (width > height) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(base64Str);
      return;
    }
    ctx.drawImage(img, 0, 0, width, height);
    try {
      callback(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Failed to get data URL from canvas', err);
      callback(base64Str);
    }
  };
  img.onerror = () => {
    callback(base64Str);
  };
};

interface SavedRecipient {
  id: string;
  name: string;
  gstin: string;
  address: string;
  mobile: string;
  email: string;
}

export default function DocumentViews({ vehicles, companies, activeSubView, customLogo, onUpdateLogo }: DocumentViewsProps) {
  // Global States
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [isLogoBgTransparent, setIsLogoBgTransparent] = useState(true);

  // Background transparency processor for custom logo
  const handleRemoveBg = () => {
    if (!customLogo) return;
    if (customLogo.startsWith('data:image/svg+xml')) return;

    setIsLogoBgTransparent(true);
    const img = new Image();
    img.src = customLogo;
    img.onload = () => {
      try {
        if (!img.width || !img.height) return;
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const threshold = 240; // Default threshold to clear near-white backgrounds
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // Alpha 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const transparentBase64 = canvas.toDataURL('image/png');
        onUpdateLogo?.(transparentBase64);
      } catch (err) {
        console.error('Error removing background:', err);
      }
    };
  };

  // ================= SAVED RECIPIENTS STATE =================
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>(() => {
    const saved = localStorage.getItem('e7_saved_recipients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved recipients', e);
      }
    }
    // Default initial list seeded with image data and sample
    return [
      {
        id: 'default-1',
        name: 'FIESTA SMART MOBILITY PRIVATE LIMITED',
        gstin: '33AAACF9806G1ZS',
        address: 'No.99, L D G Road, Little Mount, Saidapet, Chennai - 600015',
        mobile: '9942210038',
        email: 'billing@fiestasmarte7.com'
      },
      {
        id: 'default-2',
        name: 'GOGO TRANSPORT SERVICE PVT LTD',
        gstin: '33AABCG1234F1Z8',
        address: '12, Anna Salai, Mount Road, Chennai - 600002',
        mobile: '9840012345',
        email: 'accounts@gogotransport.in'
      }
    ];
  });

  // Save to local storage whenever list changes
  useEffect(() => {
    localStorage.setItem('e7_saved_recipients', JSON.stringify(savedRecipients));
  }, [savedRecipients]);

  const [recipientFeedback, setRecipientFeedback] = useState<string>('');

  // ================= TAX INVOICE STATES =================
  const [invoiceNo, setInvoiceNo] = useState('06/26-27');
  const [invoiceDate, setInvoiceDate] = useState('10-07-2026');
  
  // Supplier details
  const [supplierName, setSupplierName] = useState('E7 Tours & Travels');
  const [supplierGstin, setSupplierGstin] = useState('33BZEPP2705B1ZX');
  const [supplierAddress, setSupplierAddress] = useState('3/289, South Street, Annai teresa nursery and primary school, Mudhanai, Cuddalore Tamil Nadu - 607804');
  const [supplierMobile, setSupplierMobile] = useState('9942210038');
  const [supplierEmail, setSupplierEmail] = useState('e7tourstravels@gmail.com');

  // Recipient details
  const [recipientName, setRecipientName] = useState('FIESTA SMART MOBILITY PRIVATE LIMITED');
  const [recipientGstin, setRecipientGstin] = useState('33AAACF9806G1ZS');
  const [recipientAddress, setRecipientAddress] = useState('No.99, L D G Road, Little Mount, Saidapet, Chennai - 600015');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Service details
  const [serviceDesc, setServiceDesc] = useState('Car Hire charges MAY 26');
  const [sacCode, setSacCode] = useState('996601');
  const [amount, setAmount] = useState(509480);
  const [gstRate, setGstRate] = useState<5 | 12 | 18 | 0>(5);

  // Bank Info
  const [bankAccName, setBankAccName] = useState('E7 Tours & Travels');
  const [bankAccNo, setBankAccNo] = useState('50200112339441');
  const [bankAccType, setBankAccType] = useState('Current');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankIfsc, setBankIfsc] = useState('HDFC0008544');

  // ================= LETTER HEAD STATES =================
  const [letterRef, setLetterRef] = useState('');
  const [letterDate, setLetterDate] = useState(getTodayDateString());
  const [letterTo, setLetterTo] = useState('');
  const [letterSubject, setLetterSubject] = useState('');
  const [letterSalutation, setLetterSalutation] = useState('Dear Sir/Madam,');
  const [letterBody, setLetterBody] = useState('');
  const [letterSignatory, setLetterSignatory] = useState('For E7 Tours & Travels,\n\n\n\nAuthorised Signatory');
  const [letterPreset, setLetterPreset] = useState('blank');

  // Load selected company into Recipient state
  useEffect(() => {
    if (selectedCompany) {
      const compObj = companies.find(c => c.name === selectedCompany);
      if (compObj) {
        setRecipientName(compObj.name.toUpperCase());
        setRecipientAddress(compObj.address || '');
        // Generate placeholder or random GSTIN for preview
        setRecipientGstin('33AAACF' + Math.floor(1000 + Math.random() * 9000) + 'G1ZS');
      }
    }
  }, [selectedCompany, companies]);

  // Load selected vehicle into invoice/letterhead context
  useEffect(() => {
    if (selectedVehicle) {
      const veh = vehicles.find(v => v.registrationNumber === selectedVehicle);
      if (veh) {
        const monthYear = new Date().toLocaleString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();
        setServiceDesc(`Car Hire charges ${monthYear} for Vehicle ${veh.registrationNumber}`);
        
        // Match company
        const targetComp = companies.find(c => c.name === veh.company);
        if (targetComp) {
          setSelectedCompany(targetComp.name);
        }
      }
    }
  }, [selectedVehicle, vehicles, companies]);

  // Save current recipient to savedRecipients list
  const handleSaveCurrentRecipient = () => {
    if (!recipientName || !recipientName.trim()) {
      setRecipientFeedback('Recipient Name is required to save');
      setTimeout(() => setRecipientFeedback(''), 3000);
      return;
    }

    const currentName = recipientName.trim();
    const existingIndex = savedRecipients.findIndex(
      r => r.name.toLowerCase() === currentName.toLowerCase()
    );

    const newRecipient: SavedRecipient = {
      id: existingIndex >= 0 ? savedRecipients[existingIndex].id : Date.now().toString(),
      name: currentName,
      gstin: recipientGstin.trim(),
      address: recipientAddress.trim(),
      mobile: recipientMobile.trim(),
      email: recipientEmail.trim()
    };

    if (existingIndex >= 0) {
      const updatedList = [...savedRecipients];
      updatedList[existingIndex] = newRecipient;
      setSavedRecipients(updatedList);
      setRecipientFeedback('Recipient details updated!');
    } else {
      setSavedRecipients([...savedRecipients, newRecipient]);
      setRecipientFeedback('New Recipient saved!');
    }

    setTimeout(() => setRecipientFeedback(''), 3000);
  };

  // Delete recipient
  const handleDeleteRecipient = (idToDelete: string) => {
    setSavedRecipients(savedRecipients.filter(r => r.id !== idToDelete));
    setRecipientFeedback('Recipient deleted.');
    setTimeout(() => setRecipientFeedback(''), 3000);
  };

  // Clear fields to easily start typing a new one
  const handleClearRecipientFields = () => {
    setRecipientName('');
    setRecipientGstin('');
    setRecipientAddress('');
    setRecipientMobile('');
    setRecipientEmail('');
    setRecipientFeedback('Fields cleared.');
    setTimeout(() => setRecipientFeedback(''), 2000);
  };

  // Tax breakdown computation
  const taxBreakdown = useMemo(() => {
    const isGstActive = gstRate > 0;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;

    const cgstAmount = isGstActive ? Math.round(amount * (cgstRate / 100)) : 0;
    const sgstAmount = isGstActive ? Math.round(amount * (sgstRate / 100)) : 0;
    const igstAmount = 0; // standard CGST/SGST local billing default

    const grandTotal = amount + cgstAmount + sgstAmount;

    return {
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      grandTotal
    };
  }, [amount, gstRate]);

  // Format currency helper matching Indian Lac/Crore layout standard
  const formatIndianCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Letter Head Preset logic
  const handleLetterPresetChange = (presetName: string) => {
    setLetterPreset(presetName);
    
    // Auto Ref Generation
    const refSuffix = Math.floor(100 + Math.random() * 900);
    const newRef = `E7/LT/${new Date(letterDate).getFullYear()}/${refSuffix}`;
    setLetterRef(newRef);

    switch (presetName) {
      case 'driver_auth':
        setLetterSubject('Letter of Driver Authorization and Fleet Operator Compliance');
        setLetterTo('To Whomsoever It May Concern,\nSecurity & Ingress Control Terminal,\nChennai Hub Premises');
        setLetterBody(`We, E7 Tours & Travels Chennai, do hereby authorize and certify that the driver listed below is a registered commercial pilot with our transport fleet.

He is officially authorized to operate and maneuver the commercial vehicle with plate details below:
• Authorized Vehicle: ${selectedVehicle || '[Select Vehicle Above]'}
• Assigned Pilot: ${selectedVehicle ? vehicles.find(v => v.registrationNumber === selectedVehicle)?.driverName || 'Registered Driver' : '[Please Select Vehicle]'}

All background documentation, commercial licenses, police verification status records, and physical medical certifications of the authorized driver are up-to-date and stored in our central compliance registry. Kindly allow full authorized access for transport duties.`);
        break;

      case 'noc':
        setLetterSubject('No Objection Certificate (NOC) for Fleet Support Deployment');
        setLetterTo('The Regional Transport Officer,\nGovernment Transit Authority Department,\nChennai South');
        setLetterBody(`This is to certify that E7 Tours & Travels Chennai holds absolutely No Objection towards operating, shifting, or executing inter-district logistics services for the commercial vehicle:

• Vehicle Registration Number: ${selectedVehicle || '[Select Vehicle Above]'}
• Operator Support Registered Name: ${selectedVehicle ? vehicles.find(v => v.registrationNumber === selectedVehicle)?.ownerName || 'E7 Fleet Partner' : '[Please Select Vehicle]'}

This certification is issued to verify that the vehicle maintains a clean background with zero active litigation or financial hold backs in our accounts ledger, permitting smooth travel support across operational transit hubs.`);
        break;

      case 'blank':
      default:
        setLetterSubject('Subject Line of the Letter Here');
        setLetterTo('The Recipient Name/Company,\nStreet Address Line 1,\nCity, State - Pincode');
        setLetterBody(`This is a blank letterhead template. You can type any custom correspondence, notifications, notices, agreements, or official communication here.

The layout is optimized for high-quality corporate layout print preview. When printed, all navigation panels are automatically omitted.`);
        break;
    }
  };

  useEffect(() => {
    if (activeSubView === 'Letter Head' && letterPreset !== 'custom_manual') {
      handleLetterPresetChange(letterPreset);
    }
  }, [letterDate, selectedVehicle]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER EXPLANATORY CARD */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#114b3e]/10 text-[#114b3e] rounded-lg">
              <FileBadge className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              E7 TOURS & TRAVELS DOCUMENT CENTRE
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Live interactive preview of official print compliance templates. Formatted to perfectly match government guidelines, HSN tax invoice layouts, and letterhead standards.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#114b3e] hover:bg-[#0c392f] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
        >
          <Printer className="h-4 w-4" /> Print Document (A4)
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CONFIGURATION PANEL */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 print:hidden shadow-3xs text-left">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> Live Document Editor
          </h3>

          {/* Logo Customizer and Size Selector */}
          <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-extrabold text-slate-500 uppercase tracking-wider block">Company Logo (PNG Format)</span>
              {customLogo && (
                <button
                  type="button"
                  onClick={() => onUpdateLogo?.(null)}
                  className="text-3xs font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wide cursor-pointer"
                >
                  Clear Logo
                </button>
              )}
            </div>

            {/* Logo Upload Box */}
            <div className="flex items-center gap-3">
              <div className={`border border-dashed border-slate-200 rounded-lg flex items-center justify-center shrink-0 shadow-3xs overflow-hidden ${
                isLogoBgTransparent ? 'bg-slate-100' : 'bg-white'
              } ${
                logoSize === 'sm' ? 'h-10 w-10' :
                logoSize === 'md' ? 'h-12 w-12' :
                logoSize === 'lg' ? 'h-14 w-14' :
                'h-16 w-16'
              }`}>
                {customLogo ? (
                  <img src={customLogo} alt="Logo" className="max-h-full max-w-full object-contain p-1" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-4xs text-slate-300 font-bold uppercase">No Logo</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/png"
                  id="document-logo-file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const base64 = evt.target?.result as string;
                      resizeImage(base64, 400, 400, (resizedBase64) => {
                        onUpdateLogo?.(resizedBase64);
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <label
                  htmlFor="document-logo-file"
                  className="inline-flex items-center justify-center px-2.5 py-1.5 border border-slate-200 text-3xs font-extrabold uppercase rounded-md bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-3xs cursor-pointer tracking-wider"
                >
                  Upload PNG Logo
                </label>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">Recommended PNG with transparent background</p>
              </div>
            </div>

            {/* Logo Size Selector */}
            <div className="space-y-1">
              <span className="text-4xs font-extrabold text-slate-400 uppercase tracking-wider block">Logo Display Size</span>
              <div className="flex gap-1 bg-white p-1 border border-slate-150 rounded-lg">
                {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => {
                  const labels = { sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
                  const isSelected = logoSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setLogoSize(sz)}
                      className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
                        isSelected 
                          ? 'bg-[#114b3e] text-white shadow-3xs' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      title={`${sz.toUpperCase()} Size`}
                    >
                      {labels[sz]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo Box Background Selector */}
            <div className="space-y-1">
              <span className="text-4xs font-extrabold text-slate-400 uppercase tracking-wider block">Logo Box Background</span>
              <div className="flex gap-1 bg-white p-1 border border-slate-150 rounded-lg">
                {[
                  { value: true, label: 'Transparent' },
                  { value: false, label: 'White Box' },
                ].map((opt) => {
                  const isSelected = isLogoBgTransparent === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setIsLogoBgTransparent(opt.value)}
                      className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded-md transition-all cursor-pointer text-center ${
                        isSelected 
                          ? 'bg-[#114b3e] text-white shadow-3xs' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Transparency Button */}
            {customLogo && !customLogo.startsWith('data:image/svg+xml') && (
              <button
                type="button"
                onClick={handleRemoveBg}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-3xs font-extrabold uppercase rounded-lg hover:bg-emerald-100 cursor-pointer shadow-3xs transition-all mt-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Make Background Transparent
              </button>
            )}
          </div>

          {/* Quick Association Selectors */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Pre-select Vehicle Context</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="">-- Manual/Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.registrationNumber}>{v.registrationNumber} ({v.driverName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Pre-select Corporate Client</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="">-- Manual/Choose Client --</option>
                {companies.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {activeSubView === 'Tax Invoice' ? (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider">Invoice Identifiers</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Invoice No</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Invoice Date</label>
                  <input
                    type="text"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider font-mono">1. Supplier Details</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Supplier GSTIN</label>
                  <input
                    type="text"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Supplier Address</label>
                  <textarea
                    rows={2}
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Supplier Mobile</label>
                    <input
                      type="text"
                      value={supplierMobile}
                      onChange={(e) => setSupplierMobile(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Supplier Email</label>
                    <input
                      type="text"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider">2. Recipient Details</h4>
              
              {/* Saved Recipients quick manager panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Saved Recipients Manager</span>
                  {recipientFeedback && (
                    <span className="text-[10px] font-bold text-emerald-600 animate-pulse">{recipientFeedback}</span>
                  )}
                </div>
                
                {savedRecipients.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-100">
                    {savedRecipients.map((rec) => (
                      <div 
                        key={rec.id}
                        onClick={() => {
                          setRecipientName(rec.name);
                          setRecipientGstin(rec.gstin);
                          setRecipientAddress(rec.address);
                          setRecipientMobile(rec.mobile);
                          setRecipientEmail(rec.email);
                        }}
                        className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] rounded-md font-semibold border cursor-pointer transition-all ${
                          recipientName.toLowerCase() === rec.name.toLowerCase()
                            ? 'bg-[#114b3e]/10 text-[#114b3e] border-[#114b3e]/30 shadow-3xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex flex-col text-left truncate">
                          <span className="truncate font-black text-slate-800 text-[10.5px]">{rec.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono truncate">{rec.gstin || 'NO GSTIN'} | {rec.email || 'No email'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecipient(rec.id);
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 shrink-0"
                          title="Delete saved recipient"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No saved custom recipients yet.</p>
                )}

                {/* Inline Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCurrentRecipient}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-black text-white bg-[#114b3e] rounded-lg hover:bg-[#0c392f] transition-all cursor-pointer shadow-3xs"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Current Details
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRecipientFields}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-all cursor-pointer"
                  >
                    Clear Form
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                    <span>Quick Select Recipient/Company</span>
                    <span className="text-[9px] text-[#114b3e] font-bold">Presets</span>
                  </label>
                  <select
                    value={savedRecipients.some(r => r.name.toLowerCase() === recipientName.toLowerCase())
                      ? savedRecipients.find(r => r.name.toLowerCase() === recipientName.toLowerCase())?.id
                      : (companies.some(c => c.name.toLowerCase() === recipientName.toLowerCase()) ? companies.find(c => c.name.toLowerCase() === recipientName.toLowerCase())?.name : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        handleClearRecipientFields();
                        return;
                      }
                      // Check in savedRecipients first
                      const matchedSaved = savedRecipients.find(r => r.id === val);
                      if (matchedSaved) {
                        setRecipientName(matchedSaved.name);
                        setRecipientGstin(matchedSaved.gstin);
                        setRecipientAddress(matchedSaved.address);
                        setRecipientMobile(matchedSaved.mobile);
                        setRecipientEmail(matchedSaved.email);
                        return;
                      }
                      // Check in companies register
                      const matchedCompany = companies.find(c => c.name === val);
                      if (matchedCompany) {
                        setRecipientName(matchedCompany.name);
                        setRecipientGstin(''); // Can be manually typed if needed
                        setRecipientAddress(matchedCompany.address || '');
                        setRecipientMobile(matchedCompany.phone || '');
                        setRecipientEmail(matchedCompany.email || '');
                        return;
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 focus:outline-none focus:border-[#114b3e]"
                  >
                    <option value="">-- Start fresh or choose saved --</option>
                    {savedRecipients.length > 0 && (
                      <optgroup label="Custom Saved Recipients">
                        {savedRecipients.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {companies.length > 0 && (
                      <optgroup label="Registered Corporate Companies">
                        {companies.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Recipient GSTIN</label>
                  <input
                    type="text"
                    value={recipientGstin}
                    onChange={(e) => setRecipientGstin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Recipient Address</label>
                  <textarea
                    rows={2}
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Recipient Mobile</label>
                    <input
                      type="text"
                      value={recipientMobile}
                      onChange={(e) => setRecipientMobile(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Recipient Email</label>
                    <input
                      type="text"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider">3. Line Items</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Service Description</label>
                  <input
                    type="text"
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">SAC Code</label>
                    <input
                      type="text"
                      value={sacCode}
                      onChange={(e) => setSacCode(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">GST Rate (%)</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value) as any)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value={5}>5% (CGST 2.5%, SGST 2.5%)</option>
                      <option value={12}>12% (CGST 6%, SGST 6%)</option>
                      <option value={18}>18% (CGST 9%, SGST 9%)</option>
                      <option value={0}>0% (No GST)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Taxable Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider">4. Bank & Remittance</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Account Name</label>
                    <input
                      type="text"
                      value={bankAccName}
                      onChange={(e) => setBankAccName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankAccNo}
                      onChange={(e) => setBankAccNo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Type</label>
                    <input
                      type="text"
                      value={bankAccType}
                      onChange={(e) => setBankAccType(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Letter Head Controls
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#114b3e] uppercase tracking-wider">Letterhead Template Presets</h4>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Select Document Template</label>
                <select
                  value={letterPreset}
                  onChange={(e) => handleLetterPresetChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 cursor-pointer"
                >
                  <option value="blank">📝 Custom / Blank Letterhead</option>
                  <option value="driver_auth">🪪 Driver Crew Gatepass Authorization</option>
                  <option value="noc">📜 Official No Objection Certificate (NOC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Letter Ref No</label>
                  <input
                    type="text"
                    value={letterRef}
                    onChange={(e) => {
                      setLetterRef(e.target.value);
                      setLetterPreset('custom_manual');
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Recipient/Addressed To</label>
                <textarea
                  rows={2}
                  value={letterTo}
                  onChange={(e) => {
                    setLetterTo(e.target.value);
                    setLetterPreset('custom_manual');
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={letterSubject}
                  onChange={(e) => {
                    setLetterSubject(e.target.value);
                    setLetterPreset('custom_manual');
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Letter Body Copy</label>
                <textarea
                  rows={8}
                  value={letterBody}
                  onChange={(e) => {
                    setLetterBody(e.target.value);
                    setLetterPreset('custom_manual');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg leading-relaxed text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Sign-Off Designation</label>
                <textarea
                  rows={2}
                  value={letterSignatory}
                  onChange={(e) => {
                    setLetterSignatory(e.target.value);
                    setLetterPreset('custom_manual');
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-[10px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY LIVE A4 TEMPLATE MATCHING UPLOADED FORMAT */}
        <div className="xl:col-span-8 flex justify-center bg-slate-100 p-0 sm:p-6 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
          
          {/* Paper A4 Container */}
          <div className="w-[794px] min-h-[1123px] bg-white text-slate-800 p-[35px] shadow-2xl relative border border-slate-300 font-sans flex flex-col justify-between" id="printable-a4-area">
            
            {/* INVOICE CONTENT */}
            <div>
              
              {/* IMAGE HEADER BANNER STYLE */}
              <div className="border-[1.5px] border-black overflow-hidden flex flex-col">
                <div className="flex h-[75px] w-full border-b-[1.5px] border-black">
                  
                  {/* Left Block with stylized E7 Logo */}
                  <div className="w-[58%] bg-[#114b3e] text-white flex items-center px-4 relative justify-between overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 93% 100%, 0 100%)' }}>
                    <div className="flex items-center gap-3">
                      {/* E7 visual outline matching logo box in image or uploaded custom logo */}
                      {customLogo ? (
                        <div className={`${
                          isLogoBgTransparent ? 'bg-transparent' : 'bg-white p-1 shadow-3xs'
                        } rounded-md flex items-center justify-center shrink-0 overflow-hidden ${
                          logoSize === 'sm' ? 'h-[36px] w-[36px]' :
                          logoSize === 'md' ? 'h-[52px] w-[52px]' :
                          logoSize === 'lg' ? 'h-[64px] w-[64px]' :
                          'h-[72px] w-[72px]'
                        }`}>
                          <img 
                            src={customLogo} 
                            alt="Custom Logo" 
                            className="h-full w-full object-contain" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-[#a3e635] px-2 py-0.5 relative shrink-0 leading-none" style={{ borderWidth: '3px' }}>
                          <span className="text-[32px] font-black tracking-tighter text-[#a3e635] italic">E7</span>
                        </div>
                      )}
                      <div className="text-left leading-none">
                        <h1 className="text-[20px] font-extrabold tracking-tight" style={{ fontFamily: 'sans-serif' }}>E7 TOURS & TRAVELS</h1>
                      </div>
                    </div>
                  </div>

                  {/* Right Block for Contact details */}
                  <div className="w-[42%] bg-white text-slate-800 flex flex-col justify-center px-3 pl-8 text-[11px] font-bold space-y-0.5 relative">
                    <div className="absolute left-0 top-0 h-full w-[15px] bg-[#114b3e]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                    <div className="absolute right-0 top-0 px-2 py-0.5 bg-[#114b3e] text-white text-[9px] font-black rounded-bl tracking-wider">
                      GSTIN : 33BZEPP2705B1ZX
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2 text-[#114b3e]">
                      <Phone className="h-3.5 w-3.5 fill-[#a3e635] text-[#114b3e]" />
                      <span>70107 97811</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#114b3e]">
                      <Phone className="h-3.5 w-3.5 fill-[#a3e635] text-[#114b3e]" />
                      <span>99422 10038</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#114b3e] lowercase font-normal">
                      <Mail className="h-3.5 w-3.5 text-[#114b3e]" />
                      <span className="font-semibold text-[10.5px]">e7tourstravels@gmail.com</span>
                    </div>
                  </div>

                </div>

                {/* Sub-Header light-green banner containing address */}
                <div className="bg-[#a3e635] text-[#114b3e] text-center py-1 text-[10.5px] font-extrabold border-b-[1.5px] border-black tracking-wide">
                  3/289, South Street, Mudhanai, Vridhachalam Taluk - 607 804.
                </div>

                {activeSubView === 'Tax Invoice' ? (
                  <>
                    {/* Tax Invoice centered heading label */}
                    <div className="text-center font-bold text-xs py-1 uppercase bg-slate-50 border-b-[1.5px] border-black tracking-widest text-slate-900">
                      TAX INVOICE
                    </div>

                    {/* Invoice Info Row (No & Date) */}
                    <div className="flex w-full text-xs font-bold border-b-[1.5px] border-black">
                      <div className="w-[15%] px-3 py-1 text-slate-800 border-r-[1.5px] border-black bg-slate-50">Invoice No:</div>
                      <div className="w-[35%] px-3 py-1 font-mono border-r-[1.5px] border-black">{invoiceNo}</div>
                      <div className="w-[18%] px-3 py-1 text-slate-800 border-r-[1.5px] border-black bg-slate-50">Invoice Date:</div>
                      <div className="w-[32%] px-3 py-1 font-mono">{invoiceDate}</div>
                    </div>

                    {/* Supplier & Recipient side-by-side grid */}
                    <div className="flex w-full text-[11px] border-b-[1.5px] border-black">
                      
                      {/* Left: Supplier Details */}
                      <div className="w-1/2 border-r-[1.5px] border-black flex flex-col">
                        <div className="bg-slate-100 px-3 py-1 border-b-[1.5px] border-black font-extrabold text-slate-900 uppercase tracking-wider">
                          SUPPLIER
                        </div>
                        <div className="p-3 space-y-1 font-bold text-slate-800 flex-1">
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">NAME</span>
                            <span className="flex-1 text-[#114b3e] text-xs font-black uppercase">{supplierName}</span>
                          </div>
                          <div className="flex font-mono text-[10.5px]">
                            <span className="w-16 text-slate-400 font-medium font-sans">GSTIN</span>
                            <span className="flex-1 font-extrabold text-slate-900 uppercase">{supplierGstin}</span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">ADDRESS</span>
                            <span className="flex-1 text-slate-600 font-normal leading-snug whitespace-pre-line">{supplierAddress}</span>
                          </div>
                          <div className="flex pt-1">
                            <span className="w-16 text-slate-400 font-medium">Mobile</span>
                            <span className="flex-1 font-mono text-slate-800">{supplierMobile}</span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">Email ID</span>
                            <span className="flex-1 text-slate-600 font-normal text-[10.5px]">{supplierEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Recipient Details */}
                      <div className="w-1/2 flex flex-col">
                        <div className="bg-slate-100 px-3 py-1 border-b-[1.5px] border-black font-extrabold text-slate-900 uppercase tracking-wider">
                          RECIPIENT
                        </div>
                        <div className="p-3 space-y-1 font-bold text-slate-800 flex-1">
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">NAME</span>
                            <span className="flex-1 text-slate-900 font-black uppercase text-[11.5px] leading-snug">{recipientName || 'FIESTA SMART MOBILITY PRIVATE LIMITED'}</span>
                          </div>
                          <div className="flex font-mono text-[10.5px]">
                            <span className="w-16 text-slate-400 font-medium font-sans">GSTIN</span>
                            <span className="flex-1 font-extrabold text-slate-900 uppercase">{recipientGstin || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">ADDRESS</span>
                            <span className="flex-1 text-slate-600 font-normal leading-snug whitespace-pre-line">{recipientAddress || 'No Address Logged'}</span>
                          </div>
                          <div className="flex pt-1">
                            <span className="w-16 text-slate-400 font-medium">Mobile</span>
                            <span className="flex-1 font-mono text-slate-800">{recipientMobile || '-'}</span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-slate-400 font-medium">Email ID</span>
                            <span className="flex-1 text-slate-600 font-normal text-[10.5px]">{recipientEmail || '-'}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* S.NO / Service details / SAC Code / Amount grid container */}
                    <div className="w-full flex flex-col border-b-[1.5px] border-black">
                      
                      {/* Grid Header */}
                      <div className="flex w-full text-xs font-bold text-center border-b-[1.5px] border-black bg-slate-50">
                        <div className="w-[10%] py-1.5 border-r-[1.5px] border-black text-center">S.NO</div>
                        <div className="w-[55%] py-1.5 border-r-[1.5px] border-black text-left px-4">Description of service</div>
                        <div className="w-[15%] py-1.5 border-r-[1.5px] border-black text-center">SAC Code</div>
                        <div className="w-[20%] py-1.5 text-right px-4">Amount</div>
                      </div>

                      {/* Grid Item row with fixed high-fidelity height */}
                      <div className="flex w-full text-xs font-semibold min-h-[170px]">
                        <div className="w-[10%] py-3 border-r-[1.5px] border-black text-center font-bold text-slate-500">1</div>
                        <div className="w-[55%] py-3 border-r-[1.5px] border-black px-4 text-left font-bold text-slate-800">
                          {serviceDesc}
                        </div>
                        <div className="w-[15%] py-3 border-r-[1.5px] border-black text-center font-mono text-slate-600">{sacCode}</div>
                        <div className="w-[20%] py-3 text-right px-4 font-mono font-bold text-slate-800">{formatIndianCurrency(amount)}</div>
                      </div>

                      {/* Total row matching image layout */}
                      <div className="flex w-full text-xs font-bold border-t-[1.5px] border-black">
                        <div className="w-[80%] py-1 px-4 border-r-[1.5px] border-black text-left">Total</div>
                        <div className="w-[20%] py-1 text-right px-4 font-mono font-black">{formatIndianCurrency(amount)}</div>
                      </div>

                      {/* GST taxes section right half panel */}
                      <div className="flex w-full text-xs border-t-[1.5px] border-black font-bold">
                        <div className="w-[50%] border-r-[1.5px] border-black bg-white p-3 text-[10px] text-slate-500 leading-snug flex items-center">
                          Note: As per GST notification No.22/2019 Central Tax (Rate) as amended to original notification No.13/2017 Central Tax (Rate), GST is payable on reverse charge basis by the recipient of service.
                        </div>
                        <div className="w-[50%] flex flex-col">
                          
                          <div className="flex w-full border-b-[1.5px] border-black">
                            <div className="w-[60%] py-1 px-3 border-r-[1.5px] border-black">CGST @ {taxBreakdown.cgstRate}%</div>
                            <div className="w-[40%] py-1 px-3 text-right font-mono">{taxBreakdown.cgstAmount > 0 ? formatIndianCurrency(taxBreakdown.cgstAmount) : '-'}</div>
                          </div>

                          <div className="flex w-full border-b-[1.5px] border-black">
                            <div className="w-[60%] py-1 px-3 border-r-[1.5px] border-black">SGST @ {taxBreakdown.sgstRate}%</div>
                            <div className="w-[40%] py-1 px-3 text-right font-mono">{taxBreakdown.sgstAmount > 0 ? formatIndianCurrency(taxBreakdown.sgstAmount) : '-'}</div>
                          </div>

                          <div className="flex w-full">
                            <div className="w-[60%] py-1 px-3 border-r-[1.5px] border-black">IGST @ {gstRate}%</div>
                            <div className="w-[40%] py-1 px-3 text-right font-mono">-</div>
                          </div>

                        </div>
                      </div>

                      {/* Grand Total Row */}
                      <div className="flex w-full text-xs font-bold border-t-[1.5px] border-black bg-slate-50">
                        <div className="w-[80%] py-1.5 px-4 border-r-[1.5px] border-black text-center tracking-wide uppercase text-[#114b3e] font-black">Total amount (Including GST)</div>
                        <div className="w-[20%] py-1.5 text-right px-4 font-mono text-base font-black text-[#114b3e]">₹{formatIndianCurrency(taxBreakdown.grandTotal)}</div>
                      </div>

                    </div>

                    {/* Word representation statement */}
                    <div className="p-3 border-b-[1.5px] border-black text-xs font-bold leading-relaxed text-slate-800">
                      Amount in <span className="underline decoration-slate-400 decoration-wavy">words: -</span> <span className="text-[#114b3e] font-extrabold italic">{numberToWords(taxBreakdown.grandTotal)} Rupees Only</span>
                    </div>

                    {/* Bank Info & Signature Panel side-by-side */}
                    <div className="flex w-full text-[11px] font-bold">
                      
                      {/* Bank Details */}
                      <div className="w-[55%] p-4 space-y-1.5 border-r-[1.5px] border-black">
                        <h4 className="font-extrabold text-[#114b3e] text-xs uppercase tracking-wide border-b border-dashed border-slate-200 pb-1 flex items-center gap-1">
                          Bank Information
                        </h4>
                        <div className="grid grid-cols-3 gap-y-1">
                          <span className="text-slate-400">Account name</span>
                          <span className="col-span-2 text-slate-800 font-extrabold">{bankAccName}</span>

                          <span className="text-slate-400">Account number</span>
                          <span className="col-span-2 font-mono text-slate-900 font-black">{bankAccNo}</span>

                          <span className="text-slate-400">Account type</span>
                          <span className="col-span-2 text-slate-800">{bankAccType}</span>

                          <span className="text-slate-400">Bank Name</span>
                          <span className="col-span-2 text-slate-800">{bankName}</span>

                          <span className="text-slate-400">IFSC Code</span>
                          <span className="col-span-2 font-mono text-[#114b3e] font-black">{bankIfsc}</span>
                        </div>
                      </div>

                      {/* Authorized Signatory Block */}
                      <div className="w-[45%] p-4 flex flex-col justify-between text-right min-h-[140px]">
                        <div className="font-black text-slate-800 uppercase tracking-tight text-xs">
                          For {supplierName}
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="h-10 w-24 border border-dashed border-slate-200 rounded my-1 flex items-center justify-center text-[10px] text-slate-300 font-normal italic">Official Seal</div>
                          <div className="font-black text-[#114b3e] border-t border-slate-200 pt-1 text-xs">
                            Authorised Signatory
                          </div>
                        </div>
                      </div>

                    </div>
                  </>
                ) : (
                  // LETTER HEAD WRITTEN INSIDE BORDERED CARD
                  <div className="p-8 space-y-6">
                    
                    {/* Meta Details: Ref & Date */}
                    <div className="flex justify-between text-xs font-semibold font-mono border-b border-slate-100 pb-2">
                      <p><span className="text-slate-400">Ref:</span> {letterRef || 'E7/LT/GEN/771'}</p>
                      <p><span className="text-slate-400">Date:</span> {formatDate(letterDate)}</p>
                    </div>

                    {/* Addressed To */}
                    <div className="text-xs space-y-1 text-slate-800 text-left">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">To,</p>
                      <div className="font-bold whitespace-pre-line leading-relaxed pl-2 border-l-2 border-slate-200">
                        {letterTo || 'The Recipient Details'}
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-150 text-xs font-black text-slate-800 uppercase flex gap-2 text-left">
                      <span className="text-blue-900">SUBJECT:</span>
                      <span className="underline decoration-indigo-300">{letterSubject || 'OFFICIAL LETTER SUBJECT CORRESPONDENCE'}</span>
                    </div>

                    {/* Letter Body */}
                    <div className="text-xs text-slate-700 leading-relaxed space-y-4 pt-2 text-left">
                      <p className="font-bold text-slate-900">{letterSalutation}</p>
                      <div className="whitespace-pre-line pl-1 pr-1 font-medium text-slate-700 leading-relaxed text-justify">
                        {letterBody || 'Please compose or select a preset template on the configuration panel.'}
                      </div>
                    </div>

                    {/* Sign-Off designations */}
                    <div className="pt-8 text-right font-mono text-[10.5px] whitespace-pre-line leading-relaxed">
                      {letterSignatory}
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Bottom Accent Decorator lines mimicking exact image footer layout */}
            <div className="mt-8">
              <div className="flex justify-center gap-1.5">
                <div className="h-2 w-16 bg-[#114b3e]" style={{ transform: 'skewX(-25deg)' }}></div>
                <div className="h-2 w-16 bg-[#a3e635]" style={{ transform: 'skewX(-25deg)' }}></div>
                <div className="h-2 w-[350px] bg-[#114b3e]" style={{ transform: 'skewX(-25deg)' }}></div>
                <div className="h-2 w-16 bg-[#a3e635]" style={{ transform: 'skewX(-25deg)' }}></div>
                <div className="h-2 w-16 bg-[#114b3e]" style={{ transform: 'skewX(-25deg)' }}></div>
              </div>
              <div className="text-center text-[9px] text-slate-400 mt-2 font-mono">
                System Generated Digital Copy | Safe Transit Compliance Registry
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* EMBEDDED PRINT CSS FOR PROFESSIONAL SCALING */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.6cm !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          aside, header, nav, .print\\:hidden, button, select, input, textarea, .xl\\:col-span-4 {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-a4-area {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

    </div>
  );
}
