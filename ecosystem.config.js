// PM2 ecosystem config — runs the Truth Archive Node.js server
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save                          (persist across reboots)
//   pm2 startup                       (generate OS startup command)

module.exports = {
  apps: [
    {
      name: 'truth-archive',
      script: 'server.js',
      instances: 1,          // single instance — upgrade to 'max' if CPU-bound
      exec_mode: 'fork',

      // Env vars for production — the real secrets live in /etc/truth-archive.env
      // loaded by the deploy script via: pm2 start ... --env production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Restart policy
      autorestart:      true,
      watch:            false,
      max_memory_restart: '300M',

      // Log paths
      output:    '/var/log/truth-archive/out.log',
      error:     '/var/log/truth-archive/err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
