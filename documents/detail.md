# 寫在前面的

【vscode 的 webview 開發約束】

- webview 應用運行在 iframe 沙箱模式中，有諸多的約束，如：同源政策
- 資源路徑需要動態的計算: webview 應用的資源路徑由 vscode 給定
- 延遲加載(Lazy loading)幾乎不可用：vue 和 react 延遲加載一般不建議使用，不然會比較麻煩

> 這些問題在下文中都會一一涉及，並會給出相關的解決方案

# 專案建構
專案採用 monorepo，使用 pnpm 作為套件管理器

專案中主要的目錄結構：

```
.
├── package.json
├── packages
│   ├── extension // extension 端的應用
│   │	└── src
│   │       ├── controller
│   │       ├── service
│   │       ├── view-provider
│   │       └── extension.ts
│   ├── view-panel // webview 端的 panel 應用
│   │	└── src
│   │	    ├── hooks
│   │	    └── App.vue
│   └── view-sidebar // webview 端的 sidebar 應用
│    	└── src
│    	    ├── hooks
│    	    └── App.vue
├── pnpm-workspace.yaml
└── README.md
```


## 專案工作空間
1. 首先需要安裝 pnpm，然後 init 專案：

   ```bash
   npm install pnpm -g
   pnpm init
   ```

2. 在 root 目錄新建 pnpm-workspace.yaml，寫入以下內容：

   ```yaml
   packages:
     # all packages in direct subdirs of packages/
     - 'packages/*'
   ```
3. 在 root 目錄新建 packages 目錄，packages 用於放置相互獨立的應用（可以單獨PO成包）

   ```
   .
   ├── package.json
   ├── packages
   │   └── ...
   ├── pnpm-workspace.yaml
   └── README.md
   ```
