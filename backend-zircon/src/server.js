import 'dotenv/config';
import app from './app.js';
import db from './config/database.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');

    // Run migrations in development (optional - can be run manually)
    if (process.env.NODE_ENV === 'development' && process.env.AUTO_MIGRATE === 'true') {
      console.log('🔄 Running migrations...');
      await db.migrate.latest();
      console.log('✅ Migrations completed');
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 Zircon API Server                      ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(43)} ║
║  Server:      http://${HOST}:${PORT}`.padEnd(51) + `║
║  Health:      http://${HOST}:${PORT}/health`.padEnd(51) + `║
║  API Base:    http://${HOST}:${PORT}/api`.padEnd(51) + `║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await db.destroy();
        console.log('✅ Database connection closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();