module.exports = {
  apps: [
    {
      name: 'fishing-bot',
      script: 'bot.py',
      interpreter: './venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        PYTHONUNBUFFERED: '1'
      }
    }
  ]
};
