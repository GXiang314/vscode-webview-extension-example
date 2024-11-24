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
   * - 最終這個可調用方法的名稱為：VscTheme.getTheme，規則為：[controllerName].[callableName]
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

  @callable() // 不使用別名時，callable 的名稱就是方法名：updateTheme 本身，所以最終這個可調用方法的名稱為：VscTheme.updateTheme
  updateTheme(colorTheme: string) {
    workspace.getConfiguration().update('workbench.colorTheme', colorTheme)
  }
}