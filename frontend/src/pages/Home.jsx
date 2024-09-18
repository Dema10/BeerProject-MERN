import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { PlusCircle, Trash } from 'react-bootstrap-icons';
import BeerCarousel from '../components/BeerCarousel';
import BeerList from '../components/BeerList';
import BreweryHistory from '../components/BreweryHistory';
import ImageUploadModal from '../components/ImageUploadModal';
import { getBeers, getUserData, getCarouselImages, createCarouselImage, deleteCarouselImage } from '../services/api';
import '../Spinner.css';

export default function Home() {
  const [beers, setBeers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [carouselImages, setCarouselImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [beersResponse, carouselImagesData] = await Promise.all([
        getBeers(),
        getCarouselImages()
      ]);
      
      setBeers(beersResponse.data.beers || []);
      setCarouselImages(carouselImagesData.data || []);

      if (localStorage.getItem('token')) {
        try {
          const userData = await getUserData();
          setCurrentUser(userData);
        } catch (error) {
          console.error('Errore nel caricamento dei dati utente:', error);
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleUpdate = async () => {
      console.log('Evento di aggiornamento ricevuto');
      await fetchData();
    };

    window.addEventListener('orderConfirmed', handleUpdate);
    window.addEventListener('orderCancelled', handleUpdate);
    window.addEventListener('cartUpdated', handleUpdate);

    return () => {
      window.removeEventListener('orderConfirmed', handleUpdate);
      window.removeEventListener('orderCancelled', handleUpdate);
      window.removeEventListener('cartUpdated', handleUpdate);
    };
  }, [fetchData]);

  const handleAddImage = async (imageData) => {
    try {
      const formData = new FormData();
      formData.append('title', imageData.title);
      formData.append('description', imageData.description);
      formData.append('image', imageData.image);

      await createCarouselImage(formData);
      await fetchData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'immagine:', error);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa immagine?')) {
      try {
        await deleteCarouselImage(imageId);
        await fetchData();
      } catch (error) {
        console.error('Errore nell\'eliminazione dell\'immagine:', error);
      }
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <Container fluid>
      <BeerCarousel carouselImages={carouselImages} />
      {currentUser && currentUser.role === 'admin' && (
        <div className="text-center mt-3 mb-4">
          <Button onClick={() => setShowAddModal(true)} variant="success" className="me-2">
            <PlusCircle className="pb-1 fs-5"/>
          </Button>
          {carouselImages.map((image) => (
            <Button 
              key={image._id} 
              onClick={() => handleDeleteImage(image._id)} 
              variant="danger" 
              className="me-2"
            >
              <Trash className="pb-1 fs-5"/>{image.title}
            </Button>
          ))}
        </div>
      )}
      <Row className="my-5">
        <h2 className="text-center" style={{ color: "#00ff84" }}>Le Nostre Birre</h2>
        <Col lg={10} md={12}>
          <BeerList beers={beers} currentUser={currentUser} setBeers={setBeers} />
        </Col>
      </Row>
      <BreweryHistory />

      <ImageUploadModal 
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddImage}
        mode="add"
      />
    </Container>
  );
}