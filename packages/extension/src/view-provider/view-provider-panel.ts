import { ExtensionContext, WebviewPanel } from 'vscode'
import { AbstractViewProvider, ControllerOptions } from './view-provider-abstract'

export class ViewProviderPanel extends AbstractViewProvider {
    constructor(context: ExtensionContext, controller: ControllerOptions) {
        super(context, controller, {
            distDir: 'out/view-panel',
            indexPath: 'out/view-panel/index.html',
        })
    }

    async resolveWebviewView(webviewView: WebviewPanel) {
        const { webview } = webviewView
        webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        }
        this.setControllers(webview)
        webview.html = await this.getWebviewHtml(webview)
    }
}
