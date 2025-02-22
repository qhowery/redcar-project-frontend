import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import QuestionForm from './components/QuestionForm';
import ChatHistory from './components/ChatHistory';

interface HistoryItem {
  question: string;
  answer: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [socket, setSocket] = useState<any>(null);
  const [streamMessages, setStreamMessages] = useState<string[]>([]);
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
  
          if (!response.ok) throw new Error('Session expired');
  
          const userData = await response.json();
          setUser(userData);
        } catch (err) {
          console.error('Session check failed:', err);
          localStorage.removeItem('access_token');
          setToken(null);
        }
      }
    };
  
    fetchUser();
  }, [token]);

  useEffect(() => {
    if (token) {
      const newSocket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      setSocket(newSocket);

      newSocket.on('serverMessage', (message: string) => {
        console.log('Received streaming message:', message);
        setStreamMessages((prev: string[]) => [...prev, message]);
      });

      return () => {
        newSocket.off('serverMessage');
        newSocket.disconnect();
      };
    }
  }, [token]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      alert(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      

      if (!response.ok) throw new Error('Registration failed');

      alert('Registration successful! You can now log in.');
      setAuthMode('login');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('access_token');
    setUser(null);
    setToken(null);
  };

  const handleQuestionSubmit = async (question: string) => {
    try {
      setError('');
      setResult('');
      setStreamMessages([]);
  
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
  
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let answer = '';
  
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setStreamMessages(prev => [...prev, chunk]);
        answer += chunk;
      }
  
      setResult(answer);
      setHistory(prev => [...prev, { question, answer }]);

      // Clear the stream messages immediately after the response is fully processed
      setStreamMessages([]);
  
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.name === 'AbortError'
        ? 'Request timed out'
        : err.message || 'Failed to get answer');
    }
  };

  const fetchLatestMessage = async () => {
    try {
      const response = await fetch(`${API_URL}/latest-message`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStreamMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Error fetching latest message:', err);
    }
  };

  // Fetch new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (token) fetchLatestMessage();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // If not logged in, show login/register
  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f8f9fa',
        }}
      >
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '2rem',
            width: '320px',
            background: '#fff',
          }}
        >
          {authMode === 'login' ? (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Login</h2>
              <LoginForm onLogin={handleLogin} />
              <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Register here
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Register</h2>
              <RegisterForm onRegister={handleRegister} />
              <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Login here
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // If logged in, show main app
  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '1rem' }}>
      {/* Logout button in the top-right corner */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#f8f9fa',
          }}
        >
          Logout
        </button>
      </div>

      <h1 style={{ marginTop: 0 }}>Company Question Answering</h1>
      <QuestionForm onSubmit={handleQuestionSubmit} />

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <section style={{ marginTop: '1rem' }}>
        <h2>Latest Answer</h2>
        <p>{result}</p>
      </section>

      <ChatHistory history={history} />

      <div style={{ marginTop: '1rem' }}>
        <h2>Streaming Messages</h2>
        <ul>
          {streamMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
