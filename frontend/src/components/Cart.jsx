import { useState, useEffect } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { Cart as CartIcon } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { getCart } from '../services/api';
import '../Spinner.css';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const cartData = await getCart();
        setCart(cartData);
        setError(null);
      } catch (error) {
        console.error('Errore nel recupero del carrello:', error);
        setError('Errore nel caricamento del carrello');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  if (loading) {
    return <div className="spinnercart"></div>;
  }

  if (error) {
    return <span className="text-danger">!</span>;
  }

  const itemCount = cart && cart.items ? cart.items.length : 0;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" id="dropdown-cart" className="text-light">
        <CartIcon className="fs-5" />
        <Badge bg="danger" pill>{itemCount}</Badge>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {itemCount > 0 ? (
          <>
            {cart.items.map((item, index) => (
              <Dropdown.Item key={index}>
                {item.beer.name} x {item.quantity}
              </Dropdown.Item>
            ))}
            <Dropdown.Divider />
            <Dropdown.Item as={Link} to="/cart">
              Vai al carrello
            </Dropdown.Item>
          </>
        ) : (
          <Dropdown.Item>Il carrello è vuoto</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default Cart;