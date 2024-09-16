import { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getUserData } from '../services/api';
import { BoxArrowRight, Person, PersonGear } from "react-bootstrap-icons";
import Cart from './Cart';

export default function NavBar() {
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
  
    useEffect(() => {
      const checkLoginStatus = async () => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userData = await getUserData();
            setUser(userData);
            setIsLoggedIn(true);
          } catch (err) {
            console.error("Token non trovato", err);
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      };
  
      checkLoginStatus();
  
      window.addEventListener("storage", checkLoginStatus);
  
      return () => {
        window.removeEventListener("storage", checkLoginStatus);
      };
    }, []);
  
    const handleLogout = () => {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUser(null);
      navigate("/");
    };

  return (
    <Navbar className="py-3" bg="dark" variant="dark" expand="lg" data-custom-border>
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/">Brewery App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            {isLoggedIn && user && user.role !== 'admin' && (
              <Nav.Link as={Link} to="/dashboard">My Dashboard</Nav.Link>
            )}
            {user && user.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/admin/new-product">Aggiungi stock</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isLoggedIn && user && user.role !== 'admin' && <Cart />}
            {isLoggedIn ? (
              <NavDropdown 
                title={
                  <Image 
                    src={user.avatar}
                    roundedCircle 
                    style={{ width: '35px', height: '35px' }} 
                  />
                }
                menuVariant="dark"
                align="end"
              >
                <div className="d-flex">
                  <div className="m-2 ms-3">
                    <img src={user.avatar} alt={user.name} style={{width: '50px', height: '50px'}}/>
                  </div>
                  <div className="m-2 me-3">
                    <h5 className="mb-0 text-nowrap">{user.name} {user.surname}</h5>
                    <p className="mb-0 opacity-50">{user.email}</p>
                  </div>
                </div>
                <NavDropdown.Divider style={{borderTopColor:"#00ff84"}}/>
                <div className="d-flex flex-column">
                  <Link to="/profile" className="custom-link text-decoration-none ps-2 my-2">
                    <Person className="pb-1 fs-5" /> Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin/settings" className="custom-link text-decoration-none ps-2 mt-2 mb-2">
                      <PersonGear className="pb-1 fs-5" /> Users Settings
                    </Link>
                  )}
                </div>
                <NavDropdown.Divider style={{borderTopColor:"#00ff84"}}/>
                <button onClick={handleLogout} className="btn btn-outline-light ms-2 my-1">
                  Logout <BoxArrowRight className="pb-1 fs-5" />
                </button>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}