import { ExtensionContext, Uri, Webview, WebviewPanel, WebviewView } from 'vscode'
import { readFileSync } from 'fs'
import { join } from 'path'
import { modifyHtml } from 'html-modifier'
import { CallHandler, CecServer, SubscribleHandler } from 'cec-client-server'

export type ViewProviderOptions = {
    distDir: string
    indexPath: string
}

export type ControllerOptions = {
    callables: { [name: string]: CallHandler }
    subscribables: { [name: string]: SubscribleHandler }
}

export abstract class AbstractViewProvider {
    // 這個是在前端應用插入程式碼的 Flag，用於在 index.html 文件對應的位置插入內容
    static WEBVIEW_INJECT_IN_MARK = '__webview_public_path__'

    /**
     * 建構子
     * @param context 該插件的上下文，在插件啟動時可以取得
     * @param controllerOptions
     * @param viewProviderOptions 相關配置
     */
    constructor(
        protected context: ExtensionContext,
        protected controllerOptions: ControllerOptions,
        protected viewProviderOptions: ViewProviderOptions,
    ) {}

    /**
     * 用於實現 webviewView 的處理邏輯，例如：html 賦值、通訊、設置 webviewView 參數等
     * @param webviewView 可以為 vscode.WebviewView 或者 vscode.WebviewPanel 的實例
     */
    abstract resolveWebviewView(webviewView: WebviewView | WebviewPanel): void

    /**
     * 新增一個 CecServer 實例，並設置相關的 callable 和 subscribable
     * @param webviewView 可以為 vscode.WebviewView 或者 vscode.WebviewPanel 的實例
     */
    protected setControllers(webview: Webview) {
        const cecServer = new CecServer(webview.postMessage.bind(webview), webview.onDidReceiveMessage.bind(webview))
        const { callables, subscribables } = this.controllerOptions
        Object.entries(callables).forEach((item) => cecServer.onCall(...item))
        Object.entries(subscribables).forEach((item) => cecServer.onSubscribe(...item))
    }

    /**
     * 處理前端應用 index.html 文件的方法
     * @param webview vscode.Webview 類型，指向 vscode.WebviewView 的一個屬性：webview
     * @returns 處理好的 index.html 文本內容
     */
    protected async getWebviewHtml(webview: Webview) {
        const { distDir, indexPath } = this.viewProviderOptions
        // 前端應用的打包結果所在的目錄，形如：https://file%2B.vscode-resource.vscode-cdn.net/d%3A/AAAAA/self/vscode-webview-example/packages/extension/out/view-sidebar
        const webviewUri = webview.asWebviewUri(Uri.joinPath(this.context.extensionUri, distDir)).toString()
        // 需要在前端應用中插入的變數，目的是：將上述 webviewUri 所指的目錄告知前端應用，前端應用在定位資源時需要
        const injectInContent = `<script> window.${AbstractViewProvider.WEBVIEW_INJECT_IN_MARK} = "${webviewUri}"</script>`

        const htmlPath = join(this.context.extensionPath, indexPath)
        // 讀取 index.html 文件內容
        const htmlText = readFileSync(htmlPath).toString()
        // 使用 html-modifier 套件來處理讀取的內容，主要的作用是：1、將 script、link 標籤中的 src、href 的值，重新賦予正確的值，2、將上述 injectInContent 的內容插入讀取的內容中
        return await modifyHtml(htmlText, {
            onopentag(name, attribs) {
                if (name === 'script') {
                    attribs.src = join(webviewUri, attribs.src)
                }
                if (name === 'link') {
                    attribs.href = join(webviewUri, attribs.href)
                }
                return { name, attribs }
            },
            oncomment(data) {
                const hasMark = data?.toString().toLowerCase().includes(AbstractViewProvider.WEBVIEW_INJECT_IN_MARK)
                return hasMark ? { data: injectInContent, clearComment: true } : { data }
            },
        })
    }
}
