import { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { HandThumbsUp } from 'react-bootstrap-icons';
import BeerComments from './BeerComments';
import { likeBeer } from '../services/api';

export default function BeerList({ beers, currentUser, setBeers }) {
  
  const [expandedBeerId, setExpandedBeerId] = useState(null);

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

  const toggleComments = (beerId) => {
    setExpandedBeerId(expandedBeerId === beerId ? null : beerId);
  };

  return (
    <div>
      {beers.map((beer) => (
        <Card key={beer._id} className="mb-4">
          <Card.Img variant="top" src={beer.image} />
          <Card.Body>
            <Card.Title>{beer.name}</Card.Title>
            {beer.isNew && <Badge bg="success">Novità</Badge>}
            <Card.Text>{beer.description}</Card.Text>
            <Button 
              variant="primary" 
              onClick={() => handleLike(beer._id)}
              disabled={!currentUser || (currentUser && beer.likes.includes(currentUser._id))}
            >
              <HandThumbsUp /> Mi piace ({beer.likes.length})
            </Button>
            <Button 
              variant="link" 
              onClick={() => toggleComments(beer._id)}
            >
              Commenti
            </Button>
            {expandedBeerId === beer._id && (
              <BeerComments 
                beerId={beer._id} 
                currentUser={currentUser}
              />
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}