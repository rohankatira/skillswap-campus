
const dns = require('dns');
const mongoose = require('mongoose');

// Node's resolver on local Windows defaults to 127.0.0.1 (causing querySrv ECONNREFUSED for SRV records).
// Use public DNS servers safely; in cloud container environments (like Render), wrapped in try-catch.
try {
  const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (dnsServers.length > 0) {
    dns.setServers(dnsServers);
  }
} catch (err) {
  console.warn('DNS server override skipped:', err.message);
}

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
