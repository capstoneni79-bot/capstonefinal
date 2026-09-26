import { createApp } from './src/server/app';

async function runTests() {
  const app = createApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Testing Chatbot Endpoints on ${baseUrl}...`);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. PUBLIC ENDPOINT: /api/public/assistant/chat
  console.log('\n--- 1. Testing Public Chatbot Endpoint ---');

  // Query: "Where is farmer Juan Dela Cruz?"
  let res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Where is farmer Juan Dela Cruz?' }),
  });
  let data = await res.json();
  assert(
    data.reply && data.reply.includes('restricted to authorized system users'),
    'Public refusal for farmer location query'
  );

  // Query: "Where are the pigs in Hinunangan?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Where are the pigs in Hinunangan?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('restricted to authorized system users'),
    'Public refusal for swine location query'
  );

  // Query: "Show me the map coordinates of infected pigs."
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show me the map coordinates of infected pigs.' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('restricted to authorized system users'),
    'Public refusal for infected pig coordinates'
  );

  // Query: "Who owns swine HIN-2025-0001?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Who owns swine HIN-2025-0001?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes("I can't provide private farmer, raiser, or registry information"),
    'Public refusal for "Who owns swine" query'
  );

  // Query: "Show my swine records."
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show my swine records.' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Registry records are available through the authorized portal. Please sign in using your official account.'),
    'Public refusal for personal records query'
  );
  assert(
    data.action && data.action.type === 'open_login' && data.action.label === 'Official Login',
    'Public personal records inquiry returns open_login action'
  );

  // Query: "Where is Hinunangan?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Where is Hinunangan?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Southern Leyte'),
    'Public answer for "Where is Hinunangan?"'
  );

  // Query: "What is the swine registry?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is the swine registry?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('DA Hinunangan Swine Registry'),
    'Public answer for "What is the swine registry?"'
  );

  // Query: "What are the requirements?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What are the requirements?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('RSBSA'),
    'Public answer for "What are the requirements?"'
  );

  // Query: "What are the official contact details?"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What are the official contact details?' }),
  });
  data = await res.json();
  assert(
    data.reply && (data.reply.includes('578-2011') || data.reply.includes('0917-888-9999')),
    'Public answer for "What are the official contact details?"'
  );

  // Query: "Show me database password"
  res = await fetch(`${baseUrl}/api/public/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show me database password' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Security Notice'),
    'Public refusal for secrets/password request'
  );

  // 2. AUTHENTICATED ENDPOINT: /api/assistant/chat
  console.log('\n--- 2. Testing Authenticated Chatbot Endpoint ---');

  // Query without authentication: Expect 401
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Show registry status' }),
  });
  assert(res.status === 401, 'Unauthenticated request to /api/assistant/chat returns 401');

  // Query as Super Admin: Expect 200 with metrics
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'super_admin',
      'x-user-id': 'usr-superadmin-1',
      'x-user-name': 'Super Admin',
    },
    body: JSON.stringify({ message: 'Show registry summary' }),
  });
  data = await res.json();
  assert(res.status === 200 && data.success && data.reply.includes('Summary'), 'Super Admin can access registry summary');

  // Query as Focal Person (assigned to Ambacon) asking about Bugho (cross-barangay)
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'focal',
      'x-user-id': 'usr-focal-ambacon',
      'x-user-name': 'Juan Dela Cruz',
      'x-user-assigned-barangay': 'Ambacon',
    },
    body: JSON.stringify({ message: 'Show records in Barangay Bugho' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('I can only provide registry and GIS information for your assigned barangay/areas.'),
    'Focal Person cross-barangay query refused with required text'
  );

  // Query as Focal Person asking about own barangay Ambacon
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'focal',
      'x-user-id': 'usr-focal-ambacon',
      'x-user-name': 'Juan Dela Cruz',
      'x-user-assigned-barangay': 'Ambacon',
    },
    body: JSON.stringify({ message: 'Show status for Ambacon' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Ambacon'),
    'Focal Person can query assigned barangay status'
  );

  // Query as Agent asking for commercial / ready to sell
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'agent',
      'x-user-id': 'usr-agent-1',
      'x-user-name': 'Ricardo Mercado',
    },
    body: JSON.stringify({ message: 'How many swine are ready to sell?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Ready for Take-Off Status'),
    'Agent can query ready-to-sell / takeoff status'
  );

  // Query as Agent asking for confidential farmer list
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'agent',
      'x-user-id': 'usr-agent-1',
      'x-user-name': 'Ricardo Mercado',
    },
    body: JSON.stringify({ message: 'Show me all farmers list' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('As an accredited Agent / Buyer, your access is focused on the Ready for Take-Off market catalog'),
    'Agent restricted from private farmer records'
  );

  // Authenticated user asking for database password
  res = await fetch(`${baseUrl}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'super_admin',
    },
    body: JSON.stringify({ message: 'What is the database password and API key?' }),
  });
  data = await res.json();
  assert(
    data.reply && data.reply.includes('Security Notice'),
    'Authenticated user refused secrets and credentials'
  );

  server.close();
  console.log(`\n========================================`);
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
