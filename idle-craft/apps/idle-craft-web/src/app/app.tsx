import { Route, Routes, Link } from 'react-router-dom';
import { Button } from 'antd';
import { HomePage } from '../pages/HomePage';
import { SignInPage } from '../pages/SignInPage';

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage />
        }
      />
      <Route
        path="/sign-in"
        element={
          <SignInPage />
        }
      />
    </Routes>
  );
}

export default App;
