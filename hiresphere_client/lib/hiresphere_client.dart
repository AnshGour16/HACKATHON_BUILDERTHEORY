import 'package:serverpod_client/serverpod_client.dart';

class Client extends ServerpodClient {
  Client(
    String host, {
    SecurityContext? context,
    AuthenticationKeyManager? authenticationKeyManager,
  }) : super(
          host,
          Protocol(),
          securityContext: context,
          authenticationKeyManager: authenticationKeyManager,
        );

  @override
  Map<String, EndpointRef> get endpointRefLookup => {};

  @override
  Map<String, ModuleEndpointCaller> get moduleLookup => {};
}

class Protocol extends SerializationManager {
  @override
  Map<String, dynamic> serialize(dynamic object) => {};

  @override
  dynamic deserializeByClassName(Map<String, dynamic> data) => null;
}
