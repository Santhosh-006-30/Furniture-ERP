module.exports = {
  apps: [
    {
      name: 'shiv-erp',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/opt/shiv-erp',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/shiv-erp/error.log',
      out_file: '/var/log/shiv-erp/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
    },
  ],
};
