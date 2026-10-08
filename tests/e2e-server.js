import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

const server = createServer(async (request, response) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end('Bad request');
        return;
    }

    const requestedPath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.resolve(projectRoot, `.${requestedPath}`);
    if (!filePath.startsWith(`${projectRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    try {
        const content = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        response.end(content);
    } catch (error) {
        const status = error.code === 'ENOENT' ? 404 : 500;
        response.writeHead(status).end(status === 404 ? 'Not found' : 'Server error');
    }
});

server.listen(4174, '127.0.0.1');
