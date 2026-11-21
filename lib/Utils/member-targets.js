const defaultIsSameUser = (a, b) => {
    const user = jid => String(jid || '').split('@')[0].split(':')[0]
    return user(a) !== '' && user(a) === user(b)
}
export const selectGroupMemberJids = (participants = [], meId, options = {}) => {
    const { onlyMember = true, isSameUser = defaultIsSameUser } = options
    return participants
        .filter(p => !(onlyMember && p.admin))
        .map(p => p.id || p.lid)
        .filter(jid => jid && !isSameUser(jid, meId))
}