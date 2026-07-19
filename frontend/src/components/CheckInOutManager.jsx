import React, { useState } from 'react';
import { ClipboardCheck, LogOut } from 'lucide-react';
import CheckInManager from './CheckInManager';
import CheckOutManager from './CheckOutManager';
import Toast from './shared/Toast';

export default function CheckInOutManager() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  return (
    <div className="space-y-6">
      <Toast {...toast} onClose={() => setToast((current) => ({ ...current, message: '' }))} />

      <section id="checkin-checkout-workflow">
        <div className="mb-4 flex gap-2 rounded-xl bg-stone-100 p-1">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 rounded-lg px-4 py-2 font-bold ${
              activeTab === 'checkin' ? 'bg-white text-[#9b7d3f] shadow' : 'text-slate-500'
            }`}
          >
            <ClipboardCheck className="mr-2 inline" size={17} />
            Check-in
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`flex-1 rounded-lg px-4 py-2 font-bold ${
              activeTab === 'checkout' ? 'bg-white text-[#9b7d3f] shadow' : 'text-slate-500'
            }`}
          >
            <LogOut className="mr-2 inline" size={17} />
            Check-out
          </button>
        </div>

        {activeTab === 'checkin' ? <CheckInManager /> : <CheckOutManager />}
      </section>
    </div>
  );
}
