const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.post('/registrar', async (req, res) => {
  const { tx_hash, block_number, sender, payload } = req.body;
  
  try {
    const query = 'INSERT INTO auditoria (tx_hash, block_number, sender, payload) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [tx_hash, block_number, sender, payload];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar no banco' });
  }
});

app.get('/historico', async (req, res) => {
  const result = await pool.query('SELECT * FROM auditoria ORDER BY created_at DESC');
  res.json(result.rows);
});

// Rota para retornar todos os registros de uma bateria específica
app.get('/historico/:batteryId', async (req, res) => {
  const { batteryId } = req.params;

  try {
    // Filtramos pelo campo batteryId dentro do JSONB 'payload'
    // Ordenamos por block_number ou created_at para manter a cronologia dos ciclos
    const query = `
      SELECT * FROM auditoria 
      WHERE payload->>'batteryId' = $1 
      ORDER BY block_number ASC, created_at ASC
    `;
    
    const result = await pool.query(query, [batteryId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum registro encontrado para esta bateria.' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados no banco' });
  }
  });

app.listen(3001, () => console.log('Indexador rodando na porta 3001'));
