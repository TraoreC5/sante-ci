/**
 * Serveur Express principal — Santé CI API v1
 * 
 * Configuration: CORS, Helmet, JSON parsing, rate limiting, logging
 * Toutes les routes sous /api/v1
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authRoutes } from './routes/auth.routes';
import { patientRoutes } from './routes/patient.routes';
import { documentRoutes } from './routes/document.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { ephemeralRoutes } from './routes/ephemeral.routes';
import { clinicRoutes } from './routes/clinic.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

// === MIDDLEWARES GLOBAUX ===

// Sécurité HTTP headers
app.use(helmet());

// CORS — autoriser le mobile et les portails web
app.use(cors({
  origin: [
    'http://localhost:3000',   // Portail web médecin (Phase 3)
    'http://localhost:3002',   // Back-office admin (Phase 3)
    'http://localhost:8081',   // Expo dev server
    'exp://localhost:8081',    // Expo Go
  ],
  credentials: true,
}));

// Parsing JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes
app.use(morgan('dev'));

// Rate limiting global — 100 requêtes par minute par IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes. Veuillez réessayer dans un instant.',
    },
  },
});
app.use(globalLimiter);

// Rate limiting strict pour l'auth — 10 tentatives par minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT',
      message: 'Trop de tentatives de connexion. Veuillez patienter.',
    },
  },
});

// === HEALTH CHECK ===

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// === ROUTES ===

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/ephemeral', ephemeralRoutes);
app.use('/api/v1/clinics', clinicRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// === ERROR HANDLING ===

app.use(notFoundHandler);
app.use(errorHandler);

// === DÉMARRAGE ===

app.listen(PORT, () => {
  console.log(`\n🏥 Santé CI API v1`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Server:      http://localhost:${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/v1/health`);
  console.log(`   Ready!\n`);
});

export default app;
