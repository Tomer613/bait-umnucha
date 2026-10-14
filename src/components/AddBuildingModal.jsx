// ==========================================================================
// בית ומנוחה - מודל הוספת בניין חדש (16+) עם הקצאת חותמת צבע
// ==========================================================================
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BUILDING_COLOR_PALETTE } from '../data/initialData';
import { Building2, X } from 'lucide-react';

export default function AddBuildingModal({ isOpen, onClose }) {
  const { buildings, addBuilding } = useApp();

  const nextColorIndex = (buildings?.length || 0) % BUILDING_COLOR_PALETTE.length;
  const [selectedColor, setSelectedColor] = useState(BUILDING_COLOR_PALETTE[nextColorIndex]);

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
      initialBalance: parseFloat(initialBalance) || 0,
      color: selectedColor
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

          {/* בחירת חותמת צבע ייחודית לבניין */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-800)' }}>
              חותמת צבע ייחודית לבניין (מזהה ויזואלי בממשק):
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 10px', background: 'var(--color-cream-subtle)', borderRadius: 'var(--radius-sm)' }}>
              {BUILDING_COLOR_PALETTE.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setSelectedColor(pal)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: pal.primary,
                    border: selectedColor.id === pal.id ? '3px solid #231812' : '2px solid #FFFFFF',
                    boxShadow: selectedColor.id === pal.id ? '0 0 0 2px var(--color-gold-500)' : '0 1px 3px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transform: selectedColor.id === pal.id ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                  title={pal.name}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: selectedColor.primary, marginTop: 4, fontWeight: 700 }}>
              ● נבחר: {selectedColor.name} (סרגלים, כפתורים והדגשות יקבלו גוון זה)
            </div>
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
                קוד בניין בחיובית (אם קיים):
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
              הקם בניין והקצה חותמת צבע
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
