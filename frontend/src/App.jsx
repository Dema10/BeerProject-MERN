import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Home from './pages/Home';
import { Container } from 'react-bootstrap';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import NewProductStock from './pages/NewProductStock';
import Dashboard from './pages/Dashboard';

function App() {

  return (
    <>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavBar />
          <Container>
            <Routes>
              <Route index element={<Home /> } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/new-product" element={<NewProductStock />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Container>
          <Footer />
        </div>
      </BrowserRouter>
    </>
  )
}

export default App
