import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Form, Image, Modal } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import { getUserData, updateUserProfile, deleteUserAccount } from '../services/api';
import '../Spinner.css';
import ImageUploadModal from '../components/ImageUploadModal';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userData, setUserData] = useState({ name: '', surname: '', email: '' });
  const  navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await getUserData();
      setUser(userData);
      setUserData({ name: userData.name, surname: userData.surname, email: userData.email });
    } catch (error) {
      console.error('Errore nel caricamento dei dati utente:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchUserData]);


  const handleUpdateAvatar = async (imageData) => {
    try {
      const formData = new FormData();
      formData.append('avatar', imageData.image);

      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      setShowEditModal(false);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'avatar:', error);
    }
  };

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      const updatedUser = await updateUserProfile(userData);
      setUser(updatedUser);
      setEditing(false);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUserAccount(user._id);
      localStorage.removeItem('token');
      navigate('/');
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'account:', error);
    }
  };

  if (!user) {
    return <div className='spinner'></div>;
  }

  return (
    <Container>
      <Row className="my-5 d-flex justify-content-center">
        <Col md={12} className="text-center position-relative">
          <Image src={user.avatar} roundedCircle style={{ width: '450px', height: '450px' }} className="mb-3" />
          <Button
            variant="primary"
            className="position-absolute rounded-circle p-0"
            onClick={() => setShowEditModal(true)}
            style={{ width: '40px', height: '40px' }}
          >
            <PencilSquare className="pb-1 fs-5" />
          </Button>
        </Col>

        <Col md={12} className="text-center">
          {editing ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Cognome</Form.Label>
                <Form.Control
                  type="text"
                  name="surname"
                  value={userData.surname}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Button variant="secondary" onClick={handleCancelEdit}>
                Annulla
              </Button>
              <Button variant="primary" onClick={handleSave} className="ms-2">
                Salva
              </Button>
            </Form>
          ) : (
            <>
              <h1>{user.name} {user.surname}</h1>
              <p className='fs-3'>Email: {user.email}</p>
              <p className='fs-4'>Ruolo: {user.role}{user && user.role !== 'admin' &&<small className='opacity-50'> (non mdoficabile)</small>}</p>
              <Button className='me-2' variant="warning" onClick={handleEditClick}>
                Modifica
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <Trash className="me-2 mb-1" />
                Elimina Account
              </Button>
            </>
          )}
        </Col>
      </Row>

      {/* Modal per l'upload dell'immagine */}
      <ImageUploadModal 
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSubmit={handleUpdateAvatar}
        mode="edit"
      />

      {/* Modal di conferma per l'eliminazione dell'account */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Conferma eliminazione account</Modal.Title>
        </Modal.Header>
        <Modal.Body>Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annulla
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount}>
            Elimina Account
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}