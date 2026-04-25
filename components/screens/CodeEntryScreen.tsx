import React, { useState, useEffect } from 'react';

interface CodeEntryScreenProps {
  isActive: boolean;
  code: string;
  setCode: (code: string) => void;
  onSuccess: (code: string) => void;
  hasError: boolean;
  isLoading: boolean;
}

export const CodeEntryScreen: React.FC<CodeEntryScreenProps> = ({ 
    onSuccess, 
    isActive, 
    code, 
    setCode, 
    hasError,
    isLoading 
}) => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (hasError) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  const handleNumClick = (val: string) => {
    if (isLoading) return;
    if (val === 'del') {
      setCode(code.slice(0, -1));
    } else if (code.length < 6) {
      setCode(code + val);
    }
  };

  const handleSubmit = () => {
    if (code.length !== 6 || isLoading) return;
    onSuccess(code);
  };

  useEffect(() => {
    if (!isActive) {
      const timer = setTimeout(() => {
        setCode('');
        setIsShaking(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isActive, setCode]);

  return (
    <div 
        className={`screen code-entry-wrap ${isActive ? 'visible' : ''}`}
        style={{ display: isActive ? 'flex' : 'none', width: '100%', height: '100%' }}
    >
      <div className="keypad-layout">
        <div className="input-display-area">
          <div className="entry-instruction">
            <h2>Enter Your Mimo <br /> Code Here</h2>
            <p>Enter your 6-digit code provided to you.</p>
          </div>
          <div className={`slots-container ${isShaking ? 'shake error' : ''}`}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`code-slot ${i === code.length && !isShaking ? 'active' : ''} ${i < code.length ? 'filled' : ''} ${isShaking ? 'error-box' : ''}`}
                style={isShaking ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' } : {}}
              >
                {code[i] || ''}
              </div>
            ))}
          </div>
        </div>
        <div className="modern-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button key={num} className="num-btn" onClick={() => handleNumClick(num)} disabled={isLoading}>{num}</button>
          ))}

          <button className="num-btn accent-red" onClick={() => handleNumClick('del')} disabled={isLoading}>
            <span className="material-symbols-outlined">backspace</span>
          </button>
          <button className="num-btn" onClick={() => handleNumClick('0')} disabled={isLoading}>0</button>
          <button
            className={`num-btn submit-btn ${code.length === 6 && !isLoading ? 'ready' : ''}`}
            onClick={handleSubmit}
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
                <div className="loader-ring" style={{ width: '40px', height: '40px' }}></div>
            ) : (
                <span className="material-symbols-outlined">check</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};