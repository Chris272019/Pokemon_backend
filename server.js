const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');

// Create Express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Load data from db.json
let db = {};
const loadDb = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf8');
    db = JSON.parse(data);
    console.log('Database loaded successfully');
  } catch (error) {
    console.error('Error loading database:', error);
    db = { pokemon: [] };
  }
};

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/pokemon', async (req, res) => {
  try {
    await loadDb();
    res.json(db.pokemon || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pokemon' });
  }
});

app.get('/api/pokemon/:id', async (req, res) => {
  try {
    await loadDb();
    const pokemon = db.pokemon?.find(p => p.id === parseInt(req.params.id));
    if (pokemon) {
      res.json(pokemon);
    } else {
      res.status(404).json({ error: 'Pokemon not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pokemon' });
  }
});

app.post('/api/pokemon', async (req, res) => {
  try {
    await loadDb();
    const newPokemon = req.body;
    db.pokemon = db.pokemon || [];
    db.pokemon.push(newPokemon);
    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
    res.status(201).json(newPokemon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pokemon' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3004;

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 