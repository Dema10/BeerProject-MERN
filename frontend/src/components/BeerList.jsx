import { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { HandThumbsUp, HandThumbsDown, CartPlus, ChatDots } from 'react-bootstrap-icons';
import BeerComments from './BeerComments';
import { likeBeer, unlikeBeer, addToCart, getBeers } from '../services/api';

export default function BeerList({ beers: initialBeers, currentUser, setBeers, isDashboard = false }) {
  const [expandedBeerId, setExpandedBeerId] = useState(null);
  const [commentsKey, setCommentsKey] = useState({});
  const [localBeers, setLocalBeers] = useState(initialBeers);

  useEffect(() => {
    setLocalBeers(initialBeers);
  }, [initialBeers]);

  const handleLikeAction = async (beerId) => {
    if (!currentUser) {
      alert("Effettua il login per gestire i mi piace");
      return;
    }
    try {
      if (isDashboard) {
        await unlikeBeer(beerId);
        setLocalBeers(prevBeers => prevBeers.filter(beer => beer._id !== beerId));
      } else {
        await likeBeer(beerId);
        setLocalBeers(prevBeers => prevBeers.map(beer => 
          beer._id === beerId
            ? { ...beer, likes: [...beer.likes, currentUser._id] }
            : beer
        ));
      }
      setBeers(localBeers);
    } catch (error) {
      console.error('Errore nella gestione del like alla birra:', error);
    }
  };

  const handleAddToCart = async (beerId) => {
    if (!currentUser) {
      alert("Effettua il login per aggiungere al carrello");
      return;
    }
    try {
      const response = await addToCart({ beerId, quantity: 1 });
      console.log('Prodotto aggiunto al carrello:', response);
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: response }));
      alert("Prodotto aggiunto al carrello");
      
      // Aggiorna le quantità delle birre
      const updatedBeers = await getBeers();
      const newLocalBeers = localBeers.map(beer => {
        const updatedBeer = updatedBeers.data.beers.find(b => b._id === beer._id);
        return updatedBeer ? { ...beer, quantity: updatedBeer.quantity } : beer;
      });
      setLocalBeers(newLocalBeers);
      setBeers(newLocalBeers);
    } catch (error) {
      console.error('Errore nell\'aggiungere al carrello:', error);
      alert("Errore nell'aggiungere al carrello");
    }
  };

  const toggleComments = (beerId) => {
    setExpandedBeerId(prevId => {
      if (prevId === beerId) {
        return null;
      } else {
        setCommentsKey(prev => ({ ...prev, [beerId]: Date.now() }));
        return beerId;
      }
    });
  };

  useEffect(() => {
    if (expandedBeerId) {
      setCommentsKey(prev => ({ ...prev, [expandedBeerId]: Date.now() }));
    }
  }, [expandedBeerId]);

  return (
    <Row>
      {localBeers.map((beer) => (
        <Col key={beer._id} xs={12} md={6} lg={4} className="mb-4">
          <Card className="h-100">
            <div style={{ position: 'relative' }}>
              <Card.Img variant="top" src={beer.img} style={{height: '350px', objectFit: 'cover'}} />
              {beer.isNew && (
                <Badge 
                  bg="success" 
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '0.8em',
                    padding: '5px 8px'
                  }}
                >
                  Novità
                </Badge>
              )}
            </div>
            <Card.Body className="d-flex flex-column">
              <Card.Title>{beer.name}</Card.Title>
              <Card.Text>{beer.description}</Card.Text>
              <Card.Text>Disponibili: {beer.quantity}</Card.Text>
              <div className="mt-auto">
                <Button 
                  variant={isDashboard ? "outline-danger" : "outline-primary"}
                  onClick={() => handleLikeAction(beer._id)}
                  disabled={!isDashboard && (!currentUser || (currentUser && beer.likes.includes(currentUser._id)))}
                  className="me-2 mb-2"
                >
                  {isDashboard ? <HandThumbsDown /> : <HandThumbsUp />} 
                  {isDashboard ? "Rimuovi" : beer.likes.length}
                </Button>

                {!isDashboard && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => toggleComments(beer._id)}
                    className="mb-2"
                  >
                    <ChatDots /> Commenti
                  </Button>
                )}

                <Button 
                  variant="outline-success" 
                  onClick={() => handleAddToCart(beer._id)}
                  className="ms-2 mb-2"
                  disabled={beer.quantity === 0}
                >
                  <CartPlus /> Carrello
                </Button>
              </div>
            </Card.Body>
            {!isDashboard && expandedBeerId === beer._id && (
              <Card.Footer>
                <BeerComments 
                  key={commentsKey[beer._id]}
                  beerId={beer._id} 
                  currentUser={currentUser}
                  onCommentAdded={() => setCommentsKey(prev => ({ ...prev, [beer._id]: Date.now() }))}
                />
              </Card.Footer>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}