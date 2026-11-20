import assert from 'assert';

// 1. Initial State: Secrets are missing, testing that system fails closed
delete process.env.ADMIN_MASTER_SECRET;
delete process.env.BETTER_AUTH_SECRET;
delete process.env.INTERNAL_SERVICE_KEY;

import {
  encryptEmail,
  decryptEmail,
  computeEmailHmac,
  isValidEncryptedPayload,
  verifyIsSoleAdmin,
  reassignSoleAdminUserId,
} from '../src/lib/adminSecurity';
import {
  normalizeIp,
  checkOtpRateLimit,
} from '../src/lib/rateLimit';
import {
  createInternalAssertion,
  verifyInternalAssertion,
} from '../src/lib/internalAuth';

console.log('🧪 Starting Targeted Security & Cryptographic Validation Suite...\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✅ PASSED: ${name}`);
          passedTests++;
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ❌ FAILED: ${name}\n     ${msg}`);
          failedTests++;
        });
    } else {
      console.log(`  ✅ PASSED: ${name}`);
      passedTests++;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ FAILED: ${name}\n     ${msg}`);
    failedTests++;
  }
}

async function runAll() {
  console.log('--- SECTION 0: FAIL CLOSED ON MISSING SECRETS ---');

  runTest('0.1 Missing admin secret throws error (fails closed)', () => {
    assert.throws(
      () => {
        encryptEmail('admin@gyanvatsala.in');
      },
      /ADMIN_MASTER_SECRET or BETTER_AUTH_SECRET must be configured/,
      'Must fail closed when admin secret is absent'
    );
  });

  runTest('0.2 Missing internal service key throws error (fails closed)', () => {
    assert.throws(
      () => {
        createInternalAssertion({ userId: 'u1', email: 'test@example.com', role: 'user' });
      },
      /INTERNAL_SERVICE_KEY environment variable is missing/,
      'Must fail closed when internal key is absent'
    );
  });

  // Now set valid high-entropy test secrets for subsequent cryptographic testing
  process.env.ADMIN_MASTER_SECRET = 'pixelkit_test_admin_master_secret_32_characters_minimum!';
  process.env.INTERNAL_SERVICE_KEY = 'pixelkit_test_internal_key_32_characters_minimum!';

  console.log('\n--- SECTION 1: ADMIN CRYPTOGRAPHY & PAYLOAD VALIDATION ---');

  runTest('1.1 Encrypt generates valid v1 format', () => {
    const email = 'admin.target@gyanvatsala.in';
    const encrypted = encryptEmail(email);
    assert.ok(encrypted.startsWith('v1:'), 'Payload should start with v1:');
    assert.strictEqual(isValidEncryptedPayload(encrypted), true);
  });

  runTest('1.2 Decrypt recovers matching email accurately', () => {
    const email = 'admin.target@gyanvatsala.in';
    const encrypted = encryptEmail(email);
    const decrypted = decryptEmail(encrypted);
    assert.strictEqual(decrypted, email);
  });

  runTest('1.3 Tampered ciphertext is rejected safely (returns null)', () => {
    const email = 'admin.target@gyanvatsala.in';
    const encrypted = encryptEmail(email);
    const parts = encrypted.split(':');
    const corruptedHex = parts[3].slice(0, -2) + (parts[3].endsWith('aa') ? 'bb' : 'aa');
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${corruptedHex}`;
    const result = decryptEmail(tampered);
    assert.strictEqual(result, null, 'Tampered ciphertext must fail authentication and return null');
  });

  runTest('1.4 Modified authentication tag is rejected safely (returns null)', () => {
    const email = 'admin.target@gyanvatsala.in';
    const encrypted = encryptEmail(email);
    const parts = encrypted.split(':');
    const corruptedTag = '00'.repeat(16);
    const tampered = `${parts[0]}:${parts[1]}:${corruptedTag}:${parts[3]}`;
    const result = decryptEmail(tampered);
    assert.strictEqual(result, null, 'Tampered auth tag must return null');
  });

  runTest('1.5 Malformed IV length is rejected by isValidEncryptedPayload', () => {
    assert.strictEqual(isValidEncryptedPayload('v1:1234:5678:abcd'), false);
    assert.strictEqual(isValidEncryptedPayload(''), false);
    assert.strictEqual(isValidEncryptedPayload('not:a:valid:gcm:payload'), false);
  });

  runTest('1.6 HMAC-SHA256 signature is deterministic and sensitive to alteration', () => {
    const email = 'admin.target@gyanvatsala.in';
    const hmac1 = computeEmailHmac(email);
    const hmac2 = computeEmailHmac(email);
    const hmacOther = computeEmailHmac('other@gyanvatsala.in');
    assert.strictEqual(hmac1, hmac2);
    assert.notStrictEqual(hmac1, hmacOther);
    assert.strictEqual(hmac1.length, 64, 'HMAC-SHA256 hex must be 64 characters');
  });

  console.log('\n--- SECTION 2: ADMIN VERIFICATION & FAIL-CLOSED ENFORCEMENT ---');

  await runTest('2.1 Missing user ID fails closed (returns false)', async () => {
    const result = await verifyIsSoleAdmin({ id: '', email: 'admin.target@gyanvatsala.in' });
    assert.strictEqual(result, false);
  });

  await runTest('2.2 Missing email fails closed (returns false)', async () => {
    const result = await verifyIsSoleAdmin({ id: 'usr_valid_123', email: '' });
    assert.strictEqual(result, false);
  });

  await runTest('2.3 Non-existent user ID or unverified account fails closed', async () => {
    const result = await verifyIsSoleAdmin({ id: 'usr_nonexistent_fake_999', email: 'fake@example.com' });
    assert.strictEqual(result, false);
  });

  await runTest('2.4 Unauthorized reassignment rejected with invalid master secret', async () => {
    const res = await reassignSoleAdminUserId({
      newAdminUserId: 'usr_attacker',
      adminEmail: 'attacker@evil.com',
      masterSecret: 'wrong_secret_attempt',
    });
    assert.strictEqual(res.success, false);
    assert.ok(
      res.message.toLowerCase().includes('secret') ||
      res.message.toLowerCase().includes('invalid') ||
      res.message.toLowerCase().includes('unavailable')
    );
  });

  console.log('\n--- SECTION 3: INTERNAL IDENTITY ASSERTION TOKENS ---');

  runTest('3.1 Generates valid assertion with JTI nonce and 60s expiration', () => {
    const token = createInternalAssertion({
      userId: 'usr_test_bff',
      email: 'verified@gyanvatsala.in',
      role: 'admin',
      plan: 'PrimeUltra',
    });
    assert.ok(token.includes('.'), 'Assertion must be format payload.signature');
    const verified = verifyInternalAssertion(token);
    assert.ok(verified, 'Fresh assertion must be valid');
    assert.strictEqual(verified?.sub, 'usr_test_bff');
    assert.strictEqual(verified?.role, 'admin');
    assert.strictEqual(verified?.aud, 'pixelkit-backend');
    assert.strictEqual(verified?.iss, 'pixelkit-bff');
    assert.ok(verified?.jti, 'JTI must be non-empty');
  });

  runTest('3.2 Missing user ID throws error during assertion generation', () => {
    assert.throws(
      () => {
        createInternalAssertion({ userId: '', email: 'test@example.com', role: 'user' });
      },
      /valid user ID/,
      'Assertion generation without user ID must throw error'
    );
  });

  runTest('3.3 Tampered assertion token signature fails verification', () => {
    const token = createInternalAssertion({
      userId: 'usr_test_bff',
      email: 'verified@gyanvatsala.in',
      role: 'admin',
    });
    const [payload, sig] = token.split('.');
    const forgedSig = sig.slice(0, -4) + '0000';
    const result = verifyInternalAssertion(`${payload}.${forgedSig}`);
    assert.strictEqual(result, null, 'Forged signature must fail verification');
  });

  console.log('\n--- SECTION 4: RATE LIMITING & ANTI-SPOOFING TESTS ---');

  runTest('4.1 IPv6 address normalization groups /64 subnets', () => {
    const ip1 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const ip2 = '2001:0db8:85a3:0000:ffff:ffff:ffff:ffff';
    const norm1 = normalizeIp(ip1);
    const norm2 = normalizeIp(ip2);
    assert.strictEqual(norm1, '2001:0db8:85a3:0000::/64');
    assert.strictEqual(norm2, '2001:0db8:85a3:0000::/64');
    assert.strictEqual(norm1, norm2, 'Rotating within /64 subnet must yield identical rate-limit key');
  });

  runTest('4.2 Untrusted client identifier handled without 127.0.0.1 universal key', () => {
    const result = normalizeIp('');
    assert.strictEqual(result, 'untrusted-client');
  });

  runTest('4.3 Dual-axis OTP rate limiter restricts repeated IP submissions', () => {
    const testIp = '198.51.100.45';
    // 5 attempts allowed
    for (let i = 1; i <= 5; i++) {
      const res = checkOtpRateLimit(testIp, `unique_recipient_${i}@gyanvatsala.in`);
      assert.strictEqual(res.allowed, true, `Request ${i} should be permitted`);
    }
    // 6th attempt from same IP blocked
    const res6 = checkOtpRateLimit(testIp, 'unique_recipient_6@gyanvatsala.in');
    assert.strictEqual(res6.allowed, false, '6th request from same IP must be blocked');
    assert.ok(res6.reason?.includes('network'));
  });

  runTest('4.4 Dual-axis OTP rate limiter restricts spraying against single email', () => {
    const targetEmail = 'victim.target@gyanvatsala.in';
    // Max 3 attempts per email
    for (let i = 1; i <= 3; i++) {
      const res = checkOtpRateLimit(`203.0.113.${i}`, targetEmail);
      assert.strictEqual(res.allowed, true);
    }
    // 4th attempt against same email from different IP blocked
    const res4 = checkOtpRateLimit('203.0.113.99', targetEmail);
    assert.strictEqual(res4.allowed, false, '4th request targeting same email must be blocked');
    assert.ok(res4.reason?.includes('email'));
  });

  console.log(`\n========================================`);
  console.log(`Test Run Completed: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAll().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
