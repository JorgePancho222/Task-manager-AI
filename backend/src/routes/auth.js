// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Generar JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor proporciona nombre, email y contraseña' 
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este email ya está registrado' 
      });
    }

    // Crear nuevo usuario
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    await user.save();

    // Generar token
    const token = generateToken(user._id);

    // Log de registro exitoso
    console.log(`[AUTH] Nuevo usuario registrado: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages[0] || 'Error de validación'
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario. Por favor intenta nuevamente.' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor proporciona email y contraseña' 
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Generar token
    const token = generateToken(user._id);

    // Log de login exitoso
    console.log(`[AUTH] Login exitoso: ${user.email}`);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión. Por favor intenta nuevamente.' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // El usuario ya está disponible en req.user gracias al middleware
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfil de usuario' 
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Actualizar perfil de usuario
// @access  Private
router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre debe tener al menos 2 caracteres' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user }
    });
  } catch (error) {
    console.error('[AUTH ERROR] Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil' 
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Cambiar contraseña
// @access  Private
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Por favor proporciona ambas contraseñas' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const user = await User.findById(req.userId);
    
    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Contraseña actual incorrecta' 
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    console.log(`[AUTH] Contraseña cambiada para usuario: ${user.email}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('[AUTH ERROR] Error al cambiar contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar contraseña' 
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verificar si un token es válido
// @access  Public
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
});

module.exports = router;