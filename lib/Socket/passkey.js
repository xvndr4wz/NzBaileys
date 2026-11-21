// Passkey (WebAuthn) and payments-passkey methods over the MEX transport.
// Ported from wbails-v2 (src/Socket/registration.ts and src/Socket/managed-account.ts).
import { executeWMexQuery } from './mex.js';

export const PASSKEY_MEX_IDS = {
    // Registration / account passkeys
    PASSKEY_EXIST: '25188064727509430',
    PASSKEY_LIST_EXIST: '26930537423220681',
    PASSKEY_REQUEST_CHALLENGE: '26311497405176139',
    PASSKEY_VERIFY_CHALLENGE: '26876394218624479',
    PASSKEY_DELETE: '25225683640428243',
    REG_PASSKEY_START: '25415371271434748',
    REG_PASSKEY_FINISH: '24611221275218156',
    REG_PASSKEY_ENABLE: '25147880151540247',
    REG_PASSKEY_DISABLE: '27775237998742831',
    REG_PASSKEY_CLEAR: '25111972538494859',
    REG_PASSKEY_UPDATE_ENCRYPTION_STATUS: '24866837389649930',
    // Payments passkeys (managed account)
    PAYMENTS_PASSKEY_HAS_CREDENTIAL: '36878915648418618',
    PAYMENTS_PASSKEY_ENROLL_CHALLENGE: '25233109079721001',
    PAYMENTS_PASSKEY_ENROLL_VERIFY: '26563835863283058',
    PAYMENTS_PASSKEY_REGISTER_FINISH: '26658791263822236',
    PAYMENTS_PASSKEY_AUTH_CHALLENGE: '26425370627105628',
    PAYMENTS_PASSKEY_TOGGLE_ON: '25841989828834577',
    PAYMENTS_PASSKEY_TOGGLE_OFF: '26267673096201391',
    PAYMENTS_PASSKEY_TOGGLE_CHALLENGE: '26133062322993192',
    PAYMENTS_PASSKEY_TOGGLE_CLEANUP: '26492078607084840',
    PAYMENTS_PASSKEY_CLEANUP: '26538338805859092'
}

/**
 * Adds passkey methods to a socket. Requires `query` and `generateMessageTag` on the input socket.
 */
