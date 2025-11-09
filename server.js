const express = require('express');
const { Client } = require('pg');
const app = express();

const con = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'otvoreno_rac',
  password: 'postgres',
  port: 5432,
});

con.connect();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/datatable', async (req, res) => {
  try {
    const { filter, select_filter } = req.query;
    
    let query = `
      SELECT d.naziv AS drzava,
           d.glavni_grad,
           d.jezik,
           d.trajanje_putovanja,
           d.valuta,
           d.godina_posjete,
           d.tip_putovanja,
           d.prijevoz,
           d.ocjena,
           d.broj_stanovnika,
           g.grad_naziv,
           g.broj_stanovnika as broj_stanovnika_grad,
           g.aktivnost
      FROM drzave d
      LEFT JOIN gradovi g ON g.drzava = d.naziv
    `;

    if (filter && select_filter && select_filter !== 'all') {
      query += ` WHERE LOWER(${select_filter}) LIKE LOWER('%${filter}%')`;
    } else if (filter && select_filter === 'all') {
      query += ` WHERE LOWER(d.naziv) LIKE LOWER('%${filter}%') 
                OR LOWER(d.glavni_grad) LIKE LOWER('%${filter}%')
                OR LOWER(d.jezik) LIKE LOWER('%${filter}%')
                OR LOWER(d.valuta) LIKE LOWER('%${filter}%')
                OR LOWER(d.tip_putovanja) LIKE LOWER('%${filter}%')
                OR LOWER(d.prijevoz) LIKE LOWER('%${filter}%')
                OR LOWER(g.grad_naziv) LIKE LOWER('%${filter}%')
                OR LOWER(g.aktivnost) LIKE LOWER('%${filter}%')`;
    }

    const result = await con.query(query);
    
    res.render('datatable', { 
      data: result.rows,
      currentFilter: filter || '',
      currentSelectFilter: select_filter || 'all'
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const { filter, select_filter } = req.query;
    
    let query = `
      SELECT d.naziv AS drzava,
           d.glavni_grad,
           d.jezik,
           d.trajanje_putovanja,
           d.valuta,
           d.godina_posjete,
           d.tip_putovanja,
           d.prijevoz,
           d.ocjena,
           d.broj_stanovnika,
           g.grad_naziv,
           g.broj_stanovnika as broj_stanovnika_grad,
           g.aktivnost
      FROM drzave d
      LEFT JOIN gradovi g ON g.drzava = d.naziv
    `;

    if (filter && select_filter && select_filter !== 'all') {
      query += ` WHERE LOWER(${select_filter}) LIKE LOWER('%${filter}%')`;
    } else if (filter && select_filter === 'all') {
      query += ` WHERE LOWER(d.naziv) LIKE LOWER('%${filter}%') 
                OR LOWER(d.glavni_grad) LIKE LOWER('%${filter}%')
                OR LOWER(d.jezik) LIKE LOWER('%${filter}%')
                OR LOWER(d.valuta) LIKE LOWER('%${filter}%')
                OR LOWER(d.tip_putovanja) LIKE LOWER('%${filter}%')
                OR LOWER(d.prijevoz) LIKE LOWER('%${filter}%')
                OR LOWER(g.grad_naziv) LIKE LOWER('%${filter}%')
                OR LOWER(g.aktivnost) LIKE LOWER('%${filter}%')`;
    }

    const result = await con.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data');
  }
});

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:3000`);
});