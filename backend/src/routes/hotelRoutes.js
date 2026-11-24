const express = require('express');
const ctrl = require('../controllers/hotelController');
const upload = require('../middleware/upload');
const { validateCreate, validateUpdate } = require('../middleware/validateHotel');

const router = express.Router();

router.get('/', ctrl.getHotels);
router.post('/reset-defaults', ctrl.resetDefaults); // must stay above '/:id'
router.get('/:id', ctrl.getHotel);
router.post('/', upload, validateCreate, ctrl.createHotel);
router.put('/:id', upload, validateUpdate, ctrl.updateHotel);
router.delete('/:id', ctrl.deleteHotel);

module.exports = router;
