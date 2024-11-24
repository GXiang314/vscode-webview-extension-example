import { MessageService } from '../service/message.service'
import { registerServices } from 'cec-client-server/decorator'
import { VSCodeWindowWrapper, VSCodeWorkspaceWrapper } from '../gateway/vscode.wrapper'

/**
 * 注意：服務（Service）不一定需要在註冊!!!
 *
 * 在這裡註冊的服務，可以使用服務名稱（或者服務別名）來使用服務，如：
 *
 * @service()
 *   export class AxiosService {
 *   ...
 * }
 *
 * @controller()
 * export class AxiosControler {
 *   constructor(@inject('AxiosService') private axiosService: any) {}
 *   ...
 * }
 *
 * 服務別名的情況：
 *
 * @service('AxiosUtil')
 *   export class AxiosService {
 *   ...
 * }
 *
 * @controller()
 * export class AxiosControler {
 *   constructor(@inject('AxiosUtil') private axiosUtil: any) {}
 *   ...
 * }
 *
 * 如果正常使用的話，不需要註冊服務。如：
 * @controller()
 * export class AxiosControler {
 *   constructor(private axiosService: AxiosService) {}
 *   ...
 * }
 */
registerServices([MessageService, VSCodeWindowWrapper, VSCodeWorkspaceWrapper])
