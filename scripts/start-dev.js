import { spawn } from 'child_process';
import net from 'net';

const START_PORT = 3001;
const MAX_PORT = 3100;

const checkPort = (port) => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                reject(err);
            }
        });
        server.once('listening', () => {
            server.close(() => {
                resolve(true);
            });
        });
        server.listen(port);
    });
};

const findAvailablePort = async (startPort) => {
    for (let port = startPort; port <= MAX_PORT; port++) {
        const isAvailable = await checkPort(port);
        if (isAvailable) {
            return port;
        }
    }
    throw new Error(`No available ports found between ${START_PORT} and ${MAX_PORT}`);
};

const startServices = async () => {
    try {
        const port = await findAvailablePort(START_PORT);
        console.log(`\n🚀 Found available port: ${port}`);
        console.log(`   Configuring Backend and Frontend to use port ${port}...\n`);

        // Set environment variables for child processes
        const backendEnv = {
            ...process.env,
            PORT: port.toString(),
            BACKEND_PORT: port.toString(),
            IS_AUTOMATED: 'true'
        };

        // Environment for Frontend (Needs VITE_API_PORT for Proxy and VITE_API_URL for direct access)
        const frontendEnv = {
            ...process.env,
            VITE_API_PORT: port.toString(),
            VITE_API_URL: `http://localhost:${port}`
        };

        // Start Backend
        const backend = spawn('node', ['api/index.js'], {
            stdio: 'inherit',
            env: backendEnv
        });

        // Start Frontend
        const frontend = spawn('npm', ['run', 'start'], {
            stdio: 'inherit',
            env: frontendEnv
        });

        // Handle cleanup
        const cleanup = () => {
            backend.kill();
            frontend.kill();
            process.exit();
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error('Failed to start services:', error);
        process.exit(1);
    }
};

startServices();
