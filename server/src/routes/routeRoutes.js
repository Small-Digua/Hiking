const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (if any)
// None, this is admin API.

// Protected routes
router.use(authMiddleware);

router.get('/', routeController.getRoutes);
router.post('/', routeController.createRoute);
router.put('/:id', routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);

module.exports = router;
