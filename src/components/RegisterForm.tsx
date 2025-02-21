import React, { useState } from 'react';

interface RegisterFormProps {
  onRegister: (username: string, password: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    onRegister(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor="register-username" 
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
        >
          Username
        </label>
        <input
          id="register-username"
          type="text"
          style={{
            width: '100%',
            boxSizing: 'border-box',
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

      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor="register-password" 
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
        >
          Password
        </label>
        <input
          id="register-password"
          type="password"
          style={{
            width: '100%',
            boxSizing: 'border-box',
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

      <div style={{ marginBottom: '1rem' }}>
        <label 
          htmlFor="register-confirm" 
          style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}
        >
          Confirm Password
        </label>
        <input
          id="register-confirm"
          type="password"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          background: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;
