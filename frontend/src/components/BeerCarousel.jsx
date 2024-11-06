import { Carousel } from 'react-bootstrap';

export default function BeerCarousel({ carouselImages }) {
  const images = Array.isArray(carouselImages) ? carouselImages : [];

  if (images.length === 0) {
    return (
      <div className="mt-5" style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        color: '#6c757d',
        fontSize: '1.5rem'
      }}>
        Nessuna immagine disponibile per il carosello.
      </div>
    );
  }

  return (
    <Carousel className='mt-5'>
      {images.map((image) => (
        <Carousel.Item key={image._id}>
          <img
            className="d-block w-100"
            src={image.imageUrl}
            alt={image.title}
            style={{ height: '600px', objectFit: 'cover' }}
          />
          <Carousel.Caption>
            <h3>{image.title}</h3>
            <p>{image.description}</p>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}