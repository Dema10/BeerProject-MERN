import { Container, Row, Col } from 'react-bootstrap';

export default function BreweryHistory() {
  return (
    <Container className="my-5">
      <Row>
        <Col>
          <h2 className="text-center mb-4" style={{ color: "#00ff84" }}>La Nostra Storia</h2>
          <p>
            Il Birrificio XYZ è nato nel 2020 dalla passione di un gruppo di amici per la birra artigianale. 
            Situato nel cuore di [città], il nostro birrificio si dedica alla produzione di birre uniche e di alta qualità, 
            utilizzando solo ingredienti locali e tecniche tradizionali.
          </p>
          <p>
            Il nome "XYZ" deriva da [spiegazione del nome], e rappresenta la nostra filosofia di [descrivi la filosofia].
            Dalla nostra prima cotta a oggi, abbiamo sempre puntato sull'innovazione e sulla qualità, 
            creando birre che sono diventate un punto di riferimento per gli appassionati di tutto il paese.
          </p>
          <p>
            Oggi, il Birrificio XYZ continua a crescere, mantenendo sempre lo spirito artigianale e la passione 
            che ci ha spinto a iniziare questa avventura. Vi invitiamo a scoprire le nostre birre e a condividere 
            con noi questa passione per l'arte birraria.
          </p>
        </Col>
      </Row>
    </Container>
  );
}