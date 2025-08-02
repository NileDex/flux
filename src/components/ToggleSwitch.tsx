// ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  label?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, onToggle, label }) => {
  return (
    <div className="toggle-switch-container">
      {label && <span className="toggle-label">{label}</span>}
      <button
        className={`toggle-switch ${isOn ? 'on' : 'off'}`}
        onClick={onToggle}
        aria-label={label || 'Toggle'}
      >
        <div className="toggle-switch-handle" />
      </button>
    </div>
  );
};

export default ToggleSwitch;