export const makePasskeySocket = sock => {
    const { query, generateMessageTag } = sock

    const mex = (variables, queryId, dataPath) =>
        executeWMexQuery(variables, queryId, dataPath, query, generateMessageTag)

    // ── Registration / account passkeys ─────────────────────────────────────
    const passkeyExists = () => mex({}, PASSKEY_MEX_IDS.PASSKEY_EXIST, 'xwa2_passkey_exist_response')
    const passkeyListExists = () => mex({}, PASSKEY_MEX_IDS.PASSKEY_LIST_EXIST, 'xwa2_passkey_list_exist_response')
    const passkeyRequestChallenge = () =>
        mex({}, PASSKEY_MEX_IDS.PASSKEY_REQUEST_CHALLENGE, 'xwa2_passkey_request_challenge')
    const passkeyVerifyChallenge = (credentialId, authenticatorData, clientDataJson, signature) =>
        mex(
            { credential_id: credentialId, authenticator_data: authenticatorData, client_data_json: clientDataJson, signature },
            PASSKEY_MEX_IDS.PASSKEY_VERIFY_CHALLENGE,
            'xwa2_passkey_verify_challenge'
        )
    const passkeyDelete = credentialId =>
        mex({ credential_id: credentialId }, PASSKEY_MEX_IDS.PASSKEY_DELETE, 'xwa2_passkey_delete')
    const regPasskeyStart = () => mex({}, PASSKEY_MEX_IDS.REG_PASSKEY_START, 'xwa2_reg_passkey_start_register')
    const regPasskeyFinish = (credentialId, attestationObject, clientDataJson) =>
        mex(
            { credential_id: credentialId, attestation_object: attestationObject, client_data_json: clientDataJson },
            PASSKEY_MEX_IDS.REG_PASSKEY_FINISH,
            'xwa2_reg_passkey_finish_register'
        )
    const regPasskeyEnable = () => mex({}, PASSKEY_MEX_IDS.REG_PASSKEY_ENABLE, 'xwa2_reg_passkey_enable')
    const regPasskeyDisable = () => mex({}, PASSKEY_MEX_IDS.REG_PASSKEY_DISABLE, 'xwa2_reg_passkey_disable')
    const regPasskeyClear = () => mex({}, PASSKEY_MEX_IDS.REG_PASSKEY_CLEAR, 'xwa2_reg_passkey_clear')
    const regPasskeyUpdateEncryptionStatus = encryptionEnabled =>
        mex(
            { encryption_enabled: encryptionEnabled },
            PASSKEY_MEX_IDS.REG_PASSKEY_UPDATE_ENCRYPTION_STATUS,
            'xwa2_reg_passkey_update_client_encryption_status'
        )

    // ── Payments passkeys ───────────────────────────────────────────────────
    const paymentsPasskeyHasCredential = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_HAS_CREDENTIAL, 'xwa2_payments_passkey_has_credential')
    const paymentsPasskeyEnrollChallenge = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_ENROLL_CHALLENGE, 'xwa2_payments_passkey_enroll_challenge')
    const paymentsPasskeyEnrollVerify = (credentialId, attestationObject, clientDataJson) =>
        mex(
            { credential_id: credentialId, attestation_object: attestationObject, client_data_json: clientDataJson },
            PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_ENROLL_VERIFY,
            'xwa2_payments_passkey_enroll_verify'
        )
    const paymentsPasskeyRegisterFinish = (credentialId, attestationObject, clientDataJson) =>
        mex(
            { credential_id: credentialId, attestation_object: attestationObject, client_data_json: clientDataJson },
            PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_REGISTER_FINISH,
            'xwa2_payments_passkey_register_finish'
        )
    const paymentsPasskeyAuthChallenge = credentialId =>
        mex({ credential_id: credentialId }, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_AUTH_CHALLENGE, 'xwa2_payments_passkey_auth_challenge')
    const paymentsPasskeyToggleOn = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_TOGGLE_ON, 'xwa2_payments_passkey_toggle_on')
    const paymentsPasskeyToggleOff = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_TOGGLE_OFF, 'xwa2_payments_passkey_toggle_off')
    const paymentsPasskeyToggleChallenge = credentialId =>
        mex({ credential_id: credentialId }, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_TOGGLE_CHALLENGE, 'xwa2_payments_passkey_toggle_challenge')
    const paymentsPasskeyToggleCleanup = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_TOGGLE_CLEANUP, 'xwa2_payments_passkey_toggle_cleanup')
    const paymentsPasskeyCleanup = () =>
        mex({}, PASSKEY_MEX_IDS.PAYMENTS_PASSKEY_CLEANUP, 'xwa2_payments_passkey_cleanup')

    return {
        ...sock,
        passkeyExists,
        passkeyListExists,
        passkeyRequestChallenge,
        passkeyVerifyChallenge,
        passkeyDelete,
        regPasskeyStart,
        regPasskeyFinish,
        regPasskeyEnable,
        regPasskeyDisable,
        regPasskeyClear,
        regPasskeyUpdateEncryptionStatus,
        paymentsPasskeyHasCredential,
        paymentsPasskeyEnrollChallenge,
        paymentsPasskeyEnrollVerify,
        paymentsPasskeyRegisterFinish,
        paymentsPasskeyAuthChallenge,
        paymentsPasskeyToggleOn,
        paymentsPasskeyToggleOff,
        paymentsPasskeyToggleChallenge,
        paymentsPasskeyToggleCleanup,
        paymentsPasskeyCleanup,
        PASSKEY_MEX_IDS
    }
}
