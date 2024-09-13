import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { PlusCircle, PencilSquare } from 'react-bootstrap-icons';

export default function ImageUploadModal ({ 
  show, 
  onHide, 
  onSubmit, 
  mode = 'add',
  initialData = { title: '', description: '', image: null }
})  {
  const [imageData, setImageData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setImageData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(imageData);
    setImageData(initialData);
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'add' ? 'Aggiungi Immagine' : 'Modifica Immagine'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {mode === 'add' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Titolo</Form.Label>
                <Form.Control 
                  type="text" 
                  name="title"
                  value={imageData.title} 
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Descrizione</Form.Label>
                <Form.Control 
                  as="textarea" 
                  name="description"
                  value={imageData.description} 
                  onChange={handleChange}
                />
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Immagine</Form.Label>
            <Form.Control 
              type="file" 
              name="image"
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            {mode === 'add' ? (
              <>
                <PlusCircle className="me-2" /> Aggiungi Immagine
              </>
            ) : (
              <>
                <PencilSquare className="me-2" /> Modifica Immagine
              </>
            )}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};