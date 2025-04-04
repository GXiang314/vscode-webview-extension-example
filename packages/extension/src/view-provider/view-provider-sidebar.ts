import { ExtensionContext, WebviewView, WebviewViewProvider } from 'vscode'
import { AbstractViewProvider, ControllerOptions } from './view-provider-abstract'

export class ViewProviderSidebar extends AbstractViewProvider implements WebviewViewProvider {
    constructor(context: ExtensionContext, controller: ControllerOptions) {
        super(context, controller, {
            distDir: 'out/view-sidebar',
            indexPath: 'out/view-sidebar/index.html',
        })
    }

    async resolveWebviewView(webviewView: WebviewView) {
        const { webview } = webviewView
        webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        }
        this.setControllers(webview)
        webview.html = await this.getWebviewHtml(webview)
    }
}
