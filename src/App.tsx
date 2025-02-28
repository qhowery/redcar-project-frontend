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

  // Profile endpoint
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
          // Load user's history from backend
          setHistory(userData.history || []);
        } catch (err) {
          console.error('Session check failed:', err);
          localStorage.removeItem('access_token');
          setToken(null);
          setHistory([]); // Clear history on session failure
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

  // Login endpoint
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

  // Registration endpoint
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
    setHistory([]); // Clear history on logout
    setStreamMessages([]);
  };

  const handleQuestionSubmit = async (question: string) => {
    try {
      setError('');
      setResult('');
      setStreamMessages([]);
      let answer = '';
  
      // Clear previous stream messages and show initial processing message
      setStreamMessages(['Processing your question...']);
  
      // Temporary array to buffer messages until processing completes
      let tempMessages: string[] = [];
  
      const messageListener = (message: string) => {
        if (message === 'Processing your question...') return;
        
        tempMessages.push(message);
        answer += message;
        
        // Update UI in real-time
        setStreamMessages(prev => [...prev, message]);
        setResult(answer);
      };
  
      // Add WebSocket listener
      socket.on('serverMessage', messageListener);
  
      // Send question to backend
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      // Final processing after request completes
      setHistory(prev => [...prev, { question, answer }]);
      
      // Clear streaming messages after 1 second to allow final updates
      setTimeout(() => {
        setStreamMessages([]);
        setResult(answer); // Ensure final answer persists
      }, 1000);
  
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.name === 'AbortError' 
        ? 'Request timed out'
        : err.message || 'Failed to get answer');
    } finally {
      // Clean up WebSocket listener
      socket.off('serverMessage');
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
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header Section */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: '2rem',
          color: '#2d3436',
          flexGrow: 1
        }}>Company QA Assistant</h1>
      <button
        onClick={handleLogout}
        style={{
          padding: '0.75rem 1.5rem',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6c5ce7, #a8a4e6)',
          color: 'white',
          fontWeight: '600',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        Logout
      </button>
      <style>
        {`
          button:hover {
            transform: scale(1.02);
            opacity: 0.9;
          }
          
          @media (hover: hover) {
            button:hover {
              transform: scale(1.02);
              opacity: 0.9;
            }
          }
        `}
      </style>
      </div>

      <main style={{ 
        marginTop: '80px',
        display: 'grid',
        gap: '2rem',
        gridTemplateColumns: '1fr 300px',
        alignItems: 'start'
      }}>
        {/* Main Chat Area */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <QuestionForm onSubmit={handleQuestionSubmit} />
          
          {error && (
            <div style={{ 
              color: '#e74c3c',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#fdeded',
              margin: '1.5rem 0'
            }}>
              {error}
            </div>
          )}

          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.25rem',
              color: '#2d3436',
              marginBottom: '1rem'
            }}>Latest Response</h2>
            <div style={{ 
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              minHeight: '150px',
              lineHeight: '1.6'
            }}>
              {result}
            </div>
          </section>

          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.25rem',
              color: '#2d3436',
              marginBottom: '1rem'
            }}>Live Stream</h2>
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #eee',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {streamMessages.map((msg, index) => (
                <div key={index} style={{
                  padding: '0.5rem',
                  margin: '0.25rem 0',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  animation: 'fadeIn 0.3s ease-in'
                }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        <aside style={{ 
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          height: 'calc(100vh - 180px)',
          overflowY: 'auto'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem',
            color: '#2d3436',
            marginBottom: '1.5rem',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            padding: '0.5rem 0'
          }}>Chat History</h2>
          <ChatHistory history={[...history].reverse()} /> {/* Reverse for latest first */}
        </aside>
      </main>

      {/* Add some global styles */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            min-height: 120px;
            resize: vertical;
            transition: border-color 0.2s;
          }
          
          textarea:focus {
            outline: none;
            border-color: #6c5ce7;
          }
          
          button[type="submit"] {
            background: linear-gradient(135deg, #6c5ce7, #a8a4e6);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: transform 0.2s;
            margin-top: 1rem;
          }
          
          button[type="submit"]:hover {
            transform: scale(1.02);
          }
        `}
      </style>
    </div>
  );
};

export default App;
