// ==========================================================================
// בית ומנוחה - מודל הוספת בניין חדש (16+)
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, X } from 'lucide-react';

export default function AddBuildingModal({ isOpen, onClose }) {
  const { addBuilding } = useApp();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [hiyuvitCode, setHiyuvitCode] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addBuilding({
      name: name.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      hiyuvitCode: hiyuvitCode.trim(),
      initialBalance: parseFloat(initialBalance) || 0
    });

    onClose();
    setName('');
    setAddress('');
    setBankAccount('');
    setHiyuvitCode('');
    setInitialBalance('0');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={22} color="var(--color-gold-500)" />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brown-900)' }}>
              הקמת בניין חדש במערכת
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="var(--color-brown-500)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
              שם הבניין:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="למשל: בבלי 50 / רבינא 3"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
              כתובת מלאה:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
              placeholder="למשל: רחוב בבלי 50, ירושלים"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                פרטי חשבון בנק:
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="input"
                placeholder="למשל: הפועלים 12-740-998877"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                קוד חיובית (אם קיים):
              </label>
              <input
                type="text"
                value={hiyuvitCode}
                onChange={(e) => setHiyuvitCode(e.target.value)}
                className="input"
                placeholder="למשל: 674"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
              יתרת פתיחה בחשבון (₪):
            </label>
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              ביטול
            </button>
            <button type="submit" className="btn btn-primary">
              הקם בניין והתחל לעבוד
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
