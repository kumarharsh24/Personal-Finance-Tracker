require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connected');

    // Run migrations
    const [batch, migrations] = await db.migrate.latest();
    if (migrations.length > 0) {
      console.log(`✅ Ran ${migrations.length} migration(s) in batch ${batch}`);
    } else {
      console.log('✅ Database schema up to date');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Personal Finance Tracker running at http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);

    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running and the database exists.');
      console.error('   Create the database with: createdb finance_tracker');
      console.error('   Or update DB_* variables in your .env file.\n');
    }

    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await db.destroy();
  process.exit(0);
});

start();
