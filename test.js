const { spawn } = require('child_process');
const child = spawn('python3', ['bot.py']);
child.stdout.on('data', data => console.log(data.toString()));
child.stderr.on('data', data => console.error(data.toString()));
