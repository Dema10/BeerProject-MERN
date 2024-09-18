import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Pagination, Button, Form, InputGroup } from 'react-bootstrap';
import { getUserLikedBeers, getUserOrders, getUserData, deleteOrder } from '../services/api';
import { format } from 'date-fns';
import { Search } from 'react-bootstrap-icons';
import BeerList from '../components/BeerList';

export default function MyDashboard() {
  const [likedBeers, setLikedBeers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    if (orders.length > 0) {
      const sorted = [...orders].sort((a, b) => {
        if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'price') return b.totalPrice - a.totalPrice;
        if (sortBy === 'quantity') return b.beers.reduce((sum, item) => sum + item.quantity, 0) - a.beers.reduce((sum, item) => sum + item.quantity, 0);
        return 0;
      });

      const filtered = sorted.filter(order => 
        order.beers.some(item => item.beer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.totalPrice.toString().includes(searchTerm) ||
        format(new Date(order.createdAt), 'dd/MM/yyyy').includes(searchTerm)
      );

      setFilteredOrders(filtered);
    }
  }, [orders, searchTerm, sortBy]);


  const fetchData = useCallback(async () => {
    await Promise.all([
      fetchCurrentUser(),
      fetchLikedBeers(),
      fetchOrders(currentPage)
    ]);
  }, [currentPage]);

  useEffect(() => {
    fetchData();

    const handleUpdate = async () => {
      console.log('Evento di aggiornamento ricevuto');
      await fetchData();
    };

    window.addEventListener('orderConfirmed', handleUpdate);
    window.addEventListener('orderCancelled', handleUpdate);

    return () => {
      window.removeEventListener('orderConfirmed', handleUpdate);
      window.removeEventListener('orderCancelled', handleUpdate);
    };
  }, [fetchData]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getUserData();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Errore nel recupero dei dati utente:', error);
    }
  };

  const fetchLikedBeers = async () => {
    try {
      const response = await getUserLikedBeers();
      setLikedBeers(response.data);
    } catch (error) {
      console.error('Errore nel recupero delle birre preferite:', error);
    }
  };

  const fetchOrders = async (page) => {
    try {
      const response = await getUserOrders({ page, limit: 5 });
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Errore nel recupero degli ordini:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Sei sicuro di voler annullare questo ordine?')) {
      try {
        await deleteOrder(orderId);
        
        // Aggiorna localmente la lista degli ordini
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        setFilteredOrders(prevFilteredOrders => prevFilteredOrders.filter(order => order._id !== orderId));
        
        // Se la pagina corrente è vuota dopo l'eliminazione, torna alla pagina precedente
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        }
        
        alert('Ordine annullato con successo');
        
        // Emetti un evento per notificare l'annullamento dell'ordine
        window.dispatchEvent(new Event('orderCancelled'));
        
        // Aggiorna i dati dal server per assicurarsi che tutto sia sincronizzato
        await fetchData();
      } catch (error) {
        console.error('Errore nell\'annullamento dell\'ordine:', error);
        alert('Errore nell\'annullamento dell\'ordine');
      }
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">La mia Dashboard</h1>
      <Row className="justify-content-center mb-5">
        <Col lg={10} md={12}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Le mie Birre Preferite</h3>
            </Card.Header>
            <Card.Body>
              {likedBeers.length > 0 ? (
                <BeerList 
                  beers={likedBeers}
                  currentUser={currentUser}
                  setBeers={setLikedBeers}
                  isDashboard={true}
                />
              ) : (
                <p className="text-center mt-3">Non hai ancora birre preferite.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col lg={10} md={12}>
          <Card className="shadow">
            <Card.Header className="bg-success text-white">
              <h3 className="mb-0">I miei Ordini</h3>
            </Card.Header>
            <Card.Body>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Cerca per nome birra, prezzo o data"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Select onChange={(e) => setSortBy(e.target.value)}>
                  <option value="date">Ordina per Data</option>
                  <option value="price">Ordina per Prezzo</option>
                  <option value="quantity">Ordina per Quantità</option>
                </Form.Select>
              </InputGroup>

              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <Card key={order._id} className="mb-3">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <span>Data: {format(new Date(order.createdAt), 'dd/MM/yyyy')}</span>
                      <span>Totale: €{order.totalPrice.toFixed(2)}</span>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={8}>
                          {order.beers.map(item => (
                            <div key={item._id} className="mb-2">
                              <strong>{item.beer.name}</strong> - Quantità: {item.quantity}
                            </div>
                          ))}
                        </Col>
                        <Col md={4} className="text-end">
                          <p>Stato: {order.status}</p>
                          {order.status === 'pending' && (
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleCancelOrder(order._id)}
                            >
                              Annulla Ordine
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <p className="text-center mt-3">Nessun ordine trovato.</p>
              )}
            </Card.Body>
            {filteredOrders.length > 0 && (
              <Card.Footer>
                <Pagination className="justify-content-center">
                  {[...Array(totalPages).keys()].map(number => (
                    <Pagination.Item 
                      key={number + 1} 
                      active={number + 1 === currentPage}
                      onClick={() => setCurrentPage(number + 1)}
                    >
                      {number + 1}
                    </Pagination.Item>
                  ))}
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}