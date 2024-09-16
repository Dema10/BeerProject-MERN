import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { createStockMaterial, createBeer, getStockMaterials } from '../services/api';
import '../Spinner.css';

export default function NewProductStock() {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    quantity: '',
    unit: '',
    price: '',
    minimumStock: '',
    supplier: '',
    img: null,
    isBeer: false,
    style: '',
    abv: '',
    description: '',
  });
  const [existingTypes, setExistingTypes] = useState([]);
  const [message, setMessage] = useState(null);
  const [isNewType, setIsNewType] = useState(false);
  const [newType, setNewType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchExistingTypes();
  }, []);

  const fetchExistingTypes = async () => {
    try {
      const response = await getStockMaterials();
      const types = [...new Set(response.data.stockMaterials.map(item => item.type))];
      setExistingTypes(types);
    } catch (error) {
      console.error('Error fetching existing types:', error);
      setMessage({ type: 'danger', text: 'Errore nel caricamento dei tipi di prodotto.' });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prevData => ({
        ...prevData,
        [name]: files[0]
      }));
    } else if (type === 'checkbox') {
      setFormData(prevData => ({
        ...prevData,
        [name]: checked
      }));
    } else if (name === 'type') {
      if (value === 'new') {
        setIsNewType(true);
        setFormData(prevData => ({
          ...prevData,
          type: ''
        }));
      } else {
        setIsNewType(false);
        setNewType('');
        setFormData(prevData => ({
          ...prevData,
          [name]: value
        }));
      }
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'img') {
          if (formData[key]) {
            formDataToSend.append('img', formData[key]);
          }
        } else if (key === 'type' && isNewType) {
          formDataToSend.append(key, newType);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      let response;
      if (formData.isBeer) {
        response = await createBeer(formDataToSend);
        await createStockMaterial(formDataToSend);
        setMessage({ type: 'success', text: 'Birra aggiunta con successo al catalogo e al magazzino!' });
      } else {
        response = await createStockMaterial(formDataToSend);
        setMessage({ type: 'success', text: 'Prodotto aggiunto con successo al magazzino!' });
      }

      console.log('Creation response:', response);

      // Reset del form
      setFormData({
        name: '',
        type: '',
        quantity: '',
        unit: '',
        price: '',
        minimumStock: '',
        supplier: '',
        img: null,
        isBeer: false,
        style: '',
        abv: '',
        description: '',
      });
      setIsNewType(false);
      setNewType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchExistingTypes();
      
      // Scroll to top after successful submission
      scrollToTop();
    } catch (error) {
      console.error('Errore dettagliato:', error.response?.data || error.message);
      setMessage({ type: 'danger', text: 'Errore nell\'aggiunta del prodotto.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="my-4">Aggiungi Nuovo Prodotto in Magazzino</h2>
      {isLoading && <div className="spinner"></div>}
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                as="select"
                name="type"
                value={isNewType ? 'new' : formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Seleziona un tipo</option>
                {existingTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
                <option value="new">Aggiungi nuovo tipo</option>
              </Form.Control>
            </Form.Group>
            {isNewType && (
              <Form.Group className="mb-3">
                <Form.Label>Nuovo Tipo</Form.Label>
                <Form.Control
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                />
              </Form.Group>
            )}
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Quantità</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unità di Misura</Form.Label>
              <Form.Control
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Prezzo</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Scorta Minima</Form.Label>
              <Form.Control
                type="number"
                name="minimumStock"
                value={formData.minimumStock}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fornitore</Form.Label>
              <Form.Control
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Check 
            type="checkbox"
            label="Questo prodotto è una birra"
            name="isBeer"
            checked={formData.isBeer}
            onChange={handleChange}
          />
        </Form.Group>
        {formData.isBeer && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Stile della Birra</Form.Label>
              <Form.Control
                type="text"
                name="style"
                value={formData.style}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ABV (%)</Form.Label>
              <Form.Control
                type="number"
                name="abv"
                value={formData.abv}
                onChange={handleChange}
                step="0.1"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrizione</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Immagine</Form.Label>
          <Form.Control
            type="file"
            name="img"
            onChange={handleChange}
            ref={fileInputRef}
          />
        </Form.Group>
        <div className='mb-5'>
          <Button variant="primary" type="submit" disabled={isLoading}>
            Aggiungi Prodotto
          </Button>
        </div>
      </Form>
    </Container>
  );
}