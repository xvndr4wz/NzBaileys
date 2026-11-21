// Pure builder for the rich-response payload used by sendRichMessage.
// Ported from wbails-v2 (src/Socket/messages-send.ts). It has no dependencies on the
// socket, so it can be unit-tested on its own.

const toBase64Json = value => Buffer.from(JSON.stringify(value)).toString('base64')

/**
 * Build the botForwardedMessage envelope for a rich response.
 * @param {object} opts
 * @param {object} [opts.unifiedResponse]          Captured unified response, serialized as base64 JSON
 * @param {Array}  [opts.submessages]              Rich submessages, sent as-is
 * @param {object} [opts.contextInfo]              Extra contextInfo merged before the bot fields
 * @param {object} [opts.originalRecipientMetadata] Serialized as base64 JSON when present
 * @returns {object} WAMessage content, ready for relayMessage
 */
export const buildRichMessageContent = (opts = {}) => {
    const { unifiedResponse, submessages, contextInfo, originalRecipientMetadata } = opts

    return {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    ...(submessages && { submessages }),
                    ...(unifiedResponse && { unifiedResponse: toBase64Json(unifiedResponse) }),
                    contextInfo: {
                        ...contextInfo,
                        forwardedAiBotMessageInfo: {
                            botJid: '0@bot'
                        },
                        forwardOrigin: 4,
                        botMessageSharingInfo: {
                            botEntryPointOrigin: 1,
                            forwardingScore: 1
                        }
                    },
                    ...(originalRecipientMetadata && {
                        originalRecipientMetadata: toBase64Json(originalRecipientMetadata)
                    })
                }
            }
        }
    }
}
