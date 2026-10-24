
const dns = require('dns');
const mongoose = require('mongoose');

// Node's resolver on this machine defaults to 127.0.0.1 (no DNS listener there),
// which breaks the SRV lookup required by `mongodb+srv://` URIs (querySrv ECONNREFUSED).
// Use public DNS servers instead; override with DNS_SERVERS="ip1,ip2" in .env if needed.
const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
dns.setServers(dnsServers);

async function connectDB() {
  // Mongoose caches the connection internally.
  // In serverless environments each warm invocation reuses the same socket.
  if (mongoose.connection.readyState >= 1) {
    return; // already connected or connecting
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from environment variables');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Atlas connected successfully');
}

module.exports = connectDB;
