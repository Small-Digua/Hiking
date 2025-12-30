const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const routeRoutes = require('./routes/routeRoutes');
const cityRoutes = require('./routes/cityRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // Public auth routes
app.use('/api/users', userRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/cities', cityRoutes);

app.get('/', (req, res) => {
  res.send('Hiking Tracker Admin API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
