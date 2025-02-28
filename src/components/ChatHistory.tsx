import React from 'react';
import { HistoryItem } from '../types';

interface ChatHistoryProps {
  history: HistoryItem[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ history }) => {
  return (
    <div>
      {history.map((item, index) => (
        <div key={index}>
          <p><strong>Q:</strong> {item.question}</p>
          <p><strong>A:</strong> {item.answer}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;