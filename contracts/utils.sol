pragma solidity >=0.5.0 <0.6.0;

/**
 MIT License
 Original author: chriseth
 */

import {D} from "./data.sol";

library Utils {
    /// Returns a label containing the longest common prefix of `check` and `label`
    /// and a label consisting of the remaining part of `label`.
    function splitCommonPrefix(D.Label memory label, D.Label memory check) internal pure returns (D.Label memory prefix, D.Label memory labelSuffix) {
        return splitAt(label, commonPrefix(check, label));
    }
    /// Splits the label at the given position and returns prefix and suffix,
    /// i.e. prefix.length == pos and prefix.data . suffix.data == l.data.
    function splitAt(D.Label memory l, uint pos) internal pure returns (D.Label memory prefix, D.Label memory suffix) {
        require(pos <= l.length && pos <= 256, "Bad pos");
        prefix.length = pos;
        if (pos == 0) {
            prefix.data = bytes32(0);
        } else {
            prefix.data = l.data & ~bytes32((uint(1) << (256 - pos)) - 1);
        }
        suffix.length = l.length - pos;
        suffix.data = l.data << pos;
    }
    /// Returns the length of the longest common prefix of the two labels.
    function commonPrefix(D.Label memory a, D.Label memory b) internal pure returns (uint prefix) {
        uint length = a.length < b.length ? a.length : b.length;
        // TODO: This could actually use a "highestBitSet" helper
        uint diff = uint(a.data ^ b.data);
        uint mask = 1 << 255;
        for (; prefix < length; prefix++)
        {
            if ((mask & diff) != 0)
                break;
            diff += diff;
        }
    }
    /// Returns the result of removing a prefix of length `prefix` bits from the
    /// given label (i.e. shifting its data to the left).
    function removePrefix(D.Label memory l, uint prefix) internal pure returns (D.Label memory r) {
        require(prefix <= l.length, "Bad lenght");
        r.length = l.length - prefix;
        r.data = l.data << prefix;
    }
    /// Removes the first bit from a label and returns the bit and a
    /// label containing the rest of the label (i.e. shifted to the left).
    function chopFirstBit(D.Label memory l) internal pure returns (uint firstBit, D.Label memory tail) {
        require(l.length > 0, "Empty element");
        return (uint(l.data >> 255), D.Label(l.data << 1, l.length - 1));
    }
    /// Returns the first bit set in the bitfield, where the 0th bit
    /// is the least significant.
    /// Throws if bitfield is zero.
    /// More efficient the smaller the result is.
    function lowestBitSet(uint bitfield) internal pure returns (uint bit) {
        require(bitfield != 0, "Bad bitfield");
        bytes32 bitfieldBytes = bytes32(bitfield);
        // First, find the lowest byte set
        uint byteSet = 0;
        for (; byteSet < 32; byteSet++) {
            if (bitfieldBytes[31 - byteSet] != 0)
                break;
        }
        uint singleByte = uint(uint8(bitfieldBytes[31 - byteSet]));
        uint mask = 1;
        for (bit = 0; bit < 256; bit ++) {
            if ((singleByte & mask) != 0)
                return 8 * byteSet + bit;
            mask += mask;
        }
        assert(false);
        return 0;
    }
    /// Returns the value of the `bit`th bit inside `bitfield`, where
    /// the least significant is the 0th bit.
    function bitSet(uint bitfield, uint bit) internal pure returns (uint) {
        return (bitfield & (uint(1) << bit)) != 0 ? 1 : 0;
    }
}

