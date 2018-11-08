pragma solidity ^0.4.0;

import {D} from "../contracts/data.sol";
import {Utils} from "../contracts/utils.sol";

contract TestUtils {
    function testLowestBitSet() internal pure {
        require(Utils.lowestBitSet(0x123) == 0);
        require(Utils.lowestBitSet(0x124) == 2);
        require(Utils.lowestBitSet(0x11 << 30) == 30);
        require(Utils.lowestBitSet(1 << 255) == 255);
    }

    function testChopFirstBit() internal pure {
        D.Label memory l;
        l.data = hex"ef1230";
        l.length = 20;
        uint bit1;
        uint bit2;
        uint bit3;
        uint bit4;
        (bit1, l) = Utils.chopFirstBit(l);
        (bit2, l) = Utils.chopFirstBit(l);
        (bit3, l) = Utils.chopFirstBit(l);
        (bit4, l) = Utils.chopFirstBit(l);
        require(bit1 == 1);
        require(bit2 == 1);
        require(bit3 == 1);
        require(bit4 == 0);
        require(l.length == 16);
        require(l.data == hex"F123");

        l.data = hex"80";
        l.length = 1;
        (bit1, l) = Utils.chopFirstBit(l);
        require(bit1 == 1);
        require(l.length == 0);
        require(l.data == 0);
    }

    function testRemovePrefix() internal pure {
        D.Label memory l;
        l.data = hex"ef1230";
        l.length = 20;
        l = Utils.removePrefix(l, 4);
        require(l.length == 16);
        require(l.data == hex"f123");
        l = Utils.removePrefix(l, 15);
        require(l.length == 1);
        require(l.data == hex"80");
        l = Utils.removePrefix(l, 1);
        require(l.length == 0);
        require(l.data == 0);
    }

    function testCommonPrefix() internal pure {
        D.Label memory a;
        D.Label memory b;
        a.data = hex"abcd";
        a.length = 16;
        b.data = hex"a000";
        b.length = 16;
        require(Utils.commonPrefix(a, b) == 4);

        b.length = 0;
        require(Utils.commonPrefix(a, b) == 0);

        b.data = hex"bbcd";
        b.length = 16;
        require(Utils.commonPrefix(a, b) == 3);
        require(Utils.commonPrefix(b, b) == b.length);
    }

    function testSplitAt() internal pure {
        D.Label memory a;
        a.data = hex"abcd";
        a.length = 16;
        D.Label memory x;
        D.Label memory y;
        (x, y) = Utils.splitAt(a, 0);
        require(x.length == 0);
        require(y.length == a.length);
        require(y.data == a.data);

        (x, y) = Utils.splitAt(a, 4);
        require(x.length == 4);
        require(x.data == hex"a0");
        require(y.length == 12);
        require(y.data == hex"bcd0");

        (x, y) = Utils.splitAt(a, 16);
        require(y.length == 0);
        require(x.length == a.length);
        require(x.data == a.data);
    }

    function testSplitCommonPrefix() internal pure {
        D.Label memory a;
        D.Label memory b;
        a.data = hex"abcd";
        a.length = 16;
        b.data = hex"a0f570";
        b.length = 20;
        D.Label memory prefix;
        D.Label memory suffix;
        (prefix, suffix) = Utils.splitCommonPrefix(b, a);
        require(prefix.length == 4);
        require(prefix.data == hex"a0");
        require(suffix.length == 16);
        require(suffix.data == hex"0f57");
    }
}
