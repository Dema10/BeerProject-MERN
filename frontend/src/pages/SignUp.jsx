import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { Form, Button } from 'react-bootstrap';

export default function SingUp() {

    const [formData, setFormData] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
        avatar: "",
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
      setFormData({ ...formData, avatar: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const dataToSend = { ...formData };
          if (!dataToSend.avatar) {
            delete dataToSend.avatar;
          }
          await registerUser(dataToSend);
          alert("Registrato con successo!");
          navigate("/login");
        } catch (err) {
          console.error("Errore nella registrazione:", err);
          alert("Errore nella registrazione. Riprovare.")
        }
      };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color:"#00ff84" }} className="text-center my-4">Sign-Up</h1>
        <Form data-bs-theme="dark" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className='text-white'>Nome</Form.Label>
            <Form.Control 
              type="text"
              name="name"
              placeholder="Nome"
              onChange={handleChange}
              required
              data-custom-input
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className='text-white'>Cognome</Form.Label>
            <Form.Control 
              type="text" 
              name="surname"
              placeholder="Cognome"
              onChange={handleChange}
              required
              data-custom-input 
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label className='text-white'>Email</Form.Label>
            <Form.Control 
              type="email" 
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              data-custom-input 
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label className='text-white'>Password</Form.Label>
            <Form.Control 
              type="password" 
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              data-custom-input 
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formAvatar">
            <Form.Label className='text-white'>Avatar</Form.Label>
            <Form.Control 
              type="file" 
              name="avatar"
              placeholder="Avatar"
              onChange={handleFileChange}
              data-custom-input 
            />
          </Form.Group>
          <Button className='mt-3 mb-5 w-100' variant='outline' type='submit' data-custom-btn>
            Sign-up
          </Button>
        </Form>
      </div>
    </div>
  )
}