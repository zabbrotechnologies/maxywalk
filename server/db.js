import https from 'https';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_HOST = 'ep-winter-poetry-berf36fh.c-9.us-east-2.aws.neon.tech';
const DEFAULT_PW = 'npg_SUFvwoDp2kq7';

const databaseUrl = process.env.DATABASE_URL || `postgresql://neondb_owner:${DEFAULT_PW}@${DEFAULT_HOST}/neondb?sslmode=require`;

// Derive HTTP SQL proxy host from databaseUrl (e.g., ep-xxx.c-9.us-east-2... -> api.c-9.us-east-2...)
let proxyHost = 'api.c-9.us-east-2.aws.neon.tech';
try {
  const u = new URL(databaseUrl.replace('postgresql://', 'http://'));
  proxyHost = u.hostname.replace(/^ep-[^.]+\./, 'api.');
} catch {}

dns.setServers(['8.8.8.8', '1.1.1.1']);

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      return callback(null, addresses.map(a => ({ address: a, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

const httpsAgent = new https.Agent({
  lookup: customLookup,
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: 10000
});

export function query(sql, params = [], retries = 1) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql, params });

    const execute = (attempt) => {
      const req = https.request({
        host: proxyHost,
        port: 443,
        path: '/sql',
        method: 'POST',
        agent: httpsAgent,
        headers: {
          'Host': proxyHost,
          'Neon-Connection-String': databaseUrl,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              reject(new Error(parsed.message || body));
            } else {
              resolve(parsed.rows || []);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.setTimeout(15000, () => {
        req.destroy(new Error('Neon SQL query timed out after 15000ms'));
      });

      req.on('error', (err) => {
        if (attempt < retries && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.message?.includes('timed out'))) {
          setTimeout(() => execute(attempt + 1), 200);
        } else {
          reject(err);
        }
      });

      req.write(payload);
      req.end();
    };

    execute(0);
  });
}

export default { query };
