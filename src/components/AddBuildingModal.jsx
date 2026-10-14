// ==========================================================================
// בית ומנוחה - מודל הוספת בניין חדש (16+) עם הקצאת חותמת צבע
// ==========================================================================
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BUILDING_COLOR_PALETTE } from '../data/initialData';
import { X, AlertCircle } from 'lucide-react';
import { BuildingAvatar } from './ui';

export default function AddBuildingModal({ isOpen, onClose }) {
  const { buildings, addBuilding } = useApp();

  const nextColorIndex = (buildings?.length || 0) % BUILDING_COLOR_PALETTE.length;
  const [selectedColor, setSelectedColor] = useState(BUILDING_COLOR_PALETTE[nextColorIndex]);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [hiyuvitCode, setHiyuvitCode] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [errorMsg, setErrorMsg] = useState('');

  // איפוס שדות בכל פעם שהחלונית נפתחת מחדש
  useEffect(() => {
    if (isOpen) {
      setName('');
      setAddress('');
      setBankAccount('');
      setHiyuvitCode('');
      setInitialBalance('0');
      setErrorMsg('');
      const colorIdx = (buildings?.length || 0) % BUILDING_COLOR_PALETTE.length;
      setSelectedColor(BUILDING_COLOR_PALETTE[colorIdx]);
    }
  }, [isOpen, buildings?.length]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('אנא הזן את שם הבניין (שדה חובה)');
      return;
    }

    addBuilding({
      name: name.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      hiyuvitCode: hiyuvitCode.trim(),
      initialBalance: parseFloat(initialBalance) || 0,
      color: selectedColor
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
            {/* תצוגה חיה של שלט הבניין */}
            <BuildingAvatar name={name.trim() || '?'} color={selectedColor} size="lg" />
            <div>
              <h3 className="modal-title">בניין חדש</h3>
              <p className="modal-sub">{name.trim() || 'השלט מתעדכן לפי שם הבניין והצבע'}</p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="סגירה">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#DC2626',
              fontSize: '0.87rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
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
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
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
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-brown-800)' }}>
              צבע השלט · {selectedColor.name}
            </label>
            <div className="swatch-grid">
              {BUILDING_COLOR_PALETTE.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  title={pal.name}
                  className={`swatch${selectedColor.id === pal.id ? ' is-selected' : ''}`}
                  onClick={() => setSelectedColor(pal)}
                >
                  <BuildingAvatar name={name.trim() || '?'} color={pal} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
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
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
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
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
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
              הקמת הבניין
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
