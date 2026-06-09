export async function fetchGraphQL<T>(query: string, variables: any = {}): Promise<T> {
  const endpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Inject JWT token if available (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = await res.json();

  // Only throw if there are errors AND no usable data returned.
  // GraphQL can return partial data alongside errors — in that case
  // we prefer the data over crashing the caller.
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors);
    // If there is no data at all, throw so callers can handle it.
    if (!json.data) {
      throw new Error(json.errors[0]?.message || 'Erreur lors de la récupération des données');
    }
  }

  return json.data;
}
