module.exports = {
  apps: [
    {
      name: 'cacheiro',
      script: 'dist/cacheiro.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
