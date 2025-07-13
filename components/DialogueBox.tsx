'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'player' | 'npc';
  text: string;
}

interface DialogueBoxProps {
  history: Message[];
  onSendMessage: (message: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const DialogueBox = ({ history, onSendMessage, onClose, isLoading }: DialogueBoxProps) => {
  const [playerInput, setPlayerInput] = useState('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  // 会話が更新されたら一番下までスクロールする
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerInput.trim() || isLoading) return;
    onSendMessage(playerInput);
    setPlayerInput('');
  };

  return (
    <div style={styles.dialogueBox}>
      <button onClick={onClose} style={styles.closeButton}>×</button>
      <div style={styles.historyContainer}>
        {history.map((msg, index) => (
          <div key={index} style={msg.sender === 'player' ? styles.playerMsg : styles.npcMsg}>
            <p><strong>{msg.sender === 'player' ? 'あなた' : 'NPC'}:</strong> {msg.text}</p>
          </div>
        ))}
        {isLoading && <p style={styles.npcMsg}><em>（考えています...）</em></p>}
        <div ref={historyEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          style={styles.input}
          placeholder="メッセージを入力..."
          disabled={isLoading}
        />
        <button type="submit" style={styles.button} disabled={isLoading}>
          送信
        </button>
      </form>
    </div>
  );
};

// スタイル定義を更新
const styles: { [key: string]: React.CSSProperties } = {
  dialogueBox: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: '760px', // Canvasの幅に合わせる
    height: '180px',
    backgroundColor: 'rgba(44, 44, 44, 0.9)', // 少し濃いめの背景色
    border: '2px solid #ddd',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
  },
  historyContainer: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '15px',
    paddingRight: '10px', // スクロールバーのためのスペース
  },
  playerMsg: {
    textAlign: 'right',
    marginBottom: '8px',
    color: '#a9d1ff', // プレイヤーのテキスト色
  },
  npcMsg: {
    textAlign: 'left',
    marginBottom: '8px',
    color: '#e0e0e0', // NPCのテキスト色
  },
  form: {
    display: 'flex',
  },
  input: {
    flex: 1,
    padding: '10px',
    marginRight: '10px',
    borderRadius: '5px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '16px',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  },
  closeButton: {
    position: 'absolute',
    top: '5px',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
  },
};

export default DialogueBox;