import { registerControllers } from 'cec-client-server/decorator'
import { AxiosControler } from '../controller/axios.controller'
import { MessageControler } from '../controller/message.controller'
import { CommandControler } from '../controller/command.controller'
import { VscThemeControler } from '../controller/vsc-theme.controller'

registerControllers([AxiosControler, MessageControler, CommandControler, VscThemeControler])