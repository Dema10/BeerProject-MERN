import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import { Container } from 'react-bootstrap';
import NavBar from './components/NavBar';

function App() {

  return (
    <>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavBar />
          <Container>
            <Routes>
              <Route index element={ <Home /> } />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
            </Routes>
          </Container>
        </div>
      </BrowserRouter>
    </>
  )
}

export default App
