import React from 'react';

import './ControlPanel.css';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  playbackEnabled: boolean;
  onPlaybackToggle: (enabled: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isOpen,
  onClose,
  playbackEnabled,
  onPlaybackToggle,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="control-panel-overlay" onClick={onClose} />
      <div className="control-panel">
        <div className="control-panel-header">
          <h2 className="control-panel-title">设置</h2>
          <button className="control-panel-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="control-panel-content">
          <div className="control-panel-item">
            <label className="control-panel-label">
              <span className="control-panel-label-text">声音回放</span>
              <span className="control-panel-label-desc">播放你录制的语音</span>
            </label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={playbackEnabled}
                onChange={(e) => onPlaybackToggle(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

