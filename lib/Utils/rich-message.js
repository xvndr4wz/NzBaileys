const toBase64Json = value => Buffer.from(JSON.stringify(value)).toString('base64')
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