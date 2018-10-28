import { expect } from 'chai';

import { Colors } from './Colors';

describe('Colors', () => {
    it('should convert 3-digit hex rgb', () => {
        expect(Colors.hex2rgba('#fff')).to.be('rgb(255,255,255,1)');
    });
    it('should convert 6-digit hex rgb', () => {
        expect(Colors.hex2rgba('#ffffff')).to.be('rgb(255,255,255,1)');
    });
    it('should convert 4-digit hex rgba', () => {
        expect(Colors.hex2rgba('#ffff')).to.be('rgb(255,255,255,1)');
    });
    it('should convert 8-digit hex rgba', () => {
        expect(Colors.hex2rgba('#ffffffff')).to.be('rgb(255,255,255,1)');
    });
});
