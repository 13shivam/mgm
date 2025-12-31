//const http = require('http');
//const { spawn } = require('child_process');
//const fs = require('fs');
//const path = require('path');
//
//const PORT = 3000;
//
//// Get system processes
//function getProcesses() {
//    return new Promise((resolve) => {
//        const ps = spawn('ps', ['-eo', 'pid,ppid,pcpu,pmem,comm,args']);
//        let output = '';
//
//        ps.stdout.on('data', (data) => {
//            output += data.toString();
//        });
//
//        ps.on('close', () => {
//            const lines = output.split('\n').slice(1);
//            const processes = lines.map(line => {
//                const parts = line.trim().split(/\s+/);
//                if (parts.length >= 6) {
//                    return {
//                        pid: parts[0],
//                        ppid: parts[1],
//                        cpu: parts[2],
//                        mem: parts[3],
//                        comm: parts[4],
//                        args: parts.slice(5).join(' ')
//                    };
//                }
//            }).filter(Boolean);
//            resolve(processes);
//        });
//    });
//}
//
//// Get network connections
//function getNetwork() {
//    return new Promise((resolve) => {
//        const netstat = spawn('netstat', ['-anv']);
//        let output = '';
//
//        netstat.stdout.on('data', (data) => {
//            output += data.toString();
//        });
//
//        netstat.on('close', () => {
//            const lines = output.split('\n').slice(2);
//            const connections = lines.map(line => {
//                const parts = line.trim().split(/\s+/);
//                if (parts.length >= 6) {
//                    return {
//                        proto: parts[0],
//                        local: parts[3],
//                        foreign: parts[4],
//                        state: parts[5]
//                    };
//                }
//            }).filter(Boolean);
//            resolve(connections);
//        });
//    });
//}
//
//const server = http.createServer(async (req, res) => {
//    res.setHeader('Access-Control-Allow-Origin', '*');
//
//    if (req.url === '/') {
//        const html = fs.readFileSync(path.join(__dirname, 'monitor.html'), 'utf8');
//        res.writeHead(200, { 'Content-Type': 'text/html' });
//        res.end(html);
//    } else if (req.url === '/api/processes') {
//        const processes = await getProcesses();
//        res.writeHead(200, { 'Content-Type': 'application/json' });
//        res.end(JSON.stringify(processes));
//    } else if (req.url === '/api/network') {
//        const network = await getNetwork();
//        res.writeHead(200, { 'Content-Type': 'application/json' });
//        res.end(JSON.stringify(network));
//    } else {
//        res.writeHead(404);
//        res.end('Not Found');
//    }
//});
//
//server.listen(PORT, () => {
//    console.log(`macOS Gateway Monitor running at http://localhost:${PORT}`);
//    console.log('Press Ctrl+C to exit');
//});
//
//// Handle graceful shutdown
//process.on('SIGINT', () => {
//    console.log('\nShutting down server...');
//    server.close(() => {
//        process.exit(0);
//    });
//});
