// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "proviler" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('proviler.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from proviler!');
	});

	context.subscriptions.push(disposable);

	const provider = new CanvasViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            CanvasViewProvider.viewType,
            provider
        )
    );
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
							label: 'Sales',
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
