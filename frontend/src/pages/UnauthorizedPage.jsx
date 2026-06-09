import React from 'react';

export default function UnauthorizedPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>403 - Không có quyền truy cập</h1>
      <p>Bạn không có quyền truy cập vào trang này.</p>
      <a href="/" style={{ color: '#003580', textDecoration: 'underline' }}>Quay lại Trang chủ</a>
    </div>
  );
}
