nclude details about:

Server specifications
Installed software and versions
Deployment process
Backup and restore procedures
Monitoring and maintenance
Troubleshooting common issues

MongoDB Connection Issues
If you have trouble connecting to MongoDB:
sudo systemctl status mongod
sudo cat /var/log/mongodb/mongod.log

Nginx Issues
Check Nginx error logs:

sudo tail -f /var/log/nginx/error.log
Application Issues
Check PM2 logs:

pm2 logs iptv-api
SSL Certificate Issues
Check Certbot logs:
sudo certbot renew --dry-run
Maintenance Tasks
Regular Updates
sudo apt update
sudo apt upgrade -y
Renew SSL Certificates
Certbot should automatically renew certificates, but you can manually trigger a renewal:
sudo certbot renew
Database Maintenance
mongosh
use iptv-manager
db.runCommand({ compact: 'channels' })

