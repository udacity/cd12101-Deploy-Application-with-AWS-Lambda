import { ImagesAccess } from '../dataLayer/ImagesAccess.mjs'

const imagesAccess = new ImagesAccess()

export async function updateTodoAttachmentUrl(imageId, todoId, userId) {
  return await imagesAccess.updateTodoAttachmentUrl(imageId, todoId, userId)
}

export async function getUploadUrl(imageId) {
  return await imagesAccess.getUploadUrl(imageId)
}
