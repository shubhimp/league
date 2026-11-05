module.exports = {
  apps: [
    {
      name: 'nerdsroom-league-api',
      script: './src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        JWT_SECRET: 'nerds-room-league-secret-key-1337-secure'
      }
    }
  ]
};
