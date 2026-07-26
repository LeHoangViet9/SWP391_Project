import React from 'react';

export default function UnauthorizedPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>403 - Access Denied</h1>
      <p>You do not have permission to access this page.</p>
      <a href="/" style={{ color: '#003580', textDecoration: 'underline' }}>Back to Home</a>
    </div>
  );
}
