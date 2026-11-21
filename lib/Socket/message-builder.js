import crypto from 'crypto';
import { proto } from '../../WAProto/index.js';
import { generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/index.js';
export const makeMessageBuilderSocket = (sock) => {
    const { relayMessage, sendMessage, waUploadToServer } = sock;
    const pollActionStore = new Map();
    const sendJsonMessage = async (jid, content = {}, options = {}) => {
        const msg = generateWAMessageFromContent(jid, content, {});
        return relayMessage(jid, msg.message, { messageId: msg.key.id, ...options });
    };
    const sendActionPoll = async (jid, name = '', pollOptions = [], options = {}) => {
        const values = pollOptions.map(o => o.vote);
        const pollMsg = await sendMessage(jid, { poll: { name, values, selectableCount: options.selectableCount || 1 } }, options);
        pollActionStore.set(pollMsg.key.id, pollOptions);
        return pollMsg;
    };
    const resolvePollAction = (pollMessageId, selectedVoteLabel) => {
        const options = pollActionStore.get(pollMessageId);
        return options?.find(o => o.vote === selectedVoteLabel)?.action;
    };
    const sendAlbumMessage = async (jid, media = [], contextInfo = {}) => {
        const albumMsg = generateWAMessageFromContent(jid, proto.Message.fromObject({
            albumMessage: {
                expectedImageCount: media.filter(m => !/\.mp4$/i.test(m)).length,
                expectedVideoCount: media.filter(m => /\.mp4$/i.test(m)).length,
                contextInfo
            }
        }), {});
        const albumKey = {
            id: await relayMessage(jid, albumMsg.message, { messageId: albumMsg.key.id }),
            remoteJid: jid,
            fromMe: true
        };
        const keys = { album: albumKey };
        let i = 1;
        const mimetypes = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4'
        };
        const messagetypes = {
            jpg: 'imageMessage', jpeg: 'imageMessage', png: 'imageMessage',
            gif: 'imageMessage', webp: 'imageMessage', mp4: 'videoMessage'
        };
        for (const source of media) {
            const ext = source.split('.').pop().toLowerCase();
            const mimetype = mimetypes[ext];
            const type = messagetypes[ext];
            if (!mimetype || !type) {
                continue;
            }
            const msg = await prepareWAMessageMedia(
                { [type.startsWith('image') ? 'image' : 'video']: { url: source }, mimetype },
                { upload: waUploadToServer }
            );
            const mediaMessage = generateWAMessageFromContent(jid, proto.Message.fromObject({
                associatedChildMessage: {
                    message: {
                        messageContextInfo: {
                            messageSecret: crypto.randomBytes(32),
                            messageAssociation: {
                                associationType: 'MEDIA_ALBUM',
                                parentMessageKey: albumKey
                            }
                        },
                        [type]: { ...msg[type] }
                    }
                }
            }), {});
            keys[`media_${i++}`] = {
                id: await relayMessage(jid, mediaMessage.message, { messageId: mediaMessage.key.id }),
                fromMe: true,
                remoteJid: jid
            };
        }
        return keys;
    };
    const sendStatusMention = async (jid, content) => {
        const media = generateWAMessageFromContent('status@broadcast', content, {});
        const additionalNodes = [
            {
                tag: 'meta',
                attrs: {},
                content: [
                    {
                        tag: 'mentioned_users',
                        attrs: {},
                        content: [{ tag: 'to', attrs: { jid }, content: undefined }]
                    }
                ]
            }
        ];
        await relayMessage('status@broadcast', media.message, {
            messageId: media.key.id,
            statusJidList: [jid, sock.user?.id],
            additionalNodes
        });
        return media;
    };
    const sendRichResponse = async (jid, content = {}) => {
        const header = content?.header;
        const body = content?.body;
        const footer = content?.footer;
        let messageContextInfo = {};
        const sections = [];
        if (header) {
            const { disclaimer = false, disclaimerText = ' ', image = { inline: false }, title = '' } = header ?? {};
            if (disclaimer) {
                messageContextInfo = { messageContextInfo: { botMetadata: { messageDisclaimerText: disclaimerText } } };
            }
            if (title) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        __typename: 'GenAISingleLayoutViewModel',
                        primitive: { __typename: 'FOATextPrimitive', text: '# ' + title }
                    }
                });
            }
            if (image?.url) {
                sections.push(image.inline ? {
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        __typename: 'GenAISingleLayoutViewModel',
                        primitive: {
                            __typename: 'GenAIMarkdownTextUXPrimitive',
                            text: '{{header}}.{{/header}}',
                            inline_entities: [{
                                __typename: 'GenAITextInlineEntity',
                                key: 'header',
                                metadata: {
                                    __typename: 'GenAILatexItem',
                                    latex_expression: '.',
                                    font_height: 24,
                                    padding: 4,
                                    latex_image: {
                                        __typename: 'GenAIMediaItem',
                                        mime_type: image.mime_type || 'image/png',
                                        url: image.url,
                                        url_fallback: image.url,
                                        width: image.width || 500,
                                        height: image.height || 500,
                                        expiration_timestamp_ms: Date.now() + 86400000
                                    }
                                }
                            }]
                        }
                    }
                } : {
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        __typename: 'GenAISingleLayoutViewModel',
                        primitive: {
                            __typename: 'GenAIImagePrimitive',
                            preview_image: { __typename: 'GenAIMediaItem', mime_type: image.mime_type || 'image/png', url: image.url },
                            full_image: { __typename: 'GenAIMediaItem', mime_type: image.mime_type || 'image/png', url: image.url }
                        }
                    }
                });
            }
        }
        if (body) {
            const { cards = null, buttons = null, title = '', toast = '', carousel = false, row = false } = body ?? {};
            if ((carousel || row) && cards?.length >= 1) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        primitives: cards.map((card, cardIndex) => ({
                            __typename: 'GenAI3PExtWidgetPrimitive',
                            header: { __typename: 'GenAI3PExtWidgetStandardHeader', title: card?.title || '' },
                            body: {
                                __typename: 'GenAI3PExtCalendarEventList',
                                ctas: (card?.buttons || []).map((text, buttonIndex) => ({
                                    label: text,
                                    state: 'PENDING',
                                    kind: 'OTHER',
                                    tool_call_id: `${cardIndex}${buttonIndex}`,
                                    toast: { label: card?.toast || '', __typename: 'GenAI3PExtWidgetToast' },
                                    __typename: 'GenAI3PExtWidgetCTA'
                                })),
                                sections: []
                            }
                        })),
                        __typename: carousel ? 'GenAIHScrollLayoutViewModel' : 'GenAIActionRowLayoutViewModel'
                    }
                });
            } else if (buttons?.length) {
                sections.push({
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        primitive: {
                            __typename: 'GenAI3PExtWidgetPrimitive',
                            header: { __typename: 'GenAI3PExtWidgetStandardHeader', title: title || '' },
                            body: {
                                __typename: 'GenAI3PExtCalendarEventList',
                                ctas: buttons.map((text, buttonIndex) => ({
                                    label: text,
                                    state: 'PENDING',
                                    kind: 'OTHER',
                                    tool_call_id: `${buttonIndex}`,
                                    toast: { label: toast, __typename: 'GenAI3PExtWidgetToast' },
                                    __typename: 'GenAI3PExtWidgetCTA'
                                })),
                                sections: []
                            }
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                });
            }
        }
        if (footer) {
            const { text = '', url = '', image = {} } = footer ?? {};
            const img = [];
            if (image?.url) {
                img.push({
                    __typename: 'GenAIMarkdownTextUXPrimitive',
                    text: '{{header}}.{{/header}}',
                    inline_entities: [{
                        __typename: 'GenAITextInlineEntity',
                        key: 'header',
                        metadata: {
                            __typename: 'GenAILatexItem',
                            latex_expression: '.',
                            font_height: 24,
                            padding: -5,
                            latex_image: {
                                __typename: 'GenAIMediaItem',
                                mime_type: image.mime_type || 'image/png',
                                url: image.url,
                                url_fallback: image.url,
                                width: image.width || 100,
                                height: image.height || 100,
                                expiration_timestamp_ms: Date.now() + 86400000
                            }
                        }
                    }]
                });
            }
            sections.push({
                view_model: {
                    primitives: [
                        { cta_text: text || '', cta_type: 'OPEN_URL', cta_url: url || '', __typename: 'GenAIFooterActionPrimitive' },
                        ...img
                    ],
                    __typename: 'GenAIActionRowLayoutViewModel'
                }
            });
        }
        return sendJsonMessage(jid, {
            ...messageContextInfo,
            richResponseMessage: {
                unifiedResponse: { data: Buffer.from(JSON.stringify({ sections })).toString('base64') },
                contextInfo: content?.contextInfo ?? {}
            }
        });
    };
    const sendButtonsMessage = async (jid, { text = '', footer = '', buttons = [] } = {}, options = {}) => {
        const interactiveMessage = {
            body: { text },
            ...(footer ? { footer: { text: footer } } : {}),
            nativeFlowMessage: {
                buttons: buttons.map(b => ({
                    name: b.name || 'quick_reply',
                    buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
                }))
            }
        };
        return sendJsonMessage(jid, { viewOnceMessage: { message: { interactiveMessage } } }, options);
    };
    const sendListMessage = async (jid, { text = '', footer = '', buttonText = 'Menu', sections = [] } = {}, options = {}) => {
        const interactiveMessage = {
            body: { text },
            ...(footer ? { footer: { text: footer } } : {}),
            nativeFlowMessage: {
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({ title: buttonText, sections })
                }]
            }
        };
        return sendJsonMessage(jid, { viewOnceMessage: { message: { interactiveMessage } } }, options);
    };
    const sendCarouselMessage = async (jid, { text = '', footer = '', cards = [] } = {}, options = {}) => {
        const cardMessages = [];
        for (const card of cards) {
            let headerMedia = {};
            if (card.image) {
                const uploaded = await prepareWAMessageMedia(
                    { image: { url: card.image }, mimetype: card.mimetype || 'image/jpeg' },
                    { upload: waUploadToServer }
                );
                headerMedia = { imageMessage: uploaded.imageMessage };
            }
            cardMessages.push({
                header: { title: card.title || '', hasMediaAttachment: !!card.image, ...headerMedia },
                body: { text: card.body || '' },
                nativeFlowMessage: {
                    buttons: (card.buttons || []).map(b => ({
                        name: b.name || 'quick_reply',
                        buttonParamsJson: JSON.stringify({ display_text: b.text, id: b.id })
                    }))
                }
            });
        }
        const message = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text },
                        ...(footer ? { footer: { text: footer } } : {}),
                        carouselMessage: { cards: cardMessages, messageVersion: 1 }
                    }
                }
            }
        };
        return sendJsonMessage(jid, message, options);
    };
    const forwardMessage = async (jid, message, options = {}) => {
        return sendMessage(jid, { forward: message, force: options.force }, options);
    };
    const sendVCard = async (jid, contacts, options = {}) => {
        const list = Array.isArray(contacts) ? contacts : [contacts];
        const built = list.map(c => {
            const waid = c.waid || c.phone;
            const vcard = 'BEGIN:VCARD\n'
                + 'VERSION:3.0\n'
                + `FN:${c.name || 'Unknown'}\n`
                + (c.organization ? `ORG:${c.organization};\n` : '')
                + `TEL;type=CELL;type=VOICE;waid=${waid}:+${c.phone}\n`
                + 'END:VCARD';
            return { displayName: c.name || 'Unknown', vcard };
        });
        if (built.length === 1) {
            return sendMessage(jid, { contacts: { contacts: built } }, options);
        }
        return sendMessage(jid, { contacts: { displayName: `${built.length} contacts`, contacts: built } }, options);
    };
    const broadcastMessage = async (jids, content, options = {}) => {
        const { delayMs = 0, ...sendOptions } = options;
        const results = [];
        for (const jid of jids) {
            try {
                const result = await sendMessage(jid, content, sendOptions);
                results.push({ jid, ok: true, result });
            } catch (error) {
                results.push({ jid, ok: false, error });
            }
            if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return results;
    };
    return {
        ...sock,
        sendJsonMessage,
        sendActionPoll,
        resolvePollAction,
        sendAlbumMessage,
        sendStatusMention,
        sendRichResponse,
        sendButtonsMessage,
        sendListMessage,
        sendCarouselMessage,
        forwardMessage,
        sendVCard,
        broadcastMessage
    };
};