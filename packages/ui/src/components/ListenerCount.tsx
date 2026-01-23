import React from 'react';

import './ListenerCount.css';

interface ListenerCountProps {
  count: number;
}

export const ListenerCount: React.FC<ListenerCountProps> = ({ count }) => {
  return (
    <div className="listener-count">
      此刻有 <span className="count-number">{count}</span> 人听到了你的声音
    </div>
  );
};

