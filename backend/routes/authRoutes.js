const express = require('express');
const router = express.Router();
const { register, login, updateUser, deleteUser } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.put('/update/:id', updateUser);       // ← Edit profile
router.delete('/delete/:id', deleteUser);    // ← Delete account

module.exports = router;