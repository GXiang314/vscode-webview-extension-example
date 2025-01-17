import 'reflect-metadata'
import './service-registry'
import './contoller-registry'
import { ExtensionContext, ViewColumn, commands, window } from 'vscode'
import { ViewProviderSidebar } from './view-provider/view-provider-sidebar'
import { ViewProviderPanel } from './view-provider/view-provider-panel'
import { getControllers } from 'cec-client-server/decorator'
import { VSCodeWindowWrapper } from './gateway/vscode.wrapper'

export function activate(context: ExtensionContext) {
    const { callables, subscribables } = getControllers()
    // sibebar view 實例化
    const viewProvidersidebar = new ViewProviderSidebar(context, { callables, subscribables })
    // 在 views（ sidebar-view-container 已在 package.json 的 contributes 中宣告）中註冊
    const sidebarViewDisposable = window.registerWebviewViewProvider('sidebar-view-container', viewProvidersidebar, {
        webviewOptions: { retainContextWhenHidden: true },
    })

    // 為指令 panel-view-container.show 註冊行為
    const panelViewDisposable = commands.registerCommand('panel-view-container.show', () => {
        const viewProviderPanel = new ViewProviderPanel(context, { callables, subscribables })
        const panel = VSCodeWindowWrapper.createWebviewPanel('panel-view-container', 'Panel View', ViewColumn.One, {})
        viewProviderPanel.resolveWebviewView(panel)
    })

    // subscriptions 列表中的 disposable, 會在插件失活時被執行
    context.subscriptions.push(sidebarViewDisposable, panelViewDisposable)
    return context
}

export function deactivate() {}
