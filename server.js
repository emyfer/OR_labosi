const express = require('express');
const { Client } = require('pg');
const ResponseWrapper = require('./responseWrapper');

const con = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'otvoreno_rac',
  password: 'postgres',
  port: 5432,
});

con.connect();

const app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const fs = require('fs');
const path = require('path');


let openapiSpec;
try {
  const openapiPath = path.join(__dirname, 'openapi.json');
  
  if (fs.existsSync(openapiPath)) 
    openapiSpec = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

} catch (err) {
  console.error('Error loading OpenAPI spec')

}

app.get('/api/docs', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openapiSpec);
});

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


app.get('/api/drzave', async (req, res) => {
  try {
    const query = `
      SELECT d.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'grad_naziv', g.grad_naziv,
                   'broj_stanovnika', g.broj_stanovnika,
                   'aktivnost', g.aktivnost
                 )
               ) FILTER (WHERE g.grad_naziv IS NOT NULL),
               '[]'
             ) as gradovi
      FROM drzave d
      LEFT JOIN gradovi g ON g.drzava = d.naziv
      GROUP BY d.naziv
      ORDER BY d.naziv
    `;
    
    const result = await con.query(query);
    
    const response = ResponseWrapper.success(
      result.rows,
      `Successfully fetched ${result.rowCount} countries`,
      null,
      { count: result.rowCount }
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error in GET /api/drzave:', err);
    const error = ResponseWrapper.serverError(
      'Failed to fetch countries',
      { databaseError: err.message }
    );
    res.status(error._statusCode).json(error);
  }
});

app.get('/api/drzave/:naziv', async (req, res) => {
  try {
    const { naziv } = req.params;
    
    const query = `
      SELECT d.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'grad_naziv', g.grad_naziv,
                   'broj_stanovnika', g.broj_stanovnika,
                   'aktivnost', g.aktivnost
                 )
               ) FILTER (WHERE g.grad_naziv IS NOT NULL),
               '[]'
             ) as gradovi
      FROM drzave d
      LEFT JOIN gradovi g ON g.drzava = d.naziv
      WHERE LOWER(d.naziv) = LOWER($1)
      GROUP BY d.naziv
    `;
    
    const result = await con.query(query, [naziv]);
    
    if (result.rows.length === 0) {
      const error = ResponseWrapper.notFound(
        `Country with name "${naziv}" does not exist`,
        { requestedName: naziv }
      );
      return res.status(error._statusCode).json(error);
    }
    
    const drzava = result.rows[0];
    
    const response = ResponseWrapper.success(
      drzava,
      'Successfully fetched country'
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error in GET /api/drzave/:naziv:', err);
    const error = ResponseWrapper.serverError(
      'Failed to fetch country',
      { databaseError: err.message }
    );
    res.status(error._statusCode).json(error);
  }
});


app.get('/api/drzave/tip/:tipPutovanja', async (req, res) => {
  try {
    const { tipPutovanja } = req.params;
    
    const validTypes = ['samostalno', 'agencija'];
    if (!validTypes.includes(tipPutovanja.toLowerCase())) {
      const error = ResponseWrapper.badRequest(
        'Invalid travel type',
        { 
          providedType: tipPutovanja,
          validTypes: validTypes 
        }
      );
      return res.status(error._statusCode).json(error);
    }
    
    const query = `
      SELECT d.*
      FROM drzave d
      WHERE LOWER(d.tip_putovanja) = LOWER($1)
      ORDER BY d.naziv
    `;
    
    const result = await con.query(query, [tipPutovanja]);
    
    const response = ResponseWrapper.success(
      result.rows,
      `Found ${result.rowCount} countries with travel type: ${tipPutovanja}`,
      null,
      { travelType: tipPutovanja, count: result.rowCount }
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error:', err);
    const error = ResponseWrapper.serverError('Failed to fetch countries by travel type');
    res.status(error._statusCode).json(error);
  }
});

app.get('/api/drzave/jezik/:jezik', async (req, res) => {
  try {
    const { jezik } = req.params;
    
    if (!jezik || jezik.trim().length < 2) {
      const error = ResponseWrapper.badRequest(
        'Language parameter must be at least 2 characters long'
      );
      return res.status(error._statusCode).json(error);
    }
    
    const query = `
      SELECT d.*
      FROM drzave d
      WHERE LOWER(d.jezik) LIKE LOWER($1)
      ORDER BY d.naziv
    `;
    
    const result = await con.query(query, [`%${jezik}%`]);
    
    const response = ResponseWrapper.success(
      result.rows,
      `Found ${result.rowCount} countries with language containing: ${jezik}`,
      null,
      { language: jezik, count: result.rowCount }
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error:', err);
    const error = ResponseWrapper.serverError('Failed to fetch countries by language');
    res.status(error._statusCode).json(error);
  }
});

app.get('/api/statistika/godina/:godina', async (req, res) => {
  try {
    const { godina } = req.params;
    const year = parseInt(godina);
    
    if (isNaN(year) || year < 2000 || year > 2030) {
      const error = ResponseWrapper.badRequest(
        'Year must be a number between 2000 and 2030',
        { providedYear: godina, expectedRange: "2000-2030" }
      );
      return res.status(error._statusCode).json(error);
    }
    
    const query = `
      SELECT 
        COUNT(*) as broj_drzava,
        ROUND(AVG(ocjena), 2) as prosjecna_ocjena,
        SUM(broj_stanovnika) as ukupno_stanovnika,
        STRING_AGG(naziv, ', ') as drzave
      FROM drzave 
      WHERE godina_posjete = $1
    `;
    
    const result = await con.query(query, [year]);
    
    const response = ResponseWrapper.success(
      result.rows[0],
      `Statistics for year ${year}`,
      null,
      { year: year }
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error:', err);
    const error = ResponseWrapper.serverError('Failed to fetch statistics');
    res.status(error._statusCode).json(error);
  }
});

app.post('/api/drzave', async (req, res) => {
  try {
    const {
      naziv,
      glavni_grad,
      jezik,
      trajanje_putovanja,
      valuta,
      godina_posjete,
      tip_putovanja,
      prijevoz,
      ocjena,
      broj_stanovnika
    } = req.body;
    
    const checkQuery = 'SELECT naziv FROM drzave WHERE LOWER(naziv) = LOWER($1)';
    const checkResult = await con.query(checkQuery, [naziv]);
    
    if (checkResult.rows.length > 0) {
      const error = ResponseWrapper.conflict(
        `Country with name "${naziv}" already exists`
      );
      return res.status(error._statusCode).json(error);
    }
    
    const insertQuery = `
      INSERT INTO drzave (
        naziv, glavni_grad, jezik, trajanje_putovanja, 
        valuta, godina_posjete, tip_putovanja, prijevoz, 
        ocjena, broj_stanovnika
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      naziv,
      glavni_grad,
      jezik || null,
      trajanje_putovanja || null,
      valuta || null,
      godina_posjete || null,
      tip_putovanja || null,
      prijevoz || null,
      ocjena || null,
      broj_stanovnika || null
    ];
    
    const result = await con.query(insertQuery, values);
    
    const newCountry = result.rows[0];
    
    const response = ResponseWrapper.success(
      newCountry,
      'Country successfully created'
    );
    
    res.status(201).json(response);
    
  } catch (err) {
    console.error('Error in POST /api/drzave:', err); 
    
    const error = ResponseWrapper.serverError(
      'Failed to create country',
      { databaseError: err.message }
    );
    res.status(error._statusCode).json(error);
  }
});

app.put('/api/drzave/:naziv', async (req, res) => {
  try {
    const { naziv } = req.params;
    const updates = req.body;
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Nema podataka za ažuriranje",
        response: null
      });
    }
    
    const fields = [];
    const values = [];
    let index = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'naziv' && value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }
    
    if (fields.length === 0) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Nema valjanih polja za ažuriranje",
        response: null
      });
    }
    
    values.push(naziv); 
    
    const query = `
      UPDATE drzave 
      SET ${fields.join(', ')}
      WHERE LOWER(naziv) = LOWER($${values.length})
      RETURNING *
    `;
    
    const result = await con.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "Not Found",
        message: `Država "${naziv}" nije pronađena`,
        response: null
      });
    }
    
    res.json({
      status: "OK",
      message: "Država uspješno ažurirana",
      response: result.rows[0]
    });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      status: "Internal Server Error",
      message: "Greška pri ažuriranju države",
      response: null
    });
  }
});

app.delete('/api/drzave/:naziv', async (req, res) => {
  try {
    const { naziv } = req.params;
    
    const checkQuery = 'SELECT naziv FROM drzave WHERE LOWER(naziv) = LOWER($1)';
    const checkResult = await con.query(checkQuery, [naziv]);
    
    if (checkResult.rows.length === 0) {
      const error = ResponseWrapper.notFound(
        `Country with name "${naziv}" does not exist`
      );
      return res.status(error._statusCode).json(error);
    }
    
    await con.query('DELETE FROM gradovi WHERE LOWER(drzava) = LOWER($1)', [naziv]);
    
    const deleteQuery = 'DELETE FROM drzave WHERE LOWER(naziv) = LOWER($1) RETURNING *';
    const result = await con.query(deleteQuery, [naziv]);
    
    const response = ResponseWrapper.success(
      result.rows[0],
      'Country successfully deleted'
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error in DELETE /api/drzave/:naziv:', err);
    
    const error = ResponseWrapper.serverError(
      'Failed to delete country',
      { databaseError: err.message }
    );
    res.status(error._statusCode).json(error);
  }
});

app.patch('/api/drzave/:naziv', (req, res) => {
  const error = ResponseWrapper.notImplemented(
    'PATCH method is not implemented for this resource'
  );
  res.status(error._statusCode).json(error);
});

app.patch('/api/drzave', (req, res) => {
  const error = ResponseWrapper.notImplemented(
    'PATCH method is not implemented for collection'
  );
  res.status(error._statusCode).json(error);
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
    
    const response = ResponseWrapper.success(
      result.rows,
      `Successfully fetched ${result.rowCount} records`
    );
    
    res.json(response);
    
  } catch (err) {
    console.error('Error fetching data:', err);
    const error = ResponseWrapper.serverError('Failed to fetch data');
    res.status(error._statusCode).json(error);
  }
});

app.use('/api/*', (req, res) => {
  const error = ResponseWrapper.notFound(
    `API endpoint ${req.originalUrl} not found`,
    { requestedUrl: req.originalUrl, method: req.method }
  );
  res.status(error._statusCode).json(error);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  const error = ResponseWrapper.serverError(
    'An unexpected error occurred',
    { error: err.message }
  );
  
  res.status(error._statusCode).json(error);
});

app.use('/api/drzave', (req, res, next) => {
  if (req.method === 'TRACE' || req.method === 'CONNECT') {
    const error = ResponseWrapper.notImplemented(
      `${req.method} method is not allowed`
    );
    return res.status(error._statusCode).json(error);
  }
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});