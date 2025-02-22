export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni-platform',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '10h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM || 'noreply@alumni-platform.com',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:4200',
  },
});