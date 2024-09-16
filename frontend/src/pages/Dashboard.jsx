import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getStockMaterials } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stockMaterials, setStockMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchStockMaterials();
  }, []);

  const fetchStockMaterials = async () => {
    try {
      const response = await getStockMaterials();
      setStockMaterials(response.data.stockMaterials);
      setFilteredMaterials(response.data.stockMaterials);
      const uniqueTypes = [...new Set(response.data.stockMaterials.map(item => item.type))];
      setTypes(uniqueTypes);
    } catch (error) {
      console.error('Error fetching stock materials:', error);
    }
  };

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

  return (
    <Container fluid>
      <h1 className="my-4">Dashboard Admin</h1>
      <Row>
        <Col md={7}>
          <h2>Stato Magazzino</h2>
          <Row>
            <Col md={8}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
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
        <Col className='my-5'>
          <Link to="/admin/new-product">
            <Button variant="primary">Aggiungi Nuovo Prodotto</Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}