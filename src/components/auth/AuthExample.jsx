import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import AuthForm from './AuthForm';

// Example usage component showing how to integrate AuthForm with AuthContext
const AuthExample = () => {
  return (
    <AuthProvider>
      <div className="app">
        <AuthForm />
      </div>
    </AuthProvider>
  );
};

export default AuthExample; 