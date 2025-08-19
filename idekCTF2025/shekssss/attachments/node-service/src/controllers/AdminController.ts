import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import fetch from 'node-fetch';
import { DatabaseService } from '../services/DatabaseService';
import dns from 'dns/promises';
import net from 'net';

function isPrivateIp(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.') && (() => {
      const second = parseInt(ip.split('.')[1], 10);
      return second >= 16 && second <= 31;
    })() ||
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('169.254.') ||
    ip.startsWith('::1') ||
    ip.startsWith('fc') || ip.startsWith('fd') // IPv6 ULA
  );
}

export class AdminController {
  constructor(private databaseService: DatabaseService) {}

  // POST /api/admin/fetch-url
  fetchUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.isAdmin) {
        res.status(403).json({ error: 'Admin only' });
        return;
      }
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Missing or invalid url' });
        return;
      }
      // DNS resolution
      let hostname;
      try {
        hostname = new URL(url).hostname;
      } catch {
        res.status(400).json({ error: 'Invalid URL' });
        return;
      }
      let addresses;
      try {
        addresses = await dns.lookup(hostname, { all: true });
      } catch {
        res.status(400).json({ error: 'DNS resolution failed' });
        return;
      }
      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          res.status(400).json({ error: `Blocked: IP resolves to internal/private address : ${addr.address}` });
          return;
        }
      }
      // SSRF vulnerable fetch
      const response = await fetch(url, { redirect: 'follow', timeout: 5000 });
      const contentType = response.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }
      res.json({ status: response.status, headers: Object.fromEntries(response.headers.entries()), body });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch url' });
    }
  };

  // GET /api/admin/users
  listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.isAdmin) {
        res.status(403).json({ error: 'Admin only' });
        return;
      }
      const users = await this.databaseService.getAllUsers();
      res.json(users.map(({ passwordHash, ...user }) => user));
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list users' });
    }
  };
} 
