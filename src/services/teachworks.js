const API_BASE = process.env.TEACHWORKS_API_URL || 'https://api.teachworks.com';

function authHeaders() {
  return {
    'Authorization': `Token token=${process.env.TEACHWORKS_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

// Validate that an email belongs to an active employee
export async function validateEmployeeEmail(email) {
  if (!process.env.TEACHWORKS_API_KEY) {
    console.warn('TEACHWORKS_API_KEY not set — allowing all emails in dev mode');
    return { isValid: true, employee: { id: 0, email, first_name: 'Dev', last_name: 'User' } };
  }

  const key = process.env.TEACHWORKS_API_KEY || '';
  console.log(`Teachworks key preview: "${key.slice(0, 6)}..." length=${key.length}`);

  const res = await fetch(`${API_BASE}/v1/employees?email=${encodeURIComponent(email)}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    console.error(`Teachworks API error ${res.status}: ${await res.text()}`);
    return { isValid: false };
  }

  const data = await res.json();
  console.log('Teachworks response:', JSON.stringify(data).slice(0, 500));
  const employee = data.find(
    e => e.email.toLowerCase() === email.toLowerCase() && e.status.toLowerCase() === 'active'
  );
  console.log('Matched employee:', employee ? `${employee.email} status=${employee.status}` : 'none');

  return employee ? { isValid: true, employee } : { isValid: false };
}

// Get students assigned to a tutor (employee) by their employee ID
export async function getStudentsForTutor(employeeId) {
  if (!process.env.TEACHWORKS_API_KEY) {
    // Return mock data in dev mode
    return [
      { id: 1, first_name: 'Alice', last_name: 'Smith', grade: 'Year 10', subject: 'Maths' },
      { id: 2, first_name: 'Bob', last_name: 'Jones', grade: 'Year 11', subject: 'English' },
      { id: 3, first_name: 'Carol', last_name: 'White', grade: 'Year 9', subject: 'Science' },
    ];
  }

  // Fetch customers (students) linked to this employee via lessons
  // Teachworks: GET /v1/customers filtered by employee_id
  const res = await fetch(
    `${API_BASE}/v1/customers?employee_id=${employeeId}&per_page=100`,
    { headers: authHeaders() }
  );

  if (!res.ok) {
    console.error(`Teachworks students fetch error ${res.status}`);
    return [];
  }

  const data = await res.json();
  // data may be an array or { customers: [...] } depending on endpoint
  return Array.isArray(data) ? data : (data.customers || []);
}

// Look up the employee record for an email (to get their ID)
export async function getEmployeeByEmail(email) {
  if (!process.env.TEACHWORKS_API_KEY) {
    return { id: 0, email, first_name: 'Dev', last_name: 'User' };
  }

  const res = await fetch(`${API_BASE}/v1/employees?email=${encodeURIComponent(email)}`, {
    headers: authHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.find(e => e.email.toLowerCase() === email.toLowerCase()) || null;
}
