//const { app, BrowserWindow, ipcMain } = require('electron');
//const { spawn } = require('child_process');
//const path = require('path');
//
//let mainWindow;
//
//function createWindow() {
//  mainWindow = new BrowserWindow({
//    width: 1400,
//    height: 900,
//    webPreferences: {
//      nodeIntegration: true,
//      contextIsolation: false
//    },
//    titleBarStyle: 'default',
//    title: 'macOS Gateway Monitor',
//    show: false
//  });
//
//  mainWindow.loadFile('index.html');
//  mainWindow.maximize();
//  mainWindow.show();
//
//  if (process.argv.includes('--dev')) {
//    mainWindow.webContents.openDevTools();
//  }
//}
//
//// Get detailed process info with full paths - FIXED
//ipcMain.handle('get-processes', async () => {
//  return new Promise((resolve) => {
//    const ps = spawn('ps', ['-eo', 'pid,ppid,pcpu,pmem,rss,vsz,time,user,comm,args']);
//    let output = '';
//
//    ps.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    ps.on('close', () => {
//      const lines = output.split('\n').slice(1);
//      const processes = lines.map(line => {
//        if (line.trim()) {
//          const parts = line.trim().split(/\s+/);
//          if (parts.length >= 10) {
//            return {
//              pid: parts[0],
//              ppid: parts[1],
//              cpu: parts[2],
//              mem: parts[3],
//              rss: parts[4],
//              vsz: parts[5],
//              time: parts[6],
//              user: parts[7],
//              comm: parts[8],
//              args: parts.slice(9).join(' ') || parts[8]
//            };
//          }
//        }
//      }).filter(Boolean);
//      resolve(processes);
//    });
//  });
//});
//
//// Get process network connections
//ipcMain.handle('get-process-connections', async (event, pid) => {
//  return new Promise((resolve) => {
//    const lsof = spawn('lsof', ['-Pan', '-p', pid, '-i']);
//    let output = '';
//
//    lsof.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    lsof.on('close', () => {
//      const lines = output.split('\n').slice(1);
//      const connections = lines.map(line => {
//        const parts = line.trim().split(/\s+/);
//        if (parts.length >= 9) {
//          return {
//            name: parts[0],
//            pid: parts[1],
//            user: parts[2],
//            fd: parts[3],
//            type: parts[4],
//            device: parts[5],
//            size: parts[6],
//            node: parts[7],
//            name_addr: parts[8]
//          };
//        }
//      }).filter(Boolean);
//      resolve(connections);
//    });
//  });
//});
//
//// Get process file descriptors
//ipcMain.handle('get-process-fds', async (event, pid) => {
//  return new Promise((resolve) => {
//    const lsof = spawn('lsof', ['-p', pid]);
//    let output = '';
//
//    lsof.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    lsof.on('close', () => {
//      const lines = output.split('\n').slice(1);
//      const fds = lines.map(line => {
//        const parts = line.trim().split(/\s+/);
//        if (parts.length >= 9) {
//          return {
//            command: parts[0],
//            pid: parts[1],
//            user: parts[2],
//            fd: parts[3],
//            type: parts[4],
//            device: parts[5],
//            size: parts[6],
//            node: parts[7],
//            name: parts.slice(8).join(' ')
//          };
//        }
//      }).filter(Boolean);
//      resolve(fds);
//    });
//  });
//});
//
//// Get network statistics and routing table
//ipcMain.handle('get-netstat', async () => {
//  return new Promise((resolve) => {
//    const netstat = spawn('netstat', ['-rn']);
//    let output = '';
//
//    netstat.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    netstat.on('close', () => {
//      resolve(output);
//    });
//  });
//});
//
//// Get interface statistics
//ipcMain.handle('get-ifconfig', async () => {
//  return new Promise((resolve) => {
//    const ifconfig = spawn('ifconfig', ['-a']);
//    let output = '';
//
//    ifconfig.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    ifconfig.on('close', () => {
//      resolve(output);
//    });
//  });
//});
//
//// Get ARP table
//ipcMain.handle('get-arp', async () => {
//  return new Promise((resolve) => {
//    const arp = spawn('arp', ['-a']);
//    let output = '';
//
//    arp.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    arp.on('close', () => {
//      resolve(output);
//    });
//  });
//});
//
//// Get DNS configuration
//ipcMain.handle('get-dns', async () => {
//  return new Promise((resolve) => {
//    const scutil = spawn('scutil', ['--dns']);
//    let output = '';
//
//    scutil.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    scutil.on('close', () => {
//      resolve(output);
//    });
//  });
//});
//
//// Get network usage per process using nettop
//ipcMain.handle('get-network-usage', async () => {
//  return new Promise((resolve) => {
//    const nettop = spawn('nettop', ['-P', '-l', '1', '-t', 'wifi,wired']);
//    let output = '';
//
//    nettop.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    nettop.on('close', () => {
//      const lines = output.split('\n');
//      const processes = [];
//
//      lines.forEach(line => {
//        const match = line.match(/(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)/);
//        if (match) {
//          processes.push({
//            pid: match[1],
//            bytes_in: match[2],
//            bytes_out: match[3],
//            packets_in: match[4],
//            packets_out: match[5],
//            cc: match[6],
//            process: match[7]
//          });
//        }
//      });
//
//      resolve(processes);
//    });
//
//    // Kill after 3 seconds
//    setTimeout(() => nettop.kill(), 3000);
//  });
//});
//
//// Get process bandwidth using netstat with PID
//ipcMain.handle('get-process-bandwidth', async (event, pid) => {
//  return new Promise((resolve) => {
//    const lsof = spawn('lsof', ['-Pan', '-p', pid, '-i']);
//    let output = '';
//
//    lsof.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    lsof.on('close', () => {
//      // Parse network connections and estimate bandwidth
//      const connections = output.split('\n').filter(line =>
//        line.includes('TCP') || line.includes('UDP')
//      ).map(line => {
//        const parts = line.trim().split(/\s+/);
//        return {
//          protocol: parts[4],
//          local: parts[8],
//          remote: parts[8]?.includes('->') ? parts[8].split('->')[1] : 'N/A',
//          state: parts[9] || 'N/A'
//        };
//      });
//
//      resolve(connections);
//    });
//  });
//});
//
//// Get network connections
//ipcMain.handle('get-network', async () => {
//  return new Promise((resolve) => {
//    const netstat = spawn('netstat', ['-anv']);
//    let output = '';
//
//    netstat.stdout.on('data', (data) => {
//      output += data.toString();
//    });
//
//    netstat.on('close', () => {
//      const lines = output.split('\n').slice(2);
//      const connections = lines.map(line => {
//        const parts = line.trim().split(/\s+/);
//        if (parts.length >= 6) {
//          return {
//            proto: parts[0],
//            local: parts[3],
//            foreign: parts[4],
//            state: parts[5]
//          };
//        }
//      }).filter(Boolean);
//      resolve(connections);
//    });
//  });
//});
//
//app.whenReady().then(createWindow);
//
//app.on('window-all-closed', () => {
//  app.quit();
//});
//
//app.on('activate', () => {
//  if (BrowserWindow.getAllWindows().length === 0) {
//    createWindow();
//  }
//});
