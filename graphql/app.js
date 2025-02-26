import { ApolloServer } from '@apollo/server';
import { User } from './user/app.js';
import { makeExecutableSchema } from '@graphql-tools/schema'; // Import to create schema

async function CreateApollo() {
  // Create the typeDefs and resolvers
  const typeDefs = `
    ${User.typeDefs}
    type Query {
      ${User.queries}
    }
    type Mutation {
      ${User.mutations}
    }
    type Subscription {
      ${User.subscription}
    }
  `;
  
  const resolvers = {
    Query: { ...User.resolvers.queries },
    Mutation: { ...User.resolvers.mutations },
    Subscription: { ...User.resolvers.subscription }
  };

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const gqlServer = new ApolloServer({
    schema, // Use the schema directly here
  });

  await gqlServer.start();

  // Return the gqlServer, schema, typeDefs, and resolvers
  return {
    gqlServer,
    typeDefs, // Return the typeDefs explicitly
    resolvers, // Return the resolvers explicitly
    schema,    // Return the schema explicitly
  };
}

export default CreateApollo;
