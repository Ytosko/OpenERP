'use client';

import React, { useState } from 'react';
import { Share2, MessageSquare, Smartphone, QrCode, Copy, Check } from 'lucide-react';

export interface DigitalReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  totalAmount: number;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  totalAmount,
}) => {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/invoices?ref=${invoiceNumber}`;
  const messageText = `Thank you for your purchase! View digital receipt for invoice ${invoiceNumber} ($${totalAmount.toFixed(
    2
  )}): ${publicUrl}`;

  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    messageText
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono text-xs">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-slate-900">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Share2 className="w-4 h-4 text-brand-500" /> DIGITAL RECEIPT SHARING
          </h3>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
          <div className="text-[10px] text-slate-500">INVOICE NUMBER</div>
          <div className="font-bold text-sm text-brand-600">{invoiceNumber}</div>
          <div className="text-[10px] text-slate-600">Total: ${totalAmount.toFixed(2)}</div>
        </div>

        {/* Send via WhatsApp / SMS */}
        <div>
          <label className="text-slate-500 block mb-1">CUSTOMER PHONE NUMBER</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="flex-1 p-2 border border-slate-300 rounded outline-none focus:border-brand-500"
            />
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-emerald-600 text-white font-bold rounded flex items-center gap-1 cursor-pointer shrink-0"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* QR Code Customer Instant Scan */}
        <div className="text-center p-3 bg-slate-100 rounded-lg border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 mb-1">SCAN QR CODE TO VIEW ON MOBILE</div>
          <div className="w-24 h-24 bg-slate-950 text-white text-[8px] font-bold mx-auto flex items-center justify-center p-2 rounded">
            [RECEIPT-QR]
          </div>
        </div>

        {/* Copy Share Link */}
        <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded">
          <span className="truncate text-[10px] text-slate-600 flex-1 pr-2">{publicUrl}</span>
          <button
            onClick={handleCopy}
            className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
