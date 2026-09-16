module.exports = {
  apps: [
    {
      name: 'fishing-app',
      script: 'server.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
