import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Card, Table, Badge, Alert, InputGroup } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Trash, SortDown, SortUp } from 'react-bootstrap-icons';
import { getStockMaterials, getOrders, updateOrderStatus, deleteOrder, updateStockMaterial } from '../services/api';
import '../Spinner.css';

  export default function Dashboard() {
    const [stockMaterials, setStockMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
  
    const fetchData = useCallback(async () => {
      console.log('Iniziando fetchData con currentPage:', currentPage, 'e sortBy:', sortBy);
      try {
        setLoading(true);
        const [stockResponse, ordersResponse] = await Promise.all([
          getStockMaterials(),
          getOrders({
            page: currentPage,
            limit: 10,
            sort: sortBy
          })
        ]);
    
        console.log('Risposta del magazzino:', stockResponse);
        console.log('Risposta degli ordini:', ordersResponse);
    
        const materials = stockResponse.data.stockMaterials;
        console.log('Materiali del magazzino ricevuti:', materials);
        setStockMaterials(materials);
        setFilteredMaterials(materials);
    
        const uniqueTypes = [...new Set(materials.map(item => item.type))];
        console.log('Tipi unici di materiali:', uniqueTypes);
        setTypes(uniqueTypes);
    
        const allOrders = ordersResponse.data.orders || [];
        console.log('Tutti gli ordini ricevuti:', allOrders);
        setOrders(allOrders);
        setFilteredOrders(allOrders);
    
        const pendingOrders = allOrders.filter(order => order.status !== 'delivered');
        console.log('Ordini in sospeso:', pendingOrders);
        setPendingOrders(pendingOrders);
    
        const completedOrders = allOrders.filter(order => order.status === 'delivered');
        console.log('Ordini completati:', completedOrders);
        setCompletedOrders(completedOrders);
    
        console.log('Totale pagine:', ordersResponse.data.totalPages);
        setTotalPages(ordersResponse.data.totalPages);
    
        setError(null);
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        setError('Errore nel caricamento dei dati. Riprova più tardi.');
      } finally {
        setLoading(false);
        console.log('fetchData completato');
      }
    }, [currentPage, sortBy]);
  
    useEffect(() => {
      fetchData();
    }, [fetchData]);
  
    useEffect(() => {
      const filtered = orders.filter(order => 
        order.beers.some(item => {
          // Controllo di sicurezza per assicurarsi che item.beer e item.beer.name esistano
          const beerName = item.beer && item.beer.name ? item.beer.name.toLowerCase() : '';
          return beerName.includes(searchTerm.toLowerCase());
        }) ||
        order.totalPrice.toString().includes(searchTerm) ||
        (order.createdAt && format(new Date(order.createdAt), 'dd/MM/yyyy').includes(searchTerm)) ||
        (order._id && order._id.includes(searchTerm)) ||
        // Aggiunta della ricerca per nome e cognome
        (order.user && order.user.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.user && order.user.surname && order.user.surname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.user && order.user.name && order.user.surname && 
         `${order.user.name} ${order.user.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOrders(filtered);
      setPendingOrders(filtered.filter(order => order.status !== 'delivered'));
      setCompletedOrders(filtered.filter(order => order.status === 'delivered'));
    }, [orders, searchTerm]);

    const handleTypeChange = (e) => {
      const type = e.target.value;
      setSelectedType(type);
      if (type) {
        setFilteredMaterials(stockMaterials.filter(item => item.type === type));
      } else {
        setFilteredMaterials(stockMaterials);
      }
    };

  const chartData = useMemo(() => {
    const data = types.map(type => ({
      name: type,
      value: stockMaterials.filter(item => item.type === type).reduce((sum, item) => sum + item.quantity, 0)
    }));
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percent: (item.value / total * 100).toFixed(2)
    }));
  }, [types, stockMaterials]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '5px', border: '1px solid #ccc' }}>
          <p className="label">{`${data.name} : ${data.value}`}</p>
          <p className="intro">{`${data.percent}%`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${percent}%`}
      </text>
    );
  };

  const CustomLegend = ({ payload }) => {
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {payload.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              backgroundColor: entry.color, 
              marginRight: '5px' 
            }}></div>
            <span>{entry.value} - {entry.payload.percent}%</span>
          </li>
        ))}
      </ul>
    );
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(sortBy === newSortBy ? `-${newSortBy}` : newSortBy);
    setSortDirection(sortBy === newSortBy ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc');
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const SortIcon = ({ column }) => {
    if (sortBy.replace('-', '') !== column) return null;
    return sortBy.startsWith('-') ? <SortDown /> : <SortUp />;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    console.log(`Iniziando l'aggiornamento dello stato dell'ordine ${orderId} a ${newStatus}`);
    try {
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        throw new Error('Ordine non trovato');
      }
      console.log(`Stato attuale dell'ordine:`, order.status);
      console.log(`Dettagli dell'ordine:`, JSON.stringify(order, null, 2));
  
      if (order.status === 'pending' && newStatus === 'processing') {
        console.log('Aggiornamento del magazzino...');
        for (const item of order.beers) {
          console.log(`Processando item:`, JSON.stringify(item, null, 2));
          if (!item.beer) {
            console.error(`Dati della birra mancanti o non validi per l'item:`, item);
            continue;
          }
          // Cerchiamo la birra nel magazzino usando il nome della birra
          const stockItem = stockMaterials.find(s => s.name === item.beer.name);
          if (stockItem) {
            console.log(`Aggiornamento della quantità per ${stockItem.name}. Quantità attuale: ${stockItem.quantity}`);
            const updatedQuantity = stockItem.quantity - item.quantity;
            console.log(`Nuova quantità: ${updatedQuantity}`);
            const formData = new FormData();
            formData.append('quantity', updatedQuantity);
            try {
              const response = await updateStockMaterial(stockItem._id, formData);
              console.log(`Risposta dall'aggiornamento del magazzino:`, response);
            } catch (stockUpdateError) {
              console.error(`Errore nell'aggiornamento del magazzino per ${stockItem.name}:`, stockUpdateError);
            }
          } else {
            console.warn(`Item del magazzino non trovato per la birra: ${item.beer.name}`);
          }
        }
      }
  
      // Aggiorna lo stato dell'ordine
      await updateOrderStatus(orderId, newStatus);
      
      // Aggiorna lo stato locale degli ordini
      setOrders(prevOrders => 
        prevOrders.map(o => o._id === orderId ? { ...o, status: newStatus } : o)
      );
  
      // Aggiorna i dati del magazzino
      const updatedStockMaterials = await getStockMaterials();
      setStockMaterials(updatedStockMaterials.data.stockMaterials);
  
      console.log('Aggiornamento completato con successo');
      alert('Stato dell\'ordine e magazzino aggiornati con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', error);
      setError(error.message || 'Errore nell\'aggiornamento dello stato dell\'ordine.');
      alert('Errore nell\'aggiornamento: ' + error.message);
    }
  };


