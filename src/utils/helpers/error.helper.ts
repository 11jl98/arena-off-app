import { ERROR_API } from '../constants/errorApi.constant';
import { MESSAGES_ERROR, MESSAGES_INFORMATION } from '../constants/messagesNotification.constant';

export function getErrorMessage(message: string): string {
  if (message.includes(ERROR_API.BLOCKED_USER)) {
    return MESSAGES_ERROR.BLOKED_USER;
  }
  if (message.includes(ERROR_API.IS_FIRST_ACCESS)) {
    return MESSAGES_INFORMATION.IS_FIRST_ACCESS;
  }
  if (message.includes(ERROR_API.INVALID_LOGIN)) {
    return MESSAGES_ERROR.LOGIN_MESSAGE;
  }
  if (message.includes(ERROR_API.IS_RESET_PASSWORD)) {
    return MESSAGES_INFORMATION.IS_RESET_PASSWORD;
  }
  if (message.includes(ERROR_API.NOT_FOUND_DOCUMENT)) {
    return MESSAGES_ERROR.DOCUMENT_NOT_FOUND;
  }
  if(message.includes(ERROR_API.INACTIVE_USER)){
    return MESSAGES_ERROR.BLOKED_USER;
  }
  return MESSAGES_ERROR.DEFAUL_ERROR;
}
