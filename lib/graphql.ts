/**
 * GraphQL Client for SIMS Frontend
 * Communicates with Django GraphQL backend
 */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/graphql/';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: (string | number)[];
    locations?: Array<{ line: number; column: number }>;
  }>;
}

export interface GraphQLRequestOptions {
  query: string;
  variables?: Record<string, any>;
  token?: string;
}

/**
 * Execute GraphQL query/mutation
 */
export async function graphqlRequest<T>(
  options: GraphQLRequestOptions
): Promise<GraphQLResponse<T>> {
  const { query, variables, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
    }

    return data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

/**
 * GraphQL Query Helper
 * Supports (query, variables, token) or (operationName, query, variables, token)
 */
export async function query<T>(
  operationNameOrQuery: string,
  queryOrVariables?: any,
  variablesOrToken?: any,
  tokenOrUndefined?: string
): Promise<T> {
  let finalQuery: string;
  let finalVariables: Record<string, any> | undefined;
  let finalToken: string | undefined;

  if (typeof queryOrVariables === 'string') {
    // Case: (operationName, query, variables, token)
    finalQuery = queryOrVariables;
    finalVariables = variablesOrToken;
    finalToken = tokenOrUndefined;
  } else {
    // Case: (query, variables, token)
    finalQuery = operationNameOrQuery;
    finalVariables = queryOrVariables;
    finalToken = variablesOrToken;
  }

  const response = await graphqlRequest<T>({ 
    query: finalQuery, 
    variables: finalVariables, 
    token: finalToken 
  });

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data) {
    throw new Error('No data returned from GraphQL');
  }

  return response.data;
}

/**
 * GraphQL Mutation Helper
 * Supports (mutation, variables, token) or (operationName, mutation, variables, token)
 */
export async function mutate<T>(
  operationNameOrMutation: string,
  mutationOrVariables?: any,
  variablesOrToken?: any,
  tokenOrUndefined?: string
): Promise<T> {
  let finalMutation: string;
  let finalVariables: Record<string, any> | undefined;
  let finalToken: string | undefined;

  if (typeof mutationOrVariables === 'string') {
    // Case: (operationName, mutation, variables, token)
    finalMutation = mutationOrVariables;
    finalVariables = variablesOrToken;
    finalToken = tokenOrUndefined;
  } else {
    // Case: (mutation, variables, token)
    finalMutation = operationNameOrMutation;
    finalVariables = mutationOrVariables;
    finalToken = variablesOrToken;
  }

  const response = await graphqlRequest<T>({ 
    query: finalMutation, 
    variables: finalVariables, 
    token: finalToken 
  });

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data) {
    throw new Error('No data returned from GraphQL');
  }

  return response.data;
}
