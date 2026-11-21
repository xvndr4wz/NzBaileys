// Pure helper that decides which group participants receive a sendMessageMembers broadcast.
// Ported from wbails-v2 (src/Socket/messages-send.ts, sendMessageMembers).

const defaultIsSameUser = (a, b) => {
    const user = jid => String(jid || '').split('@')[0].split(':')[0]
    return user(a) !== '' && user(a) === user(b)
}

/**
 * Select recipient JIDs for a group broadcast.
 *
 * - onlyMember = true  -> non-admin members only (the group's regular members)
 * - onlyMember = false -> every participant
 *
 * The sender (meId) is always excluded.
 *
 * @param {Array<{id?: string, lid?: string, admin?: string|null}>} participants
 * @param {string} meId                 The sender's own JID
 * @param {object} [options]
 * @param {boolean} [options.onlyMember=true]
 * @param {(a: string, b: string) => boolean} [options.isSameUser]
 * @returns {string[]} recipient JIDs in participant order
 */
export const selectGroupMemberJids = (participants = [], meId, options = {}) => {
    const { onlyMember = true, isSameUser = defaultIsSameUser } = options

    return participants
        .filter(p => !(onlyMember && p.admin))
        .map(p => p.id || p.lid)
        .filter(jid => jid && !isSameUser(jid, meId))
}
