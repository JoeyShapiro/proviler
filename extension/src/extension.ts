// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as pty from 'node-pty';

class State {
	name: string;
	pid: number;
	paused: boolean;
	process: pty.IPty | null = null;

	constructor(name: string, pid: number, paused: boolean) {
		this.name = name;
		this.pid = pid;
		this.paused = paused;
	}
}

var state = new State('', 0, false);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new CanvasViewProvider(context.extensionUri);

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
				console.log(data);
			});

			state.process.onExit(({ exitCode, signal }) => {
				console.log(`Process exited with code ${exitCode}`);
			});
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
        // Check for stopped event
        if (message.type === 'event') {
			switch (message.event) {
				case 'stopped':
					this.onPause(message.body);
					break;
				case 'continued':
					this.onResume(message.body);
					break;
				case 'process':
					this.onProcess(message.body);
					break;
				default:
					break;
			}
        }
    }

	private onProcess(body: any): void {
		console.debug(`Process - Name: ${body.name}, System ID: ${body.systemProcessId}`);
		state.name = body.name;
		state.pid = body.systemProcessId;
	}

    private onPause(body: any): void {
		console.debug(`Paused - Reason: ${body.reason}, Thread: ${body.threadId}`);
		state.paused = true;
    }

    private onResume(body: any): void {
        console.debug('Resumed execution', body);
		state.paused = false;
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}

export class CanvasViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'proviler';

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

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'canvasClick':
                    vscode.window.showInformationMessage(`Clicked at ${data.x}, ${data.y}`);
                    break;
            }
        });
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
                body {
                    padding: 0;
                    margin: 0;
                    overflow: hidden;
                }
                canvas {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
            </style>
        </head>
        <body>
            <canvas id="myCanvas"></canvas>
            <script>
                const vscode = acquireVsCodeApi();
                const canvas = document.getElementById('myCanvas');
                const ctx = canvas.getContext('2d');

                // Resize canvas to fill the view
                function resizeCanvas() {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    draw();
                }

                function draw() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#007acc';
                    ctx.fillRect(10, 10, 100, 100);
                }

                canvas.addEventListener('click', (e) => {
                    vscode.postMessage({
                        type: 'canvasClick',
                        x: e.offsetX,
                        y: e.offsetY
                    });
                });

                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();

				new Chart(canvas, {
					type: 'line',
					data: {
						labels: ['January', 'February', 'March', 'April', 'May', 'June'],
						datasets: [{
							label: 'CPU Usage (%)',
							data: [12, 19, 3, 5, 2, 3],
							borderColor: 'rgb(75, 192, 192)',
							backgroundColor: 'rgba(75, 192, 192, 0.2)',
							tension: 0.1
						}]
					},
					options: {
						responsive: true,
						plugins: {
							title: {
								display: true,
								text: 'Monthly Sales Data'
							}
						},
						scales: {
							y: {
								beginAtZero: true
							}
						}
					}
				});
            </script>
        </body>
        </html>`;
    }
}
