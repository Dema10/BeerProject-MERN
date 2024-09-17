import { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { HandThumbsUp, CartPlus, ChatDots } from 'react-bootstrap-icons';
import BeerComments from './BeerComments';
import { likeBeer, addToCart } from '../services/api';

export default function BeerList({ beers, currentUser, setBeers }) {
  const [expandedBeerId, setExpandedBeerId] = useState(null);
  const [commentsKey, setCommentsKey] = useState({});

  const handleLike = async (beerId) => {
    if (!currentUser) {
      alert("Effettua il login per mettere mi piace");
      return;
    }
    try {
      await likeBeer(beerId);
      setBeers(prevBeers => prevBeers.map(beer => 
        beer._id === beerId
          ? { ...beer, likes: [...beer.likes, currentUser._id] }
          : beer
      ));
    } catch (error) {
      console.error('Errore nel mettere like alla birra:', error);
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
      {beers.map((beer) => (
        <Col key={beer._id} xs={12} md={6} lg={4} className="mb-4">
          <Card className="h-100">
            <div style={{ position: 'relative' }}>
              <Card.Img variant="top" src={beer.img} style={{height: '400px', objectFit: 'cover'}} />
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
              <div className="mt-auto">
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleLike(beer._id)}
                  disabled={!currentUser || (currentUser && beer.likes.includes(currentUser._id))}
                  className="me-2 mb-2"
                >
                  <HandThumbsUp /> {beer.likes.length}
                </Button>
                <Button 
                  variant="outline-success" 
                  onClick={() => handleAddToCart(beer._id)}
                  className="me-2 mb-2"
                >
                  <CartPlus /> Carrello
                </Button>
                <Button 
                  variant="outline-secondary"
                  onClick={() => toggleComments(beer._id)}
                  className="mb-2"
                >
                  <ChatDots /> Commenti
                </Button>
              </div>
            </Card.Body>
            {expandedBeerId === beer._id && (
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