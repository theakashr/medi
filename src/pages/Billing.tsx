import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  UserPlus, 
  CreditCard,
  QrCode,
  Scan,
  Printer,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Mic,
  Save,
  Barcode,
  Share2
} from 'lucide-react';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Medicine, Customer, Bill, BillItem, PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export default function Billing() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState(0);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [barcodeTerm, setBarcodeTerm] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [language, setLanguage] = useState<'english' | 'kannada'>('english');
  const [showQrModal, setShowQrModal] = useState(false);

  const t = {
    english: {
      createBill: "Create New Bill",
      searchPlaceholder: "Search medicine by name or brand...",
      cart: "Cart Items",
      checkout: "Checkout Summary",
      finalize: "Finalize & Print Invoice",
      payable: "Amount Payable"
    },
    kannada: {
       createBill: "ಹೊಸ ಬಿಲ್ ರಚಿಸಿ",
       searchPlaceholder: "ಔಷಧದ ಹೆಸರು ಅಥವಾ ಬ್ರಾಂಡ್ ಹುಡುಕಿ...",
       cart: "ಕಾರ್ಟ್ ಐಟಂಗಳು",
       checkout: "ಚೆಕ್ಔಟ್ ಸಾರಾಂಶ",
       finalize: "ಅಂತಿಮಗೊಳಿಸಿ ಮತ್ತು ಬಿಲ್ ಮುದ್ರಿಸಿ",
       payable: "ಅಂತಿಮ ಮೊತ್ತ"
    }
  };

  const text = t[language];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medSnap, custSnap] = await Promise.all([
          getDocs(collection(db, 'medicines')),
          getDocs(collection(db, 'customers'))
        ]);
        setMedicines(medSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medicine[]);
        setCustomers(custSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'medicines/customers');
      }
    };
    fetchData();
  }, []);

  const searchResults = (searchTerm || barcodeTerm) ? medicines.filter(m => {
    const matchesName = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarcode = barcodeTerm ? m.barcode === barcodeTerm : true;
    return (matchesName && matchesBarcode) && m.stock > 0;
  }) : [];

  // Auto-add if exact barcode match
  useEffect(() => {
    if (barcodeTerm) {
      const match = medicines.find(m => m.barcode === barcodeTerm);
      if (match) {
        addToCart(match);
        setBarcodeTerm('');
      }
    }
  }, [barcodeTerm, medicines]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const handleAiPrescriptionScan = async () => {
    setIsAiScanning(true);
    // Simulated OCR text from a "uploaded" prescription image
    const mockOcrText = "Patient: John Doe, Age: 45. Prescribed: Paracetamol 500mg - 1 tab thrice a day, Amoxicillin 250mg - 1 tab twice a day for 5 days.";
    
    try {
      const { analyzePrescription } = await import('../lib/gemini');
      const analysisJson = await analyzePrescription(mockOcrText);
      console.log("AI Analysis:", analysisJson);
      
      // Attempt to auto-add medicines based on analysis (simple string matching for now)
      const foundMedicines = medicines.filter(m => 
        mockOcrText.toLowerCase().includes(m.name.toLowerCase())
      );
      
      foundMedicines.forEach(med => addToCart(med));
      alert(`AI detected ${foundMedicines.length} medicines from the prescription and added them to cart.`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiScanning(false);
    }
  };

  const addToCart = (medicine: Medicine) => {
    const existingItem = cart.find(item => item.medicineId === medicine.id);
    if (existingItem) {
      if (existingItem.quantity < medicine.stock) {
        setCart(cart.map(item => 
          item.medicineId === medicine.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        medicineId: medicine.id!,
        name: medicine.name,
        quantity: 1,
        price: medicine.price,
        gstPercent: 12, // Default 12% GST
        discountPercent: 0,
        subtotal: medicine.price
      }]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.medicineId === medicineId) {
        const medicine = medicines.find(m => m.id === medicineId);
        const newQty = Math.max(1, Math.min(medicine?.stock || 0, item.quantity + delta));
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const gstAmount = subtotal * 0.12; 
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const finalAmount = subtotal + gstAmount - discount;

  const currentBillData: Omit<Bill, 'id'> = {
    billNumber: `INV-${Date.now().toString().slice(-6)}`,
    customerName: selectedCustomer?.name || 'Walk-in Customer',
    customerId: selectedCustomer?.id || null,
    customerPhone: selectedCustomer?.phone || '',
    items: cart,
    totalAmount: subtotal || 0,
    gstAmount: gstAmount || 0,
    cgstAmount: cgstAmount || 0,
    sgstAmount: sgstAmount || 0,
    discount: discount || 0,
    finalAmount: finalAmount || 0,
    paymentMethod: paymentMethod,
    staffId: auth.currentUser?.uid || 'anonymous',
    createdAt: serverTimestamp() as any
  };

  const handleSaveDraft = async () => {
    if (cart.length === 0) return;
    setIsSavingDraft(true);
    try {
      await addDoc(collection(db, 'draft_bills'), {
        cart,
        selectedCustomer: selectedCustomer?.id || null,
        createdAt: serverTimestamp(),
      });
      alert("Draft saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'upi' && !showQrModal) {
      setShowQrModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      await addDoc(collection(db, 'bills'), currentBillData);

      // Update Stock
      for (const item of cart) {
        await updateDoc(doc(db, 'medicines', item.medicineId), {
          stock: increment(-item.quantity)
        });
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399']
      });

      generateInvoice(currentBillData);
      
      // WhatsApp Sharing
      const whatsappMsg = encodeURIComponent(`Hi ${currentBillData.customerName},\nYour bill ${currentBillData.billNumber} from MediCart for ₹${currentBillData.finalAmount} is ready. View: ${window.location.origin}/bills/${currentBillData.billNumber}`);
      window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');

      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      alert(`Billing Completed Successfully! \nTransaction ID: TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bills/medicines');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoice = (bill: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("MediCart Invoice", 20, 20);
    doc.text("GST ID: 29AAAAA0000A1Z5", 20, 25);
    doc.setFontSize(10);
    doc.text(`Bill No: ${bill.billNumber}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    doc.text(`Customer: ${bill.customerName}`, 20, 45);
    if (bill.customerPhone) doc.text(`Phone: ${bill.customerPhone}`, 20, 50);

    let y = 65;
    doc.setFontSize(10);
    doc.text("Medicine Name", 20, y);
    doc.text("Qty", 100, y);
    doc.text("Price", 130, y);
    doc.text("GST", 155, y);
    doc.text("Total", 180, y);
    doc.line(20, y + 2, 190, y + 2);

    bill.items.forEach((item: any) => {
      y += 10;
      doc.text(item.name, 20, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(`Rs. ${item.price}`, 130, y);
      doc.text(`12%`, 155, y);
      doc.text(`Rs. ${item.subtotal}`, 180, y);
    });

    y += 20;
    doc.line(120, y, 190, y);
    doc.text(`Subtotal: Rs. ${bill.totalAmount}`, 130, y + 10);
    doc.text(`CGST (6%): Rs. ${bill.cgstAmount.toFixed(2)}`, 130, y + 20);
    doc.text(`SGST (6%): Rs. ${bill.sgstAmount.toFixed(2)}`, 130, y + 30);
    doc.text(`Discount: Rs. ${bill.discount}`, 130, y + 40);
    
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text(`Grand Total: Rs. ${bill.finalAmount.toLocaleString()}`, 130, y + 55);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Thank you for shopping at MediCart!", 105, y + 80, { align: 'center' });
    doc.text("This is an electronically generated invoice.", 105, y + 85, { align: 'center' });

    doc.save(`${bill.billNumber}.pdf`);
  };

  return (
    <div className="relative pb-12">
      {/* Background Decorative Bubble */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col xl:flex-row gap-8 max-w-[1600px] mx-auto min-h-[calc(100vh-140px)] relative z-10">
        {/* Left Column: Product Selection & Cart */}
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
              <ShoppingCart size={150} />
            </div>
            <div className="relative">
              <div className="flex flex-wrap justify-between items-start gap-8 mb-10">
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black tracking-tighter text-white mb-2"
                  >
                    {text.createBill}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 text-sm font-medium tracking-wide"
                  >
                    Process pharmaceutical transactions through the <span className="text-white font-bold">Secure Billing Engine</span>
                  </motion.p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5"
                >
                  <button 
                    onClick={() => setLanguage(l => l === 'english' ? 'kannada' : 'english')}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-white/5 shadow-xl"
                  >
                    {language === 'english' ? 'ಕನ್ನಡ' : 'English'}
                  </button>
                  <button 
                    onClick={handleAiPrescriptionScan}
                    className="flex items-center gap-3 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                  >
                    <Sparkles size={16} /> Medi-AI Scanner
                  </button>
                  <button 
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || cart.length === 0}
                    className="flex items-center gap-3 px-6 py-2.5 bg-slate-800/80 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 disabled:opacity-30"
                  >
                    <Save size={16} /> {isSavingDraft ? 'Saving...' : 'Save Draft'}
                  </button>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={22} />
                  <input 
                    type="text" 
                    placeholder={text.searchPlaceholder} 
                    className="w-full bg-white/5 border border-white/5 focus:border-emerald-500/50 rounded-2xl py-5 pl-16 pr-14 focus:ring-4 focus:ring-emerald-500/5 outline-none shadow-2xl transition-all text-xl font-bold text-white placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    onClick={() => alert("Voice assistant activated... (Listening for medicine names)")}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-500 p-2 transition-colors"
                  >
                    <Mic size={22} />
                  </button>
                  
                  {/* Search Suggestions */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-4 bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[60] py-3 overflow-hidden"
                      >
                        {searchResults.map((medicine, idx) => (
                          <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={medicine.id}
                            onClick={() => addToCart(medicine)}
                            className="w-full px-8 py-5 flex items-center justify-between hover:bg-emerald-500/10 transition-all border-b border-white/5 last:border-none group/item"
                          >
                            <div className="text-left flex items-center gap-5">
                              <div className="w-12 h-12 rounded-xl bg-white/5 group-hover/item:bg-emerald-500/20 flex items-center justify-center text-slate-500 group-hover/item:text-emerald-500 transition-colors border border-white/5">
                                <ShoppingCart size={20} />
                              </div>
                              <div>
                                <p className="font-black text-white uppercase tracking-tight text-base group-hover/item:text-emerald-400 transition-colors">{medicine.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1">{medicine.category} • <span className="text-emerald-500/60">{medicine.stock} IN STOCK</span></p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                              <span className="font-black text-2xl text-white tracking-tighter">₹{medicine.price}</span>
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 group-hover/item:bg-emerald-500 flex items-center justify-center text-emerald-500 group-hover/item:text-white transition-all shadow-lg scale-90 group-hover/item:scale-100">
                                <Plus size={20} strokeWidth={3} />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative group">
                  <Barcode className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={22} />
                  <input 
                    type="text" 
                    placeholder="Scan product barcode sequence..." 
                    className="w-full bg-white/5 border border-white/5 focus:border-emerald-500/50 rounded-2xl py-5 pl-16 pr-6 focus:ring-4 focus:ring-emerald-500/5 outline-none shadow-2xl transition-all text-xl font-bold text-white placeholder:text-slate-600"
                    value={barcodeTerm}
                    onChange={(e) => setBarcodeTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cart Listing */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-0 overflow-hidden shadow-2xl flex-1 flex flex-col border-white/5"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="font-black uppercase tracking-[0.25em] text-[10px] text-slate-500 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ShoppingCart size={14} className="text-emerald-500" />
                </div>
                Active Transaction Ledger ({cart.length} Items)
              </h3>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {cart.length === 0 ? (
                <div className="py-32 text-center flex flex-col items-center gap-8 opacity-20">
                  <div className="relative w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-500 border border-white/5 shadow-2xl">
                    <ShoppingCart size={64} strokeWidth={1} />
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-slate-900 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white tracking-widest uppercase">Cart Empty</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-2">Initialize scan to populate billing data</p>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                      <th className="px-10 py-6">Pharma Description</th>
                      <th className="px-10 py-6">Metric/Qty</th>
                      <th className="px-10 py-6">Unit Price</th>
                      <th className="px-10 py-6">GST (%)</th>
                      <th className="px-10 py-6">Total Value</th>
                      <th className="px-10 py-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {cart.map((item) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={item.medicineId}
                          className="group hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-10 py-8">
                            <div className="flex flex-col">
                              <span className="font-black text-white uppercase tracking-tight text-base leading-none mb-2">{item.name}</span>
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.1em]">Molecular UID: {item.medicineId.slice(-8)}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-3 bg-white/5 w-fit p-1.5 rounded-2xl border border-white/10 shadow-inner group-hover:border-emerald-500/30 transition-colors">
                              <button 
                                onClick={() => updateQuantity(item.medicineId, -1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all border border-white/5"
                              >
                                <Minus size={16} strokeWidth={3} />
                              </button>
                              <span className="w-10 text-center font-black text-lg text-white tabular-nums">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.medicineId, 1)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-500 transition-all border border-white/5"
                              >
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            </div>
                          </td>
                          <td className="px-10 py-8 font-black text-slate-400 text-sm">₹{item.price}</td>
                          <td className="px-10 py-8 font-black text-emerald-500/50 text-sm">{item.gstPercent}%</td>
                          <td className="px-10 py-8 font-black text-white text-2xl tracking-tighter">₹{item.subtotal.toLocaleString()}</td>
                          <td className="px-10 py-8 text-center">
                            <button 
                              onClick={() => removeFromCart(item.medicineId)}
                              className="p-4 text-slate-600 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5 shadow-lg active:scale-90"
                            >
                              <Trash2 size={20} strokeWidth={2.5} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Order Summary (Sidebar Card) */}
        <div className="w-full xl:w-[420px]">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-10 shadow-2xl flex flex-col h-fit sticky top-24 border-emerald-500/20 overflow-hidden"
          >
            {/* Visual bg gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 blur-[80px] rounded-full" />

            <div className="flex justify-between items-center mb-12 relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                Billing Summary
              </h3>
              <div className="w-12 h-12 bg-white/5 border border-white/5 text-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Printer size={22} />
              </div>
            </div>

            {/* Customer Selection */}
            <div className="mb-10 relative z-10">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25rem] mb-5 px-1">Receiver Protocol</p>
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className={cn(
                  "w-full rounded-3xl p-6 flex items-center justify-between group transition-all text-left border-2",
                  selectedCustomer 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : "border-white/5 bg-white/5 hover:border-emerald-500/30 hover:bg-white/[0.08] shadow-xl"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl border border-white/5",
                    selectedCustomer ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500 group-hover:text-emerald-500"
                  )}>
                    <UserPlus size={32} />
                  </div>
                  <div>
                    <p className="font-black text-lg text-white uppercase tracking-tight">{selectedCustomer ? selectedCustomer.name : 'Walk-in Personnel'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {selectedCustomer ? selectedCustomer.phone : 'Anonymous Identification'}
                    </p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} />
                </div>
              </button>
            </div>

            {/* Payment Method */}
            <div className="mb-10 relative z-10">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.25rem] mb-5 px-1">Settlement Mode</p>
              <div className="grid grid-cols-3 gap-4">
                {(['cash', 'upi', 'card'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "p-5 rounded-[2rem] flex flex-col items-center justify-center gap-4 border-2 transition-all group/method hover:scale-105",
                      paymentMethod === method 
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]" 
                        : "border-white/5 text-slate-500 bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      paymentMethod === method ? "bg-emerald-500 text-white rotate-6 scale-110 shadow-2xl" : "bg-white/5 group-hover/method:bg-white/10"
                    )}>
                      {method === 'cash' && <CreditCard size={24} />}
                      {method === 'upi' && <QrCode size={24} />}
                      {method === 'card' && <CreditCard size={24} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-6 pt-10 border-t border-white/5 bg-white/[0.02] -mx-10 px-10 pb-6 relative z-10">
              <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] px-1">
                <span>Gross Accumulation</span>
                <span className="text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Medical Surcharge</span>
                  <span className="text-[9px] text-slate-600 font-black tracking-widest mt-1">CGST [6%] + SGST [6%]</span>
                </div>
                <span className="text-white font-black text-sm">₹{gstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Applied Credits</span>
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-black text-sm">−</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-xs font-black">₹</span>
                    <input 
                      type="number" 
                      className="w-32 bg-slate-900/50 border border-red-500/20 rounded-xl py-2 pl-7 pr-4 text-right font-black text-red-500 focus:ring-2 focus:ring-red-500/50 outline-none shadow-inner"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-10 mt-6 border-t border-white/10 flex justify-between items-end px-1">
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3">Total Payable Asset</p>
                  <div className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">₹{finalAmount.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black tracking-widest border border-emerald-500/20">
                    <Scan size={12} strokeWidth={3} /> AUTH_SECURE
                  </div>
                  {paymentMethod === 'upi' && <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Scan & Protocol</div>}
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-emerald-600 text-white font-black py-6 rounded-3xl hover:bg-emerald-500 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.2)] disabled:opacity-30 disabled:cursor-not-allowed mt-10 active:scale-[0.98] flex items-center justify-center gap-4 text-xl uppercase tracking-[0.2em] relative overflow-hidden group/final"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/final:translate-x-full transition-transform duration-1000" />
                {isProcessing ? (
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin transition-colors"></div>
                ) : (
                  <>COMMIT & PRINT <Printer size={26} strokeWidth={2.5} /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-8 py-6">
                <button 
                  onClick={() => cart.length > 0 && generateInvoice(currentBillData)}
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/btn"
                >
                  <Download size={16} className="group-hover/btn:-translate-y-0.5 transition-transform" /> ARCHIVE_PDF
                </button>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                <button 
                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/btn"
                  onClick={() => {
                     if (cart.length === 0) return;
                     const whatsappMsg = encodeURIComponent(`MediCart Protocol Invoice: ₹${finalAmount.toLocaleString()}`);
                     window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
                  }}
                >
                  <Share2 size={16} className="group-hover/btn:rotate-12 transition-transform" /> COMM_WHATSAPP
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Customer Selection Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 border border-slate-200 dark:border-slate-800 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsCustomerModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
              <h3 className="text-xl font-bold mb-6">Select Customer</h3>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                <button 
                  onClick={() => { setSelectedCustomer(null); setIsCustomerModalOpen(false); }}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-transparent hover:border-emerald-200 transition-all"
                >
                  <p className="font-bold">Walk-in Customer</p>
                  <p className="text-xs text-slate-500">Universal Guest</p>
                </button>
                {filteredCustomers.map(customer => (
                  <button 
                    key={customer.id}
                    onClick={() => { setSelectedCustomer(customer); setIsCustomerModalOpen(false); }}
                    className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-all"
                  >
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-xs text-slate-500">{customer.phone}</p>
                  </button>
                ))}
              </div>

              <button 
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Register New Customer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Scanning Overlay */}
      <AnimatePresence>
        {isAiScanning && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-950 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Analyzing Prescription...</h3>
                <p className="text-slate-500">Identifying medicines and instructions using Medi-AI.</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowQrModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <Plus size={24} className="rotate-45" />
              </button>
              <h3 className="text-2xl font-black mb-2">UPI QR Payment</h3>
              <p className="text-slate-500 text-sm mb-8">Scan the code below to pay ₹{finalAmount.toLocaleString()}</p>
              
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 shadow-inner mb-8 flex justify-center">
                <QrCode size={200} className="text-slate-900" />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setShowQrModal(false); handleCheckout(); }}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 dark:shadow-none"
                >
                  PAYMENT RECEIVED
                </button>
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
