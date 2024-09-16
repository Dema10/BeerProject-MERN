import { useState, useEffect, useCallback } from 'react';
import { Dropdown, Badge, Button, Form } from 'react-bootstrap';
import { Cart as CartIcon, Trash, Plus, Dash } from 'react-bootstrap-icons';
import { getCart, updateCartItem, removeFromCart, checkout } from '../services/api';
import '../Spinner.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchCart();
  
    const handleCartUpdate = (event) => {
      console.log('Cart updated event received', event.detail);
      fetchCart();
    };
  
    window.addEventListener('cartUpdated', handleCartUpdate);
  
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCart]);

  const updateLocalCart = (updatedItem, remove = false) => {
    setCart(prevCart => {
      if (!prevCart) return prevCart;
      
      const updatedItems = remove
        ? prevCart.items.filter(item => item._id !== updatedItem._id)
        : prevCart.items.map(item => 
            item._id === updatedItem._id ? updatedItem : item
          );

      const newTotalPrice = updatedItems.reduce(
        (total, item) => total + item.quantity * item.beer.price,
        0
      );

      return {
        ...prevCart,
        items: updatedItems,
        totalPrice: newTotalPrice
      };
    });
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      const updatedItem = await updateCartItem(itemId, { quantity: newQuantity });
      updateLocalCart(updatedItem);
    } catch (error) {
      console.error('Errore nell\'aggiornamento della quantità:', error);
      setError('Errore nell\'aggiornamento della quantità');
      fetchCart();
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      updateLocalCart({ _id: itemId }, true);
    } catch (error) {
      console.error('Errore nella rimozione del prodotto:', error);
      setError('Errore nella rimozione del prodotto');
      fetchCart();
    }
  };

  const handleClearCart = async () => {
    try {
      await checkout();
      setCart({ items: [], totalPrice: 0 });
    } catch (error) {
      console.error('Errore nello svuotamento del carrello:', error);
      setError('Errore nello svuotamento del carrello');
      fetchCart();
    }
  };

  const handleCheckout = async () => {
    try {
      await checkout();
      setCart({ items: [], totalPrice: 0 });
      alert('Ordine confermato con successo!');
    } catch (error) {
      console.error('Errore durante il checkout:', error);
      setError('Errore durante il checkout');
      fetchCart();
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" id="dropdown-cart" className="text-light">
        {loading ? (
          <div className="spinnercart"></div>
        ) : (
          <>
            <CartIcon className="fs-5" />
            <Badge bg="danger" pill>{cart && cart.items ? cart.items.length : 0}</Badge>
          </>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{minWidth: '300px', maxHeight: '400px', overflowY: 'auto'}}>
        {loading ? (
          <Dropdown.Item>Caricamento...</Dropdown.Item>
        ) : error ? (
          <Dropdown.Item className="text-danger">{error}</Dropdown.Item>
        ) : cart && cart.items && cart.items.length > 0 ? (
          <>
            {cart.items.map((item) => (
              <Dropdown.Item key={item._id} className="d-flex justify-content-between align-items-center">
                <span>{item.beer.name}</span>
                <div>
                  <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item._id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Dash />
                  </Button>
                  <Form.Control
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value))}
                    style={{width: '50px', display: 'inline-block', marginLeft: '5px', marginRight: '5px'}}
                  />
                  <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>
                    <Plus />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(item._id)} style={{marginLeft: '5px'}}>
                    <Trash />
                  </Button>
                </div>
              </Dropdown.Item>
            ))}
            <Dropdown.Divider />
            <Dropdown.Item>
              <strong>Totale: €{cart.totalPrice.toFixed(2)}</strong>
            </Dropdown.Item>
            <Dropdown.Item>
              <Button variant="success" onClick={handleCheckout} className="w-100 mb-2">Conferma Ordine</Button>
              <Button variant="danger" onClick={handleClearCart} className="w-100">Svuota Carrello</Button>
            </Dropdown.Item>
          </>
        ) : (
          <Dropdown.Item>Il carrello è vuoto</Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}