const handleCancelOrder = async (orderId) => {
  if (window.confirm('Sei sicuro di voler annullare questo ordine?')) {
    try {
      await deleteOrder(orderId);
      setPendingOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      alert('Ordine annullato con successo');
      await fetchData();
    } catch (error) {
      console.error('Errore nell\'annullamento dell\'ordine:', error);
      setError('Errore nell\'annullamento dell\'ordine.');
    }
  }
};



const getTotalQuantity = (order) => {
  return order.beers.reduce((total, item) => total + item.quantity, 0);
};

const renderStatusOptions = (currentStatus) => {
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' }
  ];

  const currentIndex = statusOptions.findIndex(option => option.value === currentStatus);
  return statusOptions.slice(currentIndex).map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ));
};

  if (loading) return <div className="spinner"></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <h1 className="my-4">Dashboard Admin</h1>
      <Row>
        <Col md={7}>
          <h2>Stato Magazzino</h2>
          <Row>
            <Col md={8}>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col md={4}>
              <CustomLegend payload={chartData.map((entry, index) => ({
                value: entry.name,
                color: COLORS[index % COLORS.length],
                payload: entry
              }))} />
            </Col>
          </Row>
        </Col>
        <Col md={5}>
          <h2>Prodotti in Magazzino</h2>
          <Form.Group className="mb-3">
            <Form.Label>Filtra per tipo</Form.Label>
            <Form.Control as="select" value={selectedType} onChange={handleTypeChange}>
              <option value="">Tutti i tipi</option>
              {types.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <ul>
            {filteredMaterials.map((item, index) => (
              <li key={index}>{item.name} - Quantità: {item.quantity} {item.unit}</li>
            ))}
          </ul>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Ordini da Gestire</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>ID Ordine</th>
                    <th>Prodotto</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Quantità</th>
                    <th>Totale</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map(order => (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{order.beers[0]?.beer?.name}</td>
                      <td>{order.user.name}</td>
                      <td>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</td>
                      <td>{getTotalQuantity(order)}</td>
                      <td>€{order.totalPrice.toFixed(2)}</td>
                      <td>
                        <Badge bg={order.status === 'pending' ? 'warning' : 'info'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="mb-2"
                        >
                          {renderStatusOptions(order.status)}
                        </Form.Select>
                        {order.status === 'pending' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelOrder(order._id)}
                          >
                            <Trash /> Annulla Ordine
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
        <Card.Header className="bg-success text-white">
          <h3 className="mb-0">Ordini Completati</h3>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Cerca per ID ordine, cliente, prezzo o data"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <InputGroup.Text>
              <Search />
            </InputGroup.Text>
          </InputGroup>
          <Table responsive>
            <thead>
              <tr>
                <th>ID Ordine</th>
                <th>Prodotto</th>
                <th>Cliente</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSortChange('createdAt')}
                >
                  Data <SortIcon column="createdAt" />
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSortChange('totalQuantity')}
                >
                  Quantità <SortIcon column="totalQuantity" />
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSortChange('totalPrice')}
                >
                  Totale <SortIcon column="totalPrice" />
                </th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.map(order => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.beers[0]?.beer?.name}</td>
                  <td>{order.user.name} {order.user.surname}</td>
                  <td>{format(new Date(order.createdAt), 'dd/MM/yyyy')}</td>
                  <td>{order.beers.reduce((total, item) => total + item.quantity, 0)}</td>
                  <td>€{order.totalPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-center mt-3">
            {[...Array(totalPages).keys()].map((page) => (
              <Button
                key={page + 1}
                variant={currentPage === page + 1 ? "primary" : "outline-primary"}
                onClick={() => handlePageChange(page + 1)}
                className="mx-1"
              >
                {page + 1}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>
        </Col>
      </Row>
      <Row>
        <Col className='my-5'>
          <Link to="/admin/new-product">
            <Button variant="primary">Aggiungi Nuovo Prodotto</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};