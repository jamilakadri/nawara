const userId = '223b130b-1f3e-4b0f-8fa8-c6aece34f924';
const query = `query EmployeeByUserId($userId: ID!) {\n  employeeByUserId(userId: $userId) {\n    id\n    onboardingId\n    phone\n    additionalInfo\n    userFirstName\n    userLastName\n    userEmail\n    positionTitle\n    departmentName\n  }\n}`;

(async () => {
  const response = await globalThis.fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { userId } }),
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
})();
