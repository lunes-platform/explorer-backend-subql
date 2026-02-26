import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { onError } from '@apollo/client/link/error';
import { GRAPHQL_URL } from '../config';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL, // SubQuery GraphQL Endpoint
});

const retryLink = new RetryLink({
  delay: { initial: 1000, max: 10000, jitter: true },
  attempts: { max: 5, retryIf: (error) => !!error },
});

const errorLink = onError(({ networkError }) => {
  if (networkError) {
    console.warn(`[GraphQL] Network error — retrying: ${networkError.message}`);
  }
});

export const client = new ApolloClient({
  link: from([errorLink, retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