## 新建 extension  端應用
1. 在 packages 目錄下使用 yo 創建 extension 應用

   ```bash
   npm install -g yo generator-code
   yo code
   
        _-----_     ╭──────────────────────────╮
       |       |    │   Welcome to the Visual  │
       |--(o)--|    │   Studio Code Extension  │
      `---------´   │        generator!        │
       ( _´U`_ )    ╰──────────────────────────╯
       /___A___\   /
        |  ~  |
      __'.___.'__
    ´   `  |° ´ Y `
   
   ? What type of extension do you want to create? New Extension (TypeScript)
   ? What's the name of your extension? extension
   ? What's the identifier of your extension? extension
   ? What's the description of your extension? An example for wscode webview developer
   ? Initialize a git repository? Yes
   ? Bundle the source code with webpack? No
   ? Which package manager to use? pnpm
   ```

2. 更改 .vscode 位置
     將 extension 目錄中的 .vscode 目錄直接移動到 root 目錄中，並將其中的 launch.json 的內容做如下的修改：

     ```json
     {
     	"version": "0.2.0",
     	"configurations": [
     		{
     			"name": "Run Extension",
     			"type": "extensionHost",
     			"request": "launch",
     			"args": [
     				"--extensionDevelopmentPath=${workspaceFolder}/packages/extension"
     			],
     			"outFiles": [
     				"${workspaceFolder}/packages/extension/out/**/*.js"
     			],
     			"preLaunchTask": "${defaultBuildTask}"
     		},
     		{
     			"name": "Extension Tests",
     			"type": "extensionHost",
     			"request": "launch",
     			"args": [
     				"--extensionDevelopmentPath=${workspaceFolder}/packages/extension",
     				"--extensionTestsPath=${workspaceFolder}/packages/extension/out/__test__/suite/index"
     			],
     			"outFiles": [
     				"${workspaceFolder}/packages/extension/out/test/**/*.js"
     			],
     			"preLaunchTask": "${defaultBuildTask}"
     		}
     	]
     }
     ```

     對應將的 extension 目錄中的 tsconfig.json 的 compilerOptions.outDir 設定為：
     
     ```json
     {
         "compilerOptions": {
              "outDir": "out/extension",
         }
     }
     ```

     將 .vscode 目錄中的 tasks.json 的內容做如下的修改：

     ```json
     {
     	"version": "2.0.0",
     	"tasks": [
     		{
     			"type": "npm",
     			"script": "dev:extension",
     			"problemMatcher": "$tsc-watch",
     			"isBackground": true,
     			"presentation": {
     				"reveal": "never"
     			},
     			"group": {
     				"kind": "build",
     				"isDefault": true
     			}
     		}
     	]
     }
     ```

4. 新增 watch 指令
    在 extension 中的 package.json 中新增 script：

    ```json
    "scripts": {
        "watch": "tsc -watch -p ./"
    }
    ```

      （一般是有的，不用新增）

      在 root 目錄中的 package.json 中新增 script：

    ```json
    "scripts": {
        "dev": "run-p dev:view-*",
        "dev:extension": "pnpm run -F extension watch"
    }
    ```

    > 這裡，run-p 使用的是 npm-run-all 的命令，需要使用 `pnpn i npm-run-all -w` 下載，`run-p dev:view-*` 可以並行的呼叫 `dev:view-` 開頭的指令

    > pnpm -F(--filter) 用於指定 pnpm 要使用的 package, -F(--filter) 後的為包名

## 新建 webview 端應用

### Vue 框架

1. 創建應用 view-sidebar
    在 packages 目錄下，執行：
    
    ```
    pnpm create vue@latest
    ```
    
     *注意 Project name 要命名為： view-sidebar*

2. 新增 watch 指令
    在 view-sidebar 中的 package.json 中新增 script：
    
    ```json
    "scripts": {
     	"watch-only": "vite build --watch",
    	"watch": "run-p type-check \"watch-only {@}\" --"
    }
    ```
    
    （這裡是仿照 build 指令）
    
    在 root 目錄中的 package.json 中新增 script：
    
    ```json
    "scripts": {
    	"dev:view-sidebar": "pnpm run -F view-sidebar watch"
    }
    ```
    
3. 修改打包路徑
     在 view-sidebar 的 vite.config.ts 中新增：

     ```js
     build: {
       outDir: '../extension/out/view-sidebar'
     }
     ```

     將打包的目錄指向 extension 的 out/view-sidebar 目錄

### React 框架

1. 創建應用 view-panel
    在 packages 目錄下，執行：
    
    ```bash
    pnpm create vite view-panel --template react-swc-ts
    ```
    
    （開發者可以選用自己喜歡的打包工具和 template）

2. 新增 watch 指令
     在 view-panel 中的 package.json 中新增 script：

     ```json
     "scripts": {
         "watch": "vite build --watch"
     }
     ```

     在 root 中的 package.json 中新增 script：
     
     ```json
     "scripts": {
         "dev:view-panel": "pnpm run -F view-panel watch"
     }
     ```
     
3. 修改打包路徑
    在 view-panel 的 vite.config.ts 中新增：
    
    ```js
    build: {
      outDir: '../extension/out/view-panel'
    }
    ```
    
    將打包的目錄指向 extension 的 out/view-panel 目錄

# 解決資源路徑問題

## 實現 sidebar view 和 panel view

接下來，我們會將 view-sidebar 應用的頁面顯示在 sidebar 的區域，效果如圖：

![](https://raw.githubusercontent.com/liutaigang/vscode-webview-example/main/documents/assets/vue-view-sidebar-view.png)

將 view-panel 應用的視圖顯示在 panel 中，效果如圖：

![](https://raw.githubusercontent.com/liutaigang/vscode-webview-example/main/documents/assets/react-view-panel-view.png)

具體的代碼實現為：

1. 新增 contributes

   在 extension 目錄的 package.json 中新增 contributes：

   ```json
     "contributes": {
       "commands": [
         {
           "command": "panel-view-container.show",
           "title": "Panel View",
           "category": "vscode-webview-example"
         }
       ],
       "viewsContainers": {
         "activitybar": [
           {
             "id": "sidebar-view",
             "title": "sidebar view example",
             "icon": "assets/icon01.svg"
           }
         ]
       },
       "views": {
         "sidebar-view": [
           {
             "id": "sidebar-view-container",
             "type": "webview",
             "name": "sidebar view"
           }
         ]
       }
     }
   ```

   **主要的 contributes 為**：

   - 一個指令：`panel-view-container.show`
   - 一個 activitybar：`sidebar-view` 以及和 activitybar 關聯的 sidebar view

   **注意：** 需要在 activitybar 中的 icon 使用主要自己指定一個合理的

2. 實現 ViewProvider

   在 extension 的 src 新增 service 目錄，並新增 ViewProvider 相關程式碼文件

   ```
   extension
       └── src
           └── view-provider
               ├── view-provider-abstract.ts
               ├── view-provider-panel.ts
               └── view-provider-sidebar.ts
   ```

   **[view-provider-abstract.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-abstract.ts)** 提供一個抽象的實現，是仿照 `vscode.WebviewViewProvider` 來定義的，其中定義了抽象方法 `resolveWebviewView` 和 實現了對前端應用（如：view-sidebar, view-panel）的的入口文件（如：index.html）的處理。

   核心邏輯：

   ```ts
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
        * @param viewProviderOptions 相關設定
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

   ```

   處理前 index.html 內容形如：

   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8">
       <base target="_top" href="/"/>
       <link rel="icon" href="/favicon.ico">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Vite App</title>
       <!-- don't remove !! __webview_public_path__ -->
       <script type="module" crossorigin src="/assets/index-04556862.js"></script>
       <link rel="stylesheet" href="/view-sidebar/assets/index-645ece69.css">
     </head>
     <body>
       <div id="app"></div>
     </body>
   </html>
   ```

   處理後 index.html 內容形如：

   ```html
   <html lang="en">
     <head>
       <meta charset="UTF-8">
       <base target="_top" href="/"/>
       <link rel="icon" href="/favicon.ico">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Vite App</title>
       <script>window.__webview_public_path__="https://file%2B.vscode-resource.vscode-cdn.net/d%3A/AAAAA/self/vscode-webview-example/packages/extension/out/view-sidebar"</script>
       <script type="module" crossorigin src="https://file%2B.vscode-resource.vscode-cdn.net/d%3A/AAAAA/self/vscode-webview-example/packages/extension/out/view-sidebarassets/index-04556862.js"></script>
       <link rel="stylesheet" href="https://file%2B.vscode-resource.vscode-cdn.net/d%3A/AAAAA/self/vscode-webview-example/packages/extension/out/view-sidebarassets/index-645ece69.css">
     </head>
     <body>
       <div id="app"></div>
     </body>
   </html>
   ```

   *注意*：`<!-- don't remove !! __webview_public_path__ -->` 需要放在 script 標簽之前

   [**view-provider-panel.ts**](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-panel.ts)  和  **[view-provider-sidebar.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-sidebar.ts)** 都繼承自 **view-provider-abstract.ts** ，需要實現 `resolveWebviewView()` 抽象方法的具體邏輯

   程式碼：

   [https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-panel.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-panel.ts)

   [https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-sidebar.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-sidebar.ts)

3. 在 [extension.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/extension.ts) 中實例化

   核心邏輯：  

   ```ts
   import * as vscode from 'vscode'
   import { ViewProviderSidebar } from './service/view-provider/view-provider-sidebar'
   import { ViewProviderPanel } from './service/view-provider/view-provider-panel'
   
   export function activate(context: vscode.ExtensionContext) {
     // sibebar view 實例化
     const viewProvidersidebar = new ViewProviderSidebar(context)
     // 在 views（sidebar-view-container 已在 package.json 的 contributes 中宣告）中註冊
     const sidebarViewDisposable = vscode.window.registerWebviewViewProvider(
       'sidebar-view-container',
       viewProvidersidebar,
       { webviewOptions: { retainContextWhenHidden: true } }
     )
   
     // 為指令 panel-view-container.show 註冊“行為”
     const panelViewDisposable = vscode.commands.registerCommand('panel-view-container.show', () => {
       const panel = vscode.window.createWebviewPanel('panel-view-container', 'Panel View', vscode.ViewColumn.One, {})
       // panel view 實例化
       const viewProviderPanel = new ViewProviderPanel(context)
       viewProviderPanel.resolveWebviewView(panel)
     })
   
     // subscriptions 列錶中的 disposable, 會在插件失活時被執行
     context.subscriptions.push(sidebarViewDisposable, panelViewDisposable)
   }
   
   export function deactivate() {}
   
   ```
   
4. 修改前端應用資源路徑

   **view-sidebar 應用修改**：

   在 view-sidebar 的 src 目錄中新增 hooks 目錄，在 hooks 下新增文件 use-webview-public-path.ts

   ```
   .
   ├── view-sidebar 
       ├── src
           ├── hooks
               ├── use-webview-public-path.ts
   ```

   在 [use-webview-public-path.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/hooks/use-webview-public-path.ts) 中加入以下內容：

   ```ts
   import { ref } from 'vue'
   import { join } from 'path-browserify' // 下載：pnpm i -w path-browserify
   
   const webviewPublicPath = ((window as any).__webview_public_path__ as string) ?? ''
   export function useWebviewPublicPath(relativePath: string): Ref<string> {
     const path = join(webviewPublicPath, relativePath)
     return ref(path)
   }
   ```
   
   在需要資源定位的地方使用時，如([view-sidebar/src/App.vue](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/App.vue))：
   
   ```vue
   <script setup lang="ts">
   import { RouterLink, RouterView } from 'vue-router'
   import HelloWorld from '@/components/HelloWorld.vue'
   import logPath from '@/assets/logo.svg'
   import { useWebviewPublicPath } from '@/hooks/use-webview-public-path'
   
   const logoUrl = useWebviewPublicPath(logPath)
   </script>
   
   <template>
     <header>
       <img alt="Vue logo" class="logo" :src="logoUrl" width="125" height="125" />
       <div class="wrapper">
         <HelloWorld msg="You did it!" />
         <nav>
           <RouterLink to="/">Home</RouterLink>
           <RouterLink to="/about">About</RouterLink>
         </nav>
       </div>
     </header>
     <RouterView />
   </template>
   ```
   
   **view-panel 應用修改**：
   
   在 view-panel 的 src 目錄中新增 hooks 目錄，在 hooks 下新增文件 use-webview-public-path.ts
   
   ```
   .
   ├── view-panel 
       ├── src
           ├── hooks
               ├── use-webview-public-path.ts
   ```
   
   在 [use-webview-public-path.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-panel/src/hooks/use-webview-public-path.ts) 中加入以下內容：
   
   ```ts
   import { useState } from 'react'
   import { join } from 'path-browserify' // 下載：pnpm i -w path-browserify
   
   const webviewPublicPath = ((window as any).__webview_public_path__ as string) ?? ''
   export function useWebviewPublicPath(relativePath: string) {
     const path = joinPath(webviewPublicPath, relativePath)
     return useState(path)
   }
   ```

   在需要資源定位的地方使用時，如（[view-panel/src/App.tsx](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-panel/src/App.tsx)）：
   
   ```tsx
   import { useState } from 'react'
   import { useWebviewPublicPath } from './hooks/use-webview-public-path'
   import reactLogo from './assets/react.svg'
   import viteLogo from '/vite.svg'
   import './App.css'
   
   function App() {
     const [count, setCount] = useState(0)
     const [reactLogoPath] = useWebviewPublicPath(reactLogo)
     const [viteLogoPath] = useWebviewPublicPath(viteLogo)
   
     return (
       <>
         <div>
           <a href="https://vitejs.dev" target="_blank">
             <img src={viteLogoPath} className="logo" alt="Vite logo" />
           </a>
           <a href="https://react.dev" target="_blank">
             <img src={reactLogoPath} className="logo react" alt="React logo" />
           </a>
         </div>
         <h1>Vite + React</h1>
         <div className="card">
           <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
         </div>
         <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
       </>
     )
   }
   
   export default App
   ```

## 驗證

在 root 目錄下運行指令：

```bash
pnpm dev
```

指令執行完成後，通過 F5 開啓調試，開啓後，嘗試以下兩個方式：

- 點選 activitybar 上的圖示：![](https://raw.githubusercontent.com/liutaigang/vscode-webview-extension-example/main/documents/assets/activitybar-icon.png)
- 鍵入 `ctrl+shift+p` 在指令輸入框中輸入：`panel-view-container.show` 

>過程出現任何問題，歡迎提 issue

# 通訊實現

## 使用的通訊框架套件 cec-client-server

這裡的通訊主要指的是 extension 端和 webview 端的通訊。

專案中，我們不是直接使用 [vscode webview 提供的通訊 API](https://code.visualstudio.com/api/extension-guides/webview#scripts-and-message-passing) 進行兩端的訊息交換，而是使用 [cec-client-server](https://github.com/liutaigang/cross-end-call) ，這個套件主要的作用是：可以將端與端之間`訊息的發送和接收`，轉換為`方法呼叫`和`主題訂閱`。這樣說得有點抽象，以`方法呼叫`為例，我們來一個僞代碼的演示：

有這樣一個需求：

- webview 端向 extension 端請求 vscode 的主題色
- extension 端呼叫 api 取得後，返回給 webview 端，失敗則返回失敗訊息

**古早的方式：**

```js
// webview 端
const vscodeApi = window.acquireVsCodeApi()
vscodeApi.postMessage('getTheme')
window.addEventListener("message", ({ data }) => {
  if(data.type === 'returnTheme') {
  	if (data.state === 'success') {
	  console.log(data.value)
  	} else {
  	  console.log(data.error)
  	}
  }
})

// extension 端
webview.onDidReceiveMessage((method) => {
  if(method === "getTheme") {
     ...
     try {
       cosnt theme = getTheme()
       webview.postMessage({ type: 'returnTheme', value: theme, state: 'success' })
     } catch(error) {
       webview.postMessage({ type: 'returnTheme', error, state: 'failed' })
     }
  }
})
```

**使用 cec-client-server ：**

```js
// extension 端
import { CecServer } from "cec-client-server";
const cecServer = new CecServer(webview.postMessage, webview.onDidReceiveMessage);
cecServer.onCall('getTheme', () => {
  ...
  return getTheme();
})

// webview 端
import { CecClient } from "cec-client-server";
const vscodeApi = window.acquireVsCodeApi();
const cecClient = new CecClient(vscodeApi.postMessage, window.addEventListener);
cecClient.call('getTheme')
  .then((theme) => console.log(theme))
  .catch((error) => console.log(theme));  
```

使用的 cec-client-server 之後，整個訊息交換的過程變得清晰了很多。

**更重要的意義在於：訊息的交換的主導方，從 webview 端變成了 extension 端**，如上例，在古早的方式中，訊息的類型需要 webview 端告知 extension 端，訊息如何處理，需要雙方的約定；使用 cec-client-server；extension 端隻需要定義一個可以呼叫的"方法"，webview 端需要呼叫，按照定義好的方式即可，不需要和 extension 端做任何約定。這樣方式大大減少了兩端的耦合。

cec-client-server 還能實現主題的訂閱，即：extension 端可以實現一個主題（subject），webview 端實現一個對應的觀察者（observer ），處理主題的狀態變化，熟悉 rxjs 的話應該會很容易上手。cec-client-server ：https://github.com/liutaigang/cross-end-call

## Extension 端應用的通訊實現

首先，我們需要明確一下 cec-client-server 的幾個概念：

- callable —— 指可以被呼叫的方法
- subscribable —— 指可以被訂閱的主題
- controller —— callable 和 subscribable 的統稱
- service —— 可以理解為 controller 的 “服務者”

我們還需要用到 cec-client-server 的**裝飾器模組**， 即：cec-client-server/decorator。下面，我們定義一個 controller ： 

在 extension/src 中新增 controller 目錄，在 controller 下新增如下：

```
.
├── extension 
    ├── src
        ├── controller
        │   └── vsc-theme.controller.ts
        ├── controller-registry
        │	└── index.ts
```

**[vsc-theme.controller.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/controller/vsc-theme.controller.ts)** 中定義一個 定義用於 vscode 的主題色取得和修改的 callable 和 subscribable：

```TS
import { workspace } from 'vscode'
import { controller, callable, subscribable } from 'cec-client-server/decorator'

/**
 * @controller('VscTheme') 裝飾器的作用有：
 * - 自動實例化 VscThemeControler 類，在使用的地方以單例的方式提供。在代碼中一般不直接實例化 controller！
 * - 將 VscThemeControler 類的實例化dui'xi'g 註冊一個名為 'VscTheme' 的 controller
 *
 * controller 的命名規則：
 * - 別名（alias）：如 @controller('VscTheme') 的就是使用別名 'VscTheme' 來註冊 controller
 * - 使用類名：如 @controller() 的就是使用類名 VscThemeController 來註冊 controller。
 *	 因為 controller 的類名一般都以 Controller 作為字尾，為了命名簡單，一般都使用別名
 */
@controller('VscTheme')
export class VscThemeControler {
  constructor() {}

  /**
   * @callable('getTheme') 裝飾器的作用有：
   * - 將方法 getThemeForCall 以別名 getTheme 註冊為一個 callable
   * - 最終這個可呼叫方法的名稱為：VscTheme.getTheme，規則為：[controllerName].[callableName]
   *
   * callable 的命名規則：
   * - 有別名的話，使用別名，冇有別名，使用方法名來註冊 callable。所以不能使用 Symbol 來宣告方法！
   * - callable 和 subscribable 可以重名，但是和 callable 和 callable 禁止重名！
   */
  @callable('getTheme') // 這裡使用了別名
  async getThemeForCall() {
    const colorTheme = workspace.getConfiguration().get('workbench.colorTheme')
    return colorTheme
  }

  /**
   * @subscribable('getTheme') 裝飾器的作用有：
   * - 將“主題” getThemeForSubscribe 以別名 getTheme 註冊為一個 subscribable
   * - 最終這個訂閱這個“主題”的名稱為：VscTheme.getTheme
   *
   * subscribable 的命名規則：和 callable 的相同
   */
  @subscribable('getTheme')
  getThemeForSubscribe(next: (value: any) => void) {
    const disposable = workspace.onDidChangeConfiguration(() => {
      const colorTheme = workspace.getConfiguration().get('workbench.colorTheme')
      next(colorTheme)
    })
    return disposable.dispose.bind(disposable)
  }

  @callable() // 不使用別名時，callable 的名稱就是方法名：updateTheme 本身，所以最終這個可呼叫方法的名稱為：VscTheme.updateTheme
  updateTheme(colorTheme: string) {
    workspace.getConfiguration().update('workbench.colorTheme', colorTheme)
  }
}
```

在 **[controller-registry/index.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/contoller-registry/index.ts)** 中將定義好的 controller 進行註冊：

```TS
import { registerControllers } from 'cec-client-server/decorator'
import { VscThemeControler } from '../controller/vsc-theme.controller'

registerControllers([VscThemeControler])
```

最後，需要在 extension.ts 中導出執行，並在實例化 view-provider 時使用：

```ts
import 'reflect-metadata'
import './contoller-registry'; // 直接執行
import { ExtensionContext, window } from 'vscode'
import { ViewProviderSidebar } from './view-provider/view-provider-sidebar'
import { getControllers } from 'cec-client-server/decorator'; // 導出 getControllers 方法

export function activate(context: ExtensionContext) {
  const { callables, subscribables } = getControllers() // getControllers 能取得使用 @controller, @callable, @subscribable 裝飾的所有能力和主題
  const viewProvidersidebar = new ViewProviderSidebar(context, { callables, subscribables })
  const sidebarViewDisposable = window.registerWebviewViewProvider(
    'sidebar-view-container',
    viewProvidersidebar,
  )
  context.subscriptions.push(sidebarViewDisposable)
}

export function deactivate() {}
```

相應的，需要在 [view-provider](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/view-provider/view-provider-abstract.ts) 中實現通訊相關邏輯，核心代碼：

```ts
import { CecServer } from 'cec-client-server'
/**
  * 新增一個 CecServer 實例，並設定相關的 callable 和 subscribable
 * @param webviewView 可以為 vscode.WebviewView 或者 vscode.WebviewPanel 的實例
 */
protected setControllers(webview: Webview) {
  // 實例化 CecServer
  const cecServer = new CecServer(
    webview.postMessage.bind(webview),
    webview.onDidReceiveMessage.bind(webview)
  )
  
  // 註冊：callable, subscribable
  const { callables, subscribables } = this.controllerOptions
  Object.entries(callables).map((item) => cecServer.onCall(...item))
  Object.entries(subscribables).map((item) => cecServer.onSubscribe(...item))
}
```

**注意：**

因為 cec-client-server/decorator 使用了 [tsyringe](https://github.com/microsoft/tsyringe) ，所以需要在 tsconfig.json 中設定：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

還需要增加一個 Reflect API 的 polyfill，可選的有：

- [reflect-metadata](https://www.npmjs.com/package/reflect-metadata)
- [core-js (core-js/es7/reflect)](https://www.npmjs.com/package/core-js)
- [reflection](https://www.npmjs.com/package/@abraham/reflection)

以 reflect-metadata 為例，下載： 

```
pnpm i -F extension reflect-metadata
```

最後在 extension.ts 中導入：

```ts
// extension.ts
import "reflect-metadata"; // 在所有代碼之前

// Your code here...
```

## Webview  端通訊實現：以 Vue 為例

承接 extension 端應用的通訊實現例子，我們在 Vue 應用中實現對應的邏輯。

在 view-sidebar 中的 src/hooks 目錄中新增以下文件：

```
.
├── view-sidebar 
    ├── src
        ├── hooks
            ├── use-cec-client.ts
            ├── use-vsc-color-theme.ts
```

**[use-cec-client.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/hooks/use-cec-client.ts)** 是與 extensoin 端建立連接的一個 hook，其邏輯為：

```ts
import { CecClient, type MsgObserver } from 'cec-client-server'

// acquireVsCodeApi 是 extension 的 webview 在 iframe 中註入的一個方法，用於像 webview 發送訊息等
const vscodeApi = (window as any).acquireVsCodeApi()

// 實例化 CecClient
const msgSender: MsgSender = vscodeApi.postMessage.bind(vscodeApi)
const msgReceiver: MsgReceiver = (msgHandler) => {
  window.addEventListener('message', (evt) => msgHandler(evt.data))
}
const cecClient = new CecClient(msgSender, msgReceiver)

//  暴露 CecClient 實例的 call 方法
export const useCall = <ReplyVal>(name: string, ...args: any[]) => {
  return cecClient.call<ReplyVal>(name, ...args)
}

//  暴露 CecClient 實例的 subscrible 方法
export const useSubscrible = (name: string, observer: MsgObserver, ...args: any[]) => {
  return cecClient.subscrible(name, observer, ...args)
}
```

**[use-vsc-color-theme.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/hooks/use-vsc-color-theme.ts)** 是進行主題的修改和訂閱的一個 hook，其邏輯為：

```ts
import { ref, onUnmounted } from 'vue'
import { useCall, useSubscrible } from './use-cec-client'

export const vscColorThemeOptions = [
  {
    label: 'Light (Visual Studio)',
    value: 'Visual Studio Light'
  },
  {
    label: 'Dark (Visual Studio)',
    value: 'Visual Studio Dark'
  },
  ...
]

export function useVscColorTheme() {
  const colorTheme = ref<string>()
  
  // 確保能立即取得到當前的主題色
  useCall<string>('VscTheme.getTheme').then((theme) => {
    colorTheme.value = theme
  })
  
  // 訂閱主題色變化
  const dispose = useSubscrible('VscTheme.getTheme', (theme: string) => {
    colorTheme.value = theme
  })
  onUnmounted(dispose)

  // 更新主題色
  const setColorTheme = (colorTheme: string) => {
    useCall('VscTheme.updateTheme', colorTheme)
  }

  // 暴露當前主題色的 ref 變數，和更新的方法
  return { colorTheme, setColorTheme }
}
```

最後，我們就可以在視圖組件中使用了，如（[src/App.vue](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/App.vue)）：

```vue
<script setup lang="ts">
import { useVscColorTheme, vscColorThemeOptions } from '@/hooks/use-vsc-color-theme'

// Vscode 主題監聽和設定範例
const { colorTheme, setColorTheme } = useVscColorTheme()
const onColortThemeInput = () => {
  setTimeout(() => setColorTheme(colorTheme.value!))
}
</script>

<template>
  <header>
    <div class="example-block">
      <h2>主題取得、監聽和設定演示</h2>
      <label for="color-theme-select">請選擇 Vscode 的主題:</label>
      <select id="color-theme-select" v-model="colorTheme" @input="onColortThemeInput()">
        <option v-for="{ value, label } of vscColorThemeOptions" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
      <div>當前視窗 vscode 的主題類型: {{ colorTheme }}</div>
    </div>
  </header>
  <RouterView />
</template>
```

## 其他範例：後端介面請求

**因為 vscode 的 webview 實質上是一個 iframe，其 src 的指向的是在地資源，且使用了 sandbox 的 allow-same-origin 屬性，這意味著 webview 端的應用中發起的 API 請求可能會受到“同源政策”的限制**，如圖：

<img src="https://raw.githubusercontent.com/liutaigang/vscode-webview-extension-example/main/documents/assets/iframe-crosss-domain.png" />

所以，我們一般在 extension 端發起介面請求，然後通過呼叫來傳遞請求資料給 webview 端。下面，通過一個範例來具體看看。

在 extension 端應用中，**新建 Axios 的服務（service）、控制器（controller）**：

```
.
├── extension 
    ├── src
        ├── controller
        │   ├── aixos.controller.ts
        ...
        ├── service
          	├── axios.service.ts
```

**[axios.service.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/service/axios.service.ts)**： 該服務的作用是實現 axios 請求的所有邏輯，包括但不限於：參數設定、資料處理、攔截器等。

```ts
import { service } from 'cec-client-server/decorator'
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig
} from 'axios'

@service()
export class AxiosService
  implements Pick<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'>
{
  private readonly axiosInstance: AxiosInstance
  private readonly createAxiosDefaults: CreateAxiosDefaults = {}
  private readonly requestInterceptor = {
    onFulfilled: (config: InternalAxiosRequestConfig) => {
      return config
    },
    onRejected: (error: any) => {
      return Promise.reject(error)
    }
  }
  private readonly responseInterceptor = {
    onFulfilled: (config: AxiosResponse) => {
      return config
    },
    onRejected: (error: any) => {
      return Promise.reject(error)
    }
  }

  constructor() {
    this.axiosInstance = axios.create(this.createAxiosDefaults)
    const { onFulfilled, onRejected } = this.requestInterceptor
    this.axiosInstance.interceptors.request.use(onFulfilled, onRejected)
    const { onFulfilled: onFulfilled01, onRejected: onRejected01 } = this.responseInterceptor
    this.axiosInstance.interceptors.response.use(onFulfilled01, onRejected01)
  }

  get<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.get(url, config)
  }

  post<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }

  put<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }

  delete<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, config)
  }

  patch<T = any, R = AxiosResponse<T, any>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }
}
```

該服務使用了 `cec-client-server/decorator` 的 `service` 裝飾器，該裝飾器的作用是將被裝飾的類別，以單例的形式供 controller 使用。

**[axios.controller.ts](https://github.com/gxiang314/vscode-webview-example/blob/main/packages/extension/src/controller/axios.controller.ts)**： 使用了 AxiosService 服務，主要作用是暴露 AxiosService 的能力：

```ts
import { AxiosRequestConfig } from 'axios'
import { callable, controller } from 'cec-client-server/decorator'
import { AxiosService } from '../service/axios.service'

@controller('Axios')
export class AxiosControler {
    constructor(private readonly axiosService: AxiosService) {}

    @callable()
    get(url: string, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosService.get(url, config)
    }

    @callable()
    post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosService.post(url, data, config)
    }

    @callable()
    put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosService.put(url, data, config)
    }

    @callable()
    delete(url: string, config?: AxiosRequestConfig): Promise<any> {
        return this.axiosService.delete(url, config)
    }
}
```

最後，在 webview 端的 Vue 應用中使用的範例程式碼：

https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/hooks/use-axios.ts

https://github.com/gxiang314/vscode-webview-example/blob/main/packages/view-sidebar/src/App.vue

# 架構原理

## 整體架構

整個範例中，我們共有三個模組：extension 一個， webview 有兩個，分別為 view-sidebar, view-panel。如圖：

![](https://raw.githubusercontent.com/liutaigang/vscode-webview-extension-example/main/documents/assets/jiagou.png)


這裡，我們整體採用的是 server-client 的架構， extension 端可以類比於 server ，webview 端可以類比於 client。

extension 端和 webview 端需要保持單向的依賴關係，即 **webview 端的依賴可以指向 extension 端，反之則不行**。這也是我們使用 cec-client-server 的原因。我們認為 extension 端是高於 webview 端的，類比於架構設計，低級模組依賴於高級模組，反之則不行。

<img src="https://raw.githubusercontent.com/liutaigang/vscode-webview-extension-example/main/documents/assets/dependency.png" style="zoom:75%;" />

> 什麼是依賴？
>
> - 一段代碼中，直接體現是：在 A 的代碼中，使用了 B 的代碼，則 A 依賴於 B，不管有冇有顯示的宣告。
> - 一個應用中，直接體現是：在 A 組件使用 B 組件（B 服務，B 方法， B 套件），則 A 依賴於 B，不管有冇有顯示的宣告。
> - 一個係統中，直接體現是：在 A 服務呼叫 B 服務的介面，則 A 依賴於 B。如：前端應用呼叫了後端的介面，後端呼叫了中臺的介面。
>
> 更廣義的，我們可以將依賴做這樣的定義：**當 A 的完整性，需要 B 的支援，則 A 依賴於 B**

extension 端應用可能需要面對多個 webview 端應用，所以 extension 端應用不能向 webview 端應用索要任何能力，這樣做會導緻 extension 端應用的代碼邏輯業務化，會引入更多的邏輯判斷和差異兼容。

但是，在實際的業務中，高階模組依賴低階模組是常見，事實上，在設計模式中，我們常使用“依賴反轉”來解決。

在我們範例中，cec-client-server 就是我們用於實現依賴反轉的工具。

## extension 端應用架構

extension 端應用架構同樣要注意模組之間的依賴關係，因為有 cec-client-server/decorator 套件的支援，所以整體比較的簡單。但是仍要強調是的是：

**controller 層**   —依賴—>   **service 層 **  —依賴—>   **vscode 能力 + 其他能力**

這樣的依賴方向不能反過來。

> cec-client-server/decorator 套件的核心使用了“依賴註入”的設計模式，使用“服務”時，不需要關心它如何實例化。
