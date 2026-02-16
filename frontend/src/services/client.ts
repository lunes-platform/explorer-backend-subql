import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GRAPHQL_URL } from '../config';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL, // SubQuery GraphQL Endpoint
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
