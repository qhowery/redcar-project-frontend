import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Username Field */}
      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor="login-username" 
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
        >
          Username
        </label>
        <input
          id="login-username"
          type="text"
          style={{
            width: '100%',
            boxSizing: 'border-box', // Ensures total width includes padding/border
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      {/* Password Field */}
      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor="login-password" 
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          style={{
            width: '100%',
            boxSizing: 'border-box', // Same here
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '0.75rem',
          fontSize: '1rem',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
