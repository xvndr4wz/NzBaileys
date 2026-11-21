import protobuf from 'protobufjs/minimal.js';
const Long = protobuf.util.Long;
if (Long && Long.prototype && !Long.prototype.__poucodeSafeToString) {
    const originalToString = Long.prototype.toString;
    const safeToString = function toString(radix) {
        if (this !== null && this !== undefined && typeof this.isZero === 'function') {
            return originalToString.call(this, radix);
        }
        const value = this instanceof String || this instanceof Number ? this.valueOf() : this;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
            return String(value);
        }
        if (value && typeof value.low === 'number' && typeof value.high === 'number') {
            const combined = (BigInt(value.high >>> 0) << 32n) | BigInt(value.low >>> 0);
            if (!value.unsigned && value.high < 0) {
                return (combined - (1n << 64n)).toString();
            }
            return combined.toString();
        }
        return String(value);
    };
    Object.defineProperty(safeToString, '__poucodeSafeToString', { value: true });
    Long.prototype.toString = safeToString;
    Object.defineProperty(Long.prototype, '__poucodeSafeToString', { value: true });
}