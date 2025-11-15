// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as pty from 'node-pty';

class State {
	name: string;
	pid: number;
	paused: boolean;
	process: pty.IPty | null = null;
	startedAt: number = Date.now();
	usageLog: Usage[] = [];

	constructor(name: string, pid: number, paused: boolean) {
		this.name = name;
		this.pid = pid;
		this.paused = paused;
	}

	log(timestamp: number, cpu: number, memory: number) {
		this.usageLog.push(new Usage(timestamp, cpu, memory));

		if (this.usageLog.length > 30) {
			this.usageLog.shift();
		}
	}
}

class Usage {
	timestamp: number = 0;
	cpu: number = 0;
	memory: number = 0;

	constructor(timestamp: number, cpu: number, memory: number) {
		this.timestamp = timestamp;
		this.cpu = cpu;
		this.memory = memory;
	}
}

var state = new State('', 0, false);
var provider: CanvasViewProvider | null = null;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	provider = new CanvasViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CanvasViewProvider.viewType,
            provider
        )
    );

	// debugger hooks
    // Before debug session starts (can modify configuration)
    context.subscriptions.push(
        vscode.debug.onDidStartDebugSession((session) => {
            console.debug('Started:', session);

			state.process = pty.spawn('/Users/oniichan/Documents/Code/proviler/target/release/proviler', ['-u', '-p', String(state.pid)], {
				name: 'xterm-color',
				cols: 80,
				rows: 30,
				cwd: vscode.workspace.rootPath || process.cwd(),
				env: process.env
			});

			state.process.onData((data) => {
				let cols = data.split(' ');
				if (cols.length < 3) {
					return;
				}

				state.log(parseInt(cols[0]), parseFloat(cols[1]), parseFloat(cols[2]));
				provider!.post({
					command: 'update',
					labels: state.usageLog.map(u => (u.timestamp - state.startedAt)/1000),
					cpu: state.usageLog.map(u => u.cpu),
					memory: state.usageLog.map(u => u.memory)
				});
			});

			state.process.onExit(({ exitCode, signal }) => {});
        })
    );

    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession((session) => {
            console.debug('Terminated:', session.name);
			if (state.process) {
				state.process.write('q'); // send quit command
				state.process.kill();
				state.process = null;
			}

			state = new State('', 0, false);
        })
    );

    context.subscriptions.push(
        vscode.debug.onDidChangeActiveDebugSession((session) => {
            console.warn('Active session changed:', session?.name);
        })
    );

	// Register a debug adapter tracker factory
    const trackerFactory = new GoDebugAdapterTrackerFactory();
    
    context.subscriptions.push(
        vscode.debug.registerDebugAdapterTrackerFactory('go', trackerFactory)
    );

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "proviler" is now active!');
}

class GoDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        return new GoDebugAdapterTracker();
    }
}

class GoDebugAdapterTracker implements vscode.DebugAdapterTracker {
    onDidSendMessage(message: any): void {
		console.log('Sent message:', message);
        // Check for stopped event
        if (message.type === 'event') {
			switch (message.event) {
				case 'stopped':
					this.onPause(message.body);
					break;
				case 'continued':
					this.onStep(message.body);
					break;
				case 'process':
					this.onProcess(message.body);
					break;
				default:
					break;
			}
        } else if (message.type === 'response') {
			switch (message.command) {
				case 'continue':
					this.onContinue(message.body);
					break;
				default:
					break;
			}
		}
    }

	onWillReceiveMessage(message: any): void {
		console.debug('Will receive message:', message);
	}

	private onProcess(body: any): void {
		console.debug(`Process - Name: ${body.name}, System ID: ${body.systemProcessId}`);
		state.name = body.name;
		state.pid = body.systemProcessId;
	}

    private onPause(body: any): void {
		console.debug(`Paused - Reason: ${body.reason}, Thread: ${body.threadId}`);

		if (state.paused) {
			return;
		}

		state.paused = true;
		state.process?.write(' ');
    }

	private onContinue(body: any): void {
		if (!state.paused || body.success === false) {
			return;
		}

		state.paused = false;
		state.process?.write(' ');
	}

    private onStep(body: any): void {
		state.process?.write('s');
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}

export class CanvasViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'proviler';
    private _webviewView?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		this._webviewView = webviewView;
    }

	public post(message: any) {
		if (!this._webviewView) {
			return;
		}

		this._webviewView.webview.postMessage(message);
	}

    private _getHtmlForWebview(webview: vscode.Webview) {
		// TODO https://github.com/leeoniya/uPlot?tab=readme-ov-file#performance
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
			<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                html, body {
                    padding: 0;
                    margin: 0;
					height: 100%;
                }

                div {
                    width: 100%;
                    height: 50%;
                }

                canvas {
                    display: block;
					height: 100%;
                    width: 100%;
                }
            </style>
        </head>
        <body>
            <div><canvas id="canvasCpu"></canvas></div>
            <div><canvas id="canvasMem"></canvas></div>
            <script>
                const vscode = acquireVsCodeApi();
                const canvasCpu = document.getElementById('canvasCpu');
				const canvasMem = document.getElementById('canvasMem');

				const options = {
					maintainAspectRatio: false,
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: '${state.name}'
						}
					},
					scales: {
						y: {
							beginAtZero: true
						}
					}
				};

				let chartCpu = new Chart(canvasCpu, {
					type: 'line',
					data: {
						labels: [],
						datasets: [{
							label: 'CPU Usage (%)',
							data: [],
							borderColor: 'rgb(75, 192, 192)',
							backgroundColor: 'rgba(75, 192, 192, 0.2)',
							tension: 0.1
						}]
					},
					options: options
				});

				let chartMem = new Chart(canvasMem, {
					type: 'line',
					data: {
						labels: [],
						datasets: [{
							label: 'Memory Usage (MiB)',
							data: [],
							borderColor: 'rgb(75, 192, 192)',
							backgroundColor: 'rgba(75, 192, 192, 0.2)',
							tension: 0.1
						}]
					},
					options: options
				});

				window.addEventListener('message', event => {
                    const message = event.data;

                    switch (message.command) {
                        case 'update':
							chartCpu.data.labels = message.labels;
							chartCpu.data.datasets[0].data = message.cpu;
							chartCpu.update();

							chartMem.data.labels = message.labels;
							chartMem.data.datasets[0].data = message.memory;
							chartMem.update();
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
