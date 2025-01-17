import * as vscode from 'vscode'
import { service } from 'cec-client-server/decorator'
import * as path from 'path'

@service()
export class VSCodeWindowWrapper {
    context!: vscode.ExtensionContext
    static panels: { [key: string]: vscode.WebviewPanel } = {}

    constructor() {
        this.initialize()
    }

    async initialize() {
        // Get an extension by its full identifier in the form of: publisher.name.
        // 需確保 publisher, name 與 package.json 一致！
        this.context = (await vscode.extensions
            .getExtension('GXiang314.extension')
            ?.activate()) as vscode.ExtensionContext
    }

    public showInformationMessage(message: string): Thenable<string | undefined> {
        return vscode.window.showInformationMessage(message)
    }

    public showErrorMessage(message: string): Thenable<string | undefined> {
        return vscode.window.showErrorMessage(message)
    }

    public showQuickPick(items: string[], options: vscode.QuickPickOptions): Thenable<string | undefined> {
        return vscode.window.showQuickPick(items, options)
    }

    public getResourcesPath() {
        return this.context.asAbsolutePath(path.join('assets/resources'))
    }

    public static createWebviewPanel(
        viewType: string,
        title: string,
        viewColumn: vscode.ViewColumn,
        options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
    ): vscode.WebviewPanel {
        this.disposeWebviewPanel(viewType)
        const panel = vscode.window.createWebviewPanel(viewType, title, viewColumn, options)
        this.panels[viewType] = panel
        return panel
    }

    public static disposeWebviewPanel(viewType: string) {
        if (this.panels[viewType]) {
            this.panels[viewType].dispose()
        }
    }

    public async openTextDocument(filePath: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(filePath)
        await vscode.window.showTextDocument(document, {
            viewColumn: vscode.ViewColumn.Active,
            preserveFocus: false,
            preview: false,
        })
    }
}

@service()
export class VSCodeWorkspaceWrapper {
    public getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
        return vscode.workspace.workspaceFolders
    }

}
