import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Define the path to the protobuf files
const PROTO_PATH_USER = path.resolve(process.cwd(), 'protos/user.proto');
const PROTO_PATH_TEAM = path.resolve(process.cwd(), 'protos/team.proto');

// Load protobufs
const packageDefinition = protoLoader.loadSync([PROTO_PATH_USER, PROTO_PATH_TEAM], {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.resolve(process.cwd(), 'protos')],
});

// Load the gRPC package definition
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const adminCrmPackage = protoDescriptor.admin_crm;

// Create the gRPC clients
const grpcHost = process.env.GRPC_HOST || 'localhost:50051';

export const userClient = new adminCrmPackage.UserService(
  grpcHost,
  grpc.credentials.createInsecure()
);

export const teamClient = new adminCrmPackage.TeamService(
  grpcHost,
  grpc.credentials.createInsecure()
);

/**
 * Promisify a gRPC client method
 */
export function promisifyGrpc<T, R>(client: any, method: string): (req: T, metadata?: grpc.Metadata) => Promise<R> {
  return (req: T, metadata?: grpc.Metadata) => {
    return new Promise((resolve, reject) => {
      const callback = (error: grpc.ServiceError | null, response: R) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      };

      if (metadata) {
        client[method](req, metadata, callback);
      } else {
        client[method](req, callback);
      }
    });
  };
}

export const GrpcClient = {
  UserService: {
    Login: promisifyGrpc<any, any>(userClient, 'Login'),
    ListUsers: promisifyGrpc<any, any>(userClient, 'ListUsers'),
    CreateUser: promisifyGrpc<any, any>(userClient, 'CreateUser'),
    UpdateUser: promisifyGrpc<any, any>(userClient, 'UpdateUser'),
    DeleteUser: promisifyGrpc<any, any>(userClient, 'DeleteUser'),
  },
  TeamService: {
    ListTeams: promisifyGrpc<any, any>(teamClient, 'ListTeams'),
    CreateTeam: promisifyGrpc<any, any>(teamClient, 'CreateTeam'),
    UpdateTeam: promisifyGrpc<any, any>(teamClient, 'UpdateTeam'),
    DeleteTeam: promisifyGrpc<any, any>(teamClient, 'DeleteTeam'),
    GetTeam: promisifyGrpc<any, any>(teamClient, 'GetTeam'),
  }
};
