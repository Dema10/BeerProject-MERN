import { Container, Row, Col } from 'react-bootstrap';
import { Facebook, Twitter, Instagram, Whatsapp, Telegram } from 'react-bootstrap-icons';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-4">
      <Container>
        <Row>
          <Col md={6} className="text-center text-md-start">
            <h5>Birrificio XYZ</h5>
            <p>&copy; 2020-{currentYear} Birrificio XYZ. Tutti i diritti riservati.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <h5>Contatti</h5>
            <p>Email: info@birrificioxyz.com</p>
            <div>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-light me-2">
                <Facebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-light me-2">
                <Twitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-light me-2">
                <Instagram />
              </a>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="text-light me-2">
                <Whatsapp />
              </a>
              <a href="https://t.me/birrificioxyz" target="_blank" rel="noopener noreferrer" className="text-light">
                <Telegram />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}