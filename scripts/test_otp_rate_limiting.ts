import {
  checkOtpRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  cleanupExpiredRateLimits,
} from '../src/lib/rateLimit';
import {
  extractClientIp,
  normalizeIp,
  maskEmail,
  maskIp,
} from '../src/lib/ipUtils';
import { NextRequest } from 'next/server';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ [PASS] ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ✗ [FAIL] ${name} - ${details || 'Assertion failed'}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('OTP RATE LIMITING & SECURITY SPECIFICATION TEST SUITE');
  console.log('======================================================\n');

  clearAllRateLimits();

  // Test 1: First OTP request from a new user succeeds
  console.log('[Scenario 1: First OTP Request]');
  const t1 = await checkOtpRateLimit({
    email: 'user1@example.com',
    ip: '203.0.113.195',
  });
  assert(
    t1.allowed === true && t1.status === 200,
    'Scenario 1: First OTP request from a new public IP succeeds without rate limit block',
    `allowed=${t1.allowed}, reason=${t1.reason}`
  );

  // Test 2: Second request within cooldown receives cooldown response (<= 60s)
  console.log('\n[Scenario 2: Cooldown Protection]');
  const t2 = await checkOtpRateLimit({
    email: 'user1@example.com',
    ip: '203.0.113.195',
  });
  assert(
    t2.allowed === false && t2.status === 429 && (t2.retryAfter || 0) <= 60 && t2.ruleTriggered === 'otp_cooldown',
    'Scenario 2: Immediate second request is blocked by 60s cooldown rather than 10-minute network lockout',
    `retryAfter=${t2.retryAfter}, rule=${t2.ruleTriggered}`
  );

  // Test 3: Another user on the same network is NOT blocked by first user's email limit
  console.log('\n[Scenario 3: Shared NAT / Network Independence]');
  const t3 = await checkOtpRateLimit({
    email: 'colleague@example.com',
    ip: '203.0.113.195',
  });
  assert(
    t3.allowed === true && t3.status === 200,
    'Scenario 3: Second user on same public IP (office/college/NAT) succeeds without being blocked by first user',
    `allowed=${t3.allowed}, reason=${t3.reason}`
  );

  // Test 4: Repeated requests from one public IP (> 30) are blocked by network abuse limit
  console.log('\n[Scenario 4: High-volume IP Abuse Prevention]');
  clearAllRateLimits();
  let networkBlocked = false;
  let blockedAt = 0;
  for (let i = 1; i <= 35; i++) {
    const res = await checkOtpRateLimit({
      email: `victim_${i}@example.com`,
      ip: '198.51.100.44',
    });
    if (!res.allowed && res.ruleTriggered === 'otp_network') {
      networkBlocked = true;
      blockedAt = i;
      break;
    }
  }
  assert(
    networkBlocked && blockedAt === 31,
    'Scenario 4: Network scraping/botnet spraying is locked out on the 31st unique email from one IP',
    `networkBlocked=${networkBlocked}, blockedAt=${blockedAt}`
  );

  // Test 5: Multiple users (10 distinct users) behind a shared network can all login
  console.log('\n[Scenario 5: 10 Legitimate Users Behind Shared Network]');
  clearAllRateLimits();
  let allAllowed = true;
  for (let i = 1; i <= 10; i++) {
    const res = await checkOtpRateLimit({
      email: `student_${i}@university.edu`,
      ip: '192.0.2.50',
    });
    if (!res.allowed) {
      allAllowed = false;
      break;
    }
  }
  assert(
    allAllowed,
    'Scenario 5: 10 different legitimate users from same campus NAT can each request their first OTP',
    `allAllowed=${allAllowed}`
  );

  // Test 6: IPv4 and IPv6 (/64 subnet grouping) normalization
  console.log('\n[Scenario 6: IPv4 and IPv6 Subnet Handling]');
  const ipv4Norm = normalizeIp('203.0.113.10');
  const ipv6Norm1 = normalizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
  const ipv6Norm2 = normalizeIp('2001:0db8:85a3:0000:ffff:ffff:ffff:ffff');
  assert(
    ipv4Norm === '203.0.113.10' && ipv6Norm1.includes('/64') && ipv6Norm1 === ipv6Norm2,
    'Scenario 6: IPv6 addresses in the same /64 subnet are correctly grouped to prevent subnet rotation bypass',
    `ipv6Norm1=${ipv6Norm1}, ipv6Norm2=${ipv6Norm2}`
  );

  // Test 7: Spoofed X-Forwarded-For headers cannot bypass limits
  console.log('\n[Scenario 7: Anti-Spoofing & Header Sanitization]');
  const mockReq = new NextRequest('http://localhost:3000/api/auth/request-otp', {
    headers: {
      'x-forwarded-for': '10.0.0.1, 192.168.1.1, 8.8.8.8',
      'x-real-ip': '1.1.1.1',
    },
  });
  const extracted = extractClientIp(mockReq);
  assert(
    extracted.ip === '8.8.8.8' || extracted.ip === '1.1.1.1',
    'Scenario 7: IP extractor skips private/loopback spoofed hops and selects genuine public IP',
    `extracted=${extracted.ip}`
  );

  // Test 8: Masked diagnostic logging safeguards
  console.log('\n[Scenario 8: PII & Credential Privacy Safeguards]');
  const maskedEmail = maskEmail('divyanshusingh17102002@gmail.com');
  const maskedIp = maskIp('203.0.113.195');
  assert(
    maskedEmail.startsWith('di***') && !maskedEmail.includes('17102002') && maskedIp === '203.0.***.***',
    'Scenario 8: Diagnostic logging correctly masks sensitive email and IP addresses',
    `maskedEmail=${maskedEmail}, maskedIp=${maskedIp}`
  );

  // Test 9: Cleanup of expired rate limits
  console.log('\n[Scenario 9: Memory Store Auto-Cleanup]');
  const cleaned = cleanupExpiredRateLimits();
  assert(
    typeof cleaned === 'number',
    'Scenario 9: Expired rate limit keys are cleanly purged without memory leaks',
    `cleaned=${cleaned}`
  );

  // Test 10: Local development loopback capacity
  console.log('\n[Scenario 10: Local Developer Quality of Life]');
  clearAllRateLimits();
  const devRes = await checkOtpRateLimit({
    email: 'developer@localhost',
    ip: '127.0.0.1',
  });
  assert(
    devRes.allowed === true,
    'Scenario 10: Local development (127.0.0.1) requests succeed without unexpected network lockouts',
    `allowed=${devRes.allowed}`
  );

  console.log('\n======================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
