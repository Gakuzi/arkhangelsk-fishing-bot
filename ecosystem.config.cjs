const path = require('path');
const fs = require('fs');

const venvPython = path.join(__dirname, 'venv', 'bin', 'python');
const interpreter = fs.existsSync(venvPython) ? venvPython : 'python3';

module.exports = {
  apps: [
    {
      name: 'fishing-bot',
      script: 'bot.py',
      cwd: __dirname,
      interpreter: interpreter,
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

