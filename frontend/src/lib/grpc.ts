import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Define the path to the protobuf files
const PROTO_PATH = path.resolve(process.cwd(), 'protos/user.proto');

// Load protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
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

// Create the gRPC client
const grpcHost = process.env.GRPC_HOST || 'localhost:50051';

export const userClient = new adminCrmPackage.UserService(
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
  }
};
