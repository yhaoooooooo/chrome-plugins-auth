// authenticator.js - Google身份验证器算法实现

// TOTP (基于时间的一次性密码) 算法实现
class GoogleAuthenticator {
  constructor() {
    // Base32字符集
    this.base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  }

  // 将Base32编码转换为字节数组
  base32ToBuffer(base32) {
    if (!base32) {
      throw new Error('Base32字符串不能为空');
    }

    // 移除空格和特殊字符
    base32 = base32.replace(/[^A-Z2-7]/gi, '');
    
    let bits = '';
    let buffer = [];
    
    for (let i = 0; i < base32.length; i++) {
      const c = base32.charAt(i).toUpperCase();
      if (c === '=') break; // padding character
      
      const val = this.base32Chars.indexOf(c);
      if (val === -1) {
        throw new Error('无效的Base32字符: ' + c);
      }
      
      bits += ('00000' + val.toString(2)).slice(-5);
    }
    
    for (let i = 0; i < bits.length - 7; i += 8) {
      buffer.push(parseInt(bits.substr(i, 8), 2));
    }
    
    return new Uint8Array(buffer);
  }

  // 生成HMAC-SHA1哈希
  async generateHMAC(key, data) {
    try {
      // 将密钥和数据转换为ArrayBuffer
      const keyBuffer = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        keyBuffer,
        data
      );
      
      // 将结果转换为字节数组
      return new Uint8Array(signature);
    } catch (error) {
      console.error('HMAC生成失败:', error);
      throw error;
    }
  }

  // 将数字转换为字节数组 (大端序)
  numberToBytesBigEndian(num) {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xFF;
      num = num >>> 8;
    }
    return bytes;
  }

  // 生成TOTP (Time-based One-time Password)
  async generateTOTP(secret, period = 30, digits = 6) {
    try {
      // 将Base32密钥转换为字节数组
      const key = this.base32ToBuffer(secret);
      
      // 计算时间计数器
      const counter = Math.floor(Date.now() / 1000 / period);
      
      // 将计数器转换为字节数组
      const counterBytes = this.numberToBytesBigEndian(counter);
      
      // 生成HMAC-SHA1哈希
      const hmac = await this.generateHMAC(key, counterBytes);
      
      // 应用动态截断算法
      const offset = hmac[hmac.byteLength - 1] & 0xf;
      const binary = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);
      
      // 计算最终的一次性密码
      const otp = binary % Math.pow(10, digits);
      return String(otp).padStart(digits, '0');
    } catch (error) {
      console.error('TOTP生成失败:', error);
      throw error;
    }
  }

  // 生成HOTP (HMAC-based One-time Password)
  async generateHOTP(secret, counter, digits = 6) {
    try {
      const key = this.base32ToBuffer(secret);
      const counterBytes = this.numberToBytesBigEndian(counter);
      const hmac = await this.generateHMAC(key, counterBytes);
      
      const offset = hmac[hmac.byteLength - 1] & 0xf;
      const binary = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);
      
      const otp = binary % Math.pow(10, digits);
      return String(otp).padStart(digits, '0');
    } catch (error) {
      console.error('HOTP生成失败:', error);
      throw error;
    }
  }

  // 验证TOTP
  async verifyTOTP(token, secret, period = 30, window = 1) {
    try {
      // 检查当前时间窗口的令牌
      const currentToken = await this.generateTOTP(secret, period);
      if (token === currentToken) {
        return true;
      }
      
      // 检查相邻时间窗口（容错）
      for (let i = 1; i <= window; i++) {
        // 检查前一个时间窗口
        const prevTime = Math.floor((Date.now() / 1000 - i * period) / period);
        const prevCounter = this.numberToBytesBigEndian(prevTime);
        const prevKey = this.base32ToBuffer(secret);
        const prevHmac = await this.generateHMAC(prevKey, prevCounter);
        const prevOffset = prevHmac[prevHmac.byteLength - 1] & 0xf;
        const prevBinary = ((prevHmac[prevOffset] & 0x7f) << 24) |
                           ((prevHmac[prevOffset + 1] & 0xff) << 16) |
                           ((prevHmac[prevOffset + 2] & 0xff) << 8) |
                           (prevHmac[prevOffset + 3] & 0xff);
        const prevToken = (prevBinary % Math.pow(10, 6)).toString().padStart(6, '0');
        
        if (token === prevToken) {
          return true;
        }
        
        // 检查后一个时间窗口
        const nextTime = Math.floor((Date.now() / 1000 + i * period) / period);
        const nextCounter = this.numberToBytesBigEndian(nextTime);
        const nextKey = this.base32ToBuffer(secret);
        const nextHmac = await this.generateHMAC(nextKey, nextCounter);
        const nextOffset = nextHmac[nextHmac.byteLength - 1] & 0xf;
        const nextBinary = ((nextHmac[nextOffset] & 0x7f) << 24) |
                           ((nextHmac[nextOffset + 1] & 0xff) << 16) |
                           ((nextHmac[nextOffset + 2] & 0xff) << 8) |
                           (nextHmac[nextOffset + 3] & 0xff);
        const nextToken = (nextBinary % Math.pow(10, 6)).toString().padStart(6, '0');
        
        if (token === nextToken) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP验证失败:', error);
      return false;
    }
  }
}

// 导出GoogleAuthenticator类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleAuthenticator;
} else {
  window.GoogleAuthenticator = GoogleAuthenticator;